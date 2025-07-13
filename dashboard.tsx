"use client";
import { graphqlFetch, queries } from "./lib/apollo-client";
import { formatEther } from "viem";
import { GRAPHQL_ENDPOINT } from "./lib/config";

import { useEffect, useState } from "react";
import { MetricCard } from "./components/metric-card";
import { TVLChart } from "./components/tvl-chart";
import { TopLPsTable } from "./components/top-lps-table";
import { UserPositionPanel } from "./components/user-position-panel";
import { formatDate, formatNumberWithCommas, sampleDataEveryDay } from "./lib/utils";

// Mock data - replace with actual GraphQL queries
const mockPoolData = {
  usd0Balance: "2500000",
  usd0PlusBalance: "2300000",
  totalSupply: "4750000",
  totalSwapVolume: "15600000",
  totalLiquidityAdded: "8900000",
  totalLiquidityRemoved: "4150000",
  tvl: "4800000",
};

const mockTVLData = Array.from({ length: 30 }, (_, i) => ({
  timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
  tvl: 4800000 + Math.random() * 500000 - 250000,
  date: new Date(
    Date.now() - (29 - i) * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }),
}));

const mockTopLPs = [
  {
    userAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b9",
    lpTokenBalance: "125000",
    lastActivity: 1704067200,
  },
  {
    userAddress: "0x8ba1f109551bD432803012645Hac136c22C501e",
    lpTokenBalance: "98500",
    lastActivity: 1703980800,
  },
  {
    userAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    lpTokenBalance: "87200",
    lastActivity: 1703894400,
  },
  {
    userAddress: "0xA0b86a33E6441E6C7D3b4c6C8b8b8b8b8b8b8b8b",
    lpTokenBalance: "76800",
    lastActivity: 1703808000,
  },
  {
    userAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    lpTokenBalance: "65400",
    lastActivity: 1703721600,
  },
];

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
        console.log("Pool overview:", data);
        setPoolData(data);
      } catch (error) {
        console.error("Error fetching pool overview:", error);
        setPoolError(
          error instanceof Error ? error.message : "Failed to fetch pool data"
        );
        // Fallback to mock data if API fails
        setPoolData({ pool: mockPoolData });
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
        console.log("Top LPs:", data);
        setTopLPs(data?.users || []);
      } catch (error) {
        console.error("Error fetching top LPs:", error);
        setTopLPsError(
          error instanceof Error ? error.message : "Failed to fetch top LPs data"
        );
        // Fallback to mock data if API fails
        setTopLPs(mockTopLPs);
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
        let skip = 0;
        let totalFetched = 0;
        
        while (!hasEnoughHistory && totalFetched < 100000) { // Limit to prevent infinite loops
          const data = await graphqlFetch(
            queries.getPoolSnapshots,
            { first: batchSize, skip: skip },
            GRAPHQL_ENDPOINT
          );
          
          const newSnapshots = data?.poolSnapshots || [];
          allSnapshots = [...allSnapshots, ...newSnapshots];
          totalFetched += newSnapshots.length;
          skip += batchSize; // Increment skip for next batch
          
          // Check if we have enough historical data (at least 2 weeks)
          const twoWeeksAgo = Math.floor(Date.now() / 1000) - (14 * 24 * 60 * 60);
          hasEnoughHistory = allSnapshots.some((snapshot: any) => snapshot.timestamp <= twoWeeksAgo);
          
          console.log(`Fetched batch of ${newSnapshots.length} snapshots (skip: ${skip - batchSize}, total: ${totalFetched})`);
          
          // If we got fewer snapshots than requested, we've reached the end
          if (newSnapshots.length < batchSize) {
            console.log('Reached end of available data');
            break;
          }
        }
        
        console.log(`Total snapshots fetched: ${allSnapshots.length}`);
        
        // Transform the data for the chart
        const transformedSnapshots = allSnapshots.map((snapshot: any) => ({
          timestamp: snapshot.timestamp,
          tvl: 
          Number(formatEther(BigInt(snapshot.usd0Balance || 0))) + 
               Number(formatEther(BigInt(snapshot.usd0PlusBalance || 0))),
          date: formatDate(snapshot.timestamp),
        }));
        
        // Check if we have enough historical data (at least 30 days)
        const twoWeeksAgo = Math.floor(Date.now() / 1000) - (14 * 24 * 60 * 60);
        const hasEnoughHistoryFinal = transformedSnapshots.some((snapshot: any) => snapshot.timestamp <= twoWeeksAgo);
        
        console.log(`Earliest timestamp: ${transformedSnapshots.length > 0 ? new Date(transformedSnapshots[0].timestamp * 1000).toISOString() : 'No data'}`);
        console.log(`30 days ago: ${new Date(twoWeeksAgo * 1000).toISOString()}`);
        console.log(`Has enough history: ${hasEnoughHistoryFinal}`);
        
        // Sample data to get one point every day
        const sampledData = sampleDataEveryDay(transformedSnapshots);
        
        // If we don't have enough data points, use all available data
        const finalData = sampledData.length > 0 ? sampledData : transformedSnapshots;
        
        console.log(`Sampled to ${finalData.length} points`);
        setTvlData(finalData);
        console.log(finalData);
      } catch (error) {
        console.error("Error fetching TVL data:", error);
        setTvlError(
          error instanceof Error ? error.message : "Failed to fetch TVL data"
        );
        // Fallback to mock data if API fails
        setTvlData(mockTVLData);
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
        { userId: address, first: 1, skip: 0 },
        GRAPHQL_ENDPOINT
      );
      
      // Fetch user snapshots in batches until we have enough history
      let allUserSnapshots: any[] = [];
      let hasEnoughHistory = false;
      let batchSize = 1000;
      let skip = 0;
      let totalFetched = 0;
      
      while (!hasEnoughHistory && totalFetched < 100000) { // Limit to prevent infinite loops
        const snapshotData = await graphqlFetch(
          queries.getUserPosition,
          { userId: address, first: batchSize, skip: skip },
          GRAPHQL_ENDPOINT
        );
        
        const newSnapshots = snapshotData?.user?.userSnapshots || [];
        allUserSnapshots = [...allUserSnapshots, ...newSnapshots];
        totalFetched += newSnapshots.length;
        skip += batchSize; // Increment skip for next batch
        
        // Check if we have enough historical data (at least 2 weeks)
        const twoWeeksAgo = Math.floor(Date.now() / 1000) - (14 * 24 * 60 * 60);
        hasEnoughHistory = allUserSnapshots.some((snapshot: any) => snapshot.timestamp <= twoWeeksAgo);
        
        console.log(`Fetched batch of ${newSnapshots.length} user snapshots (skip: ${skip - batchSize}, total: ${totalFetched})`);
        
        // If we got fewer snapshots than requested, we've reached the end
        if (newSnapshots.length < batchSize) {
          console.log('Reached end of available user data');
          break;
        }
      }
      
      console.log(`Total user snapshots fetched: ${allUserSnapshots.length}`);

      // Transform the data to match your expected format
      const userPosition = {
        userAddress: address,
        lpTokenBalance: userData?.user?.lpTokenBalance || "0",
        lastActivity: userData?.user?.lastActivity || 0,
        balanceHistory: allUserSnapshots.map((snapshot: any) => ({
          timestamp: snapshot.timestamp,
          balance: Number(formatEther(BigInt(snapshot.lpTokenBalance || 0))),
          date: formatDate(snapshot.timestamp),
        })),
      };

      setUserPosition(userPosition);
    } catch (error) {
      console.error("Error fetching user position:", error);
      // Fallback to mock data for now
      const mockUserPosition = {
        userAddress: address,
        lpTokenBalance: "45000",
        lastActivity: 1704067200,
        balanceHistory: Array.from({ length: 15 }, (_, i) => ({
          timestamp: Date.now() - (14 - i) * 24 * 60 * 60 * 1000,
          balance: 45000 + Math.random() * 10000 - 5000,
          date: new Date(
            Date.now() - (14 - i) * 24 * 60 * 60 * 1000
          ).toLocaleDateString('en-US', {
            timeZone: 'UTC',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        })),
      };
      setUserPosition(mockUserPosition);
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
                ? `$${formatNumberWithCommas(Number(formatEther(poolData.pool.usd0Balance)))}`
                : "$0.00"
            }
          />
          <MetricCard
            title="USD0++ BALANCE IN POOL"
            value={
              poolData?.pool?.usd0PlusBalance
                ? `$${formatNumberWithCommas(Number(formatEther(poolData.pool.usd0PlusBalance)))}`
                : "$0.00"
            }
          />
          <MetricCard 
            title="TOTAL LP TOKEN SUPPLY" 
            value={
              poolData?.pool?.totalSupply
                ? formatNumberWithCommas(Number(formatEther(poolData.pool.totalSupply)))
                : "0.00"
            }
          />
          <MetricCard
            title="TOTAL LIFETIME SWAP VOLUME"
            value={
              poolData?.pool?.volume
                ? `$${formatNumberWithCommas(Number(formatEther(poolData.pool.volume)))}`
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
                    Number(formatEther(poolData.pool.usd0PlusLiquidityRemoved))
                  )}`
                : "$0.00"
            }
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TVLChart 
            data={tvlData} 
            isLoading={isLoadingTvl}
            error={tvlError}
          />
          <TopLPsTable
            data={topLPs}
            totalSupply={poolData?.pool?.totalSupply || "0"}
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
