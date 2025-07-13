"use client";
import { graphqlFetch, queries } from "./lib/apollo-client";
import { formatEther } from "viem";
import { GRAPHQL_ENDPOINT, TWO_WEEKS } from "./lib/config";

import { useEffect, useState } from "react";
import { MetricCard } from "./components/metric-card";
import { TVLChart } from "./components/tvl-chart";
import { TopLPsTable } from "./components/top-lps-table";
import { UserPositionPanel } from "./components/user-position-panel";
import {
  formatDate,
  formatNumberWithCommas,
  sampleDataEveryDay,
  sampleDataWindowByDay,
} from "./lib/utils";

export default function DeFiDashboard() {
  const [userPosition, setUserPosition] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [poolData, setPoolData] = useState<any>(null);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [topLPs, setTopLPs] = useState<any[]>([]);
  const [isLoadingTopLPs, setIsLoadingTopLPs] = useState(true);
  const [topLPsError, setTopLPsError] = useState<string | null>(null);
  const [tvlData, setTvlData] = useState<any[]>([]);
  const [isLoadingTvl, setIsLoadingTvl] = useState(true);
  const [tvlError, setTvlError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoadingPool(true);
        setPoolError(null);
        const data = await graphqlFetch(
          queries.getPoolOverview,
          {},
          GRAPHQL_ENDPOINT
        );
        setPoolData(data);
      } catch (error) {
        console.error("Error fetching pool overview:", error);
        setPoolError(
          error instanceof Error ? error.message : "Failed to fetch pool data"
        );
        setPoolData({ pool: {} });
      } finally {
        setIsLoadingPool(false);
      }
    })();
  }, []);

  // Fetch top LPs data
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingTopLPs(true);
        setTopLPsError(null);
        const data = await graphqlFetch(
          queries.getTopLPs,
          {},
          GRAPHQL_ENDPOINT
        );
        setTopLPs(data?.users || []);
      } catch (error) {
        console.error("Error fetching top LPs:", error);
        setTopLPsError(
          error instanceof Error
            ? error.message
            : "Failed to fetch top LPs data"
        );
        setTopLPs([]);
      } finally {
        setIsLoadingTopLPs(false);
      }
    })();
  }, []);

  // Fetch TVL data
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingTvl(true);
        setTvlError(null);

        // Fetch data in batches until we have enough history
        let allSnapshots: any[] = [];
        let hasEnoughHistory = false;
        let batchSize = 1000;
        let totalFetched = 0;
        let timestampLt: number | undefined = Math.floor(Date.now() / 1000);

        while (!hasEnoughHistory && totalFetched < 100000) {
          const variables: any = { first: batchSize };
          if (timestampLt !== undefined) variables.timestampLt = timestampLt;
          const data = await graphqlFetch(
            queries.getPoolSnapshots,
            variables,
            GRAPHQL_ENDPOINT
          );

          const newSnapshots = data?.poolSnapshots || [];
          allSnapshots = [...allSnapshots, ...newSnapshots];
          totalFetched += newSnapshots.length;

          if (newSnapshots.length > 0) {
            timestampLt = Math.min(
              ...newSnapshots.map((s: any) => s.timestamp)
            );
          }

          if (allSnapshots.length > 0) {
            const latestTimestamp = Math.max(
              ...allSnapshots.map((s: any) => s.timestamp)
            );
            const twoWeeksAgo = latestTimestamp - TWO_WEEKS;
            hasEnoughHistory = allSnapshots.some(
              (snapshot: any) => snapshot.timestamp <= twoWeeksAgo
            );
          } else {
            hasEnoughHistory = false;
          }

          if (newSnapshots.length < batchSize) {
            break;
          }
        }

        // Transform the data for the chart
        const transformedSnapshots = allSnapshots.map((snapshot: any) => ({
          timestamp: snapshot.timestamp,
          tvl:
            Number(formatEther(BigInt(snapshot.usd0Balance || 0))) +
            Number(formatEther(BigInt(snapshot.usd0PlusBalance || 0))),
          date: formatDate(snapshot.timestamp),
        }));

        // Check if we have enough historical data (at least 30 days)
        const twoWeeksAgo = Math.floor(Date.now() / 1000) - TWO_WEEKS;
        const hasEnoughHistoryFinal = transformedSnapshots.some(
          (snapshot: any) => snapshot.timestamp <= twoWeeksAgo
        );

        // Sample data to get one point every day
        const sampledData = sampleDataEveryDay(transformedSnapshots);

        // If we don't have enough data points, use all available data
        const finalData =
          sampledData.length > 0 ? sampledData : transformedSnapshots;

        setTvlData(finalData);
      } catch (error) {
        console.error("Error fetching TVL data:", error);
        setTvlError(
          error instanceof Error ? error.message : "Failed to fetch TVL data"
        );
        setTvlData([]);
      } finally {
        setIsLoadingTvl(false);
      }
    })();
  }, []);

  const handleSearchUser = async (address: string) => {
    setIsLoadingUser(true);

    try {
      // First, get the user's current data
      const userData = await graphqlFetch(
        queries.getUserPosition,
        {
          userId: address,
          first: 1,
          skip: 0,
          timestampLt: Math.floor(Date.now() / 1000),
        },
        GRAPHQL_ENDPOINT
      );

      // Fetch user snapshots in batches until we have enough history
      let allUserSnapshots: any[] = [];
      let hasEnoughHistory = false;
      let batchSize = 1000;
      let totalFetched = 0;
      let timestampLt: number | undefined = Math.floor(Date.now() / 1000);

      while (!hasEnoughHistory && totalFetched < 100000) {
        const variables: any = { userId: address, first: batchSize };
        if (timestampLt !== undefined) variables.timestampLt = timestampLt;
        const snapshotData = await graphqlFetch(
          queries.getUserPosition,
          variables,
          GRAPHQL_ENDPOINT
        );

        const newSnapshots = snapshotData?.user?.userSnapshots || [];
        allUserSnapshots = [...allUserSnapshots, ...newSnapshots];
        totalFetched += newSnapshots.length;

        if (newSnapshots.length > 0) {
          timestampLt = Math.min(...newSnapshots.map((s: any) => s.timestamp));
        }

        if (allUserSnapshots.length > 0) {
          const latestTimestamp = Math.max(
            ...allUserSnapshots.map((s: any) => s.timestamp)
          );
          const twoWeeksAgo = latestTimestamp - TWO_WEEKS;
          hasEnoughHistory = allUserSnapshots.some(
            (snapshot: any) => snapshot.timestamp <= twoWeeksAgo
          );
        } else {
          hasEnoughHistory = false;
        }

        if (newSnapshots.length < batchSize) {
          break;
        }
      }

      // Transform the data to match your expected format
      const rawHistory = allUserSnapshots.map((snapshot: any) => ({
        timestamp: snapshot.timestamp,
        balance: Number(formatEther(BigInt(snapshot.lpTokenBalance || 0))),
        date: formatDate(snapshot.timestamp),
      }));
      const balanceHistory = sampleDataWindowByDay(rawHistory);
      const userPosition = {
        userAddress: address,
        lpTokenBalance: userData?.user?.lpTokenBalance || "0",
        lastActivity: userData?.user?.lastActivity || 0,
        balanceHistory,
      };

      setUserPosition(userPosition);
    } catch (error) {
      console.error("Error fetching user position:", error);
      setUserPosition({});
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Show loading state while fetching pool data
  if (isLoadingPool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading pool data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            USD0/USD0++ Curve Pool Overview
          </h1>
          <p className="text-gray-400">USD0/USD0++ Liquidity Pool Analytics</p>
          {poolError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">
                ⚠️ Using fallback data due to API error: {poolError}
              </p>
            </div>
          )}
        </div>

        {/* Pool Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="USD0 BALANCE IN POOL"
            value={
              poolData?.pool?.usd0Balance
                ? `$${formatNumberWithCommas(
                    Number(formatEther(poolData.pool.usd0Balance))
                  )}`
                : "$0.00"
            }
          />
          <MetricCard
            title="USD0++ BALANCE IN POOL"
            value={
              poolData?.pool?.usd0PlusBalance
                ? `$${formatNumberWithCommas(
                    Number(formatEther(poolData.pool.usd0PlusBalance))
                  )}`
                : "$0.00"
            }
          />
          <MetricCard
            title="TOTAL LP TOKEN SUPPLY"
            value={
              poolData?.pool?.totalSupply
                ? formatNumberWithCommas(
                    Number(formatEther(poolData.pool.totalSupply))
                  )
                : "0.00"
            }
          />
          <MetricCard
            title="TOTAL LIFETIME SWAP VOLUME"
            value={
              poolData?.pool?.volume
                ? `$${formatNumberWithCommas(
                    Number(formatEther(poolData.pool.volume))
                  )}`
                : "$0.00"
            }
          />
          <MetricCard
            title="LIFETIME LIQUIDITY ADDED (USD0 & USD0++)"
            value={
              poolData?.pool?.usd0LiquidityAdded &&
              poolData?.pool?.usd0PlusLiquidityAdded
                ? `$${formatNumberWithCommas(
                    Number(formatEther(poolData.pool.usd0LiquidityAdded)) +
                      Number(formatEther(poolData.pool.usd0PlusLiquidityAdded))
                  )}`
                : "$0.00"
            }
          />
          <MetricCard
            title="LIFETIME LIQUIDITY REMOVED (USD0 & USD0++)"
            value={
              poolData?.pool?.usd0LiquidityRemoved &&
              poolData?.pool?.usd0PlusLiquidityRemoved
                ? `$${formatNumberWithCommas(
                    Number(formatEther(poolData.pool.usd0LiquidityRemoved)) +
                      Number(
                        formatEther(poolData.pool.usd0PlusLiquidityRemoved)
                      )
                  )}`
                : "$0.00"
            }
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TVLChart data={tvlData} isLoading={isLoadingTvl} error={tvlError} />
          <TopLPsTable
            data={topLPs}
            isLoading={isLoadingTopLPs}
            error={topLPsError}
          />
        </div>

        {/* User Position Panel */}
        <UserPositionPanel
          totalSupply={poolData?.pool?.totalSupply || "0"}
          onSearchUser={handleSearchUser}
          userPosition={userPosition}
          isLoading={isLoadingUser}
        />
      </div>
    </div>
  );
}
