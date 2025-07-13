"use client"

import { useState } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatNumberWithCommas, formatPercentage, formatDate, calculateShareOfPool } from "@/lib/utils"
import { formatEther } from "viem"

interface UserPosition {
  userAddress: string
  lpTokenBalance: string
  usd0Balance: string
  usd0PlusBalance: string
  lastActivity: number
  balanceHistory: Array<{
    timestamp: number
    balance: number
    date: string
  }>
}

interface UserPositionPanelProps {
  totalSupply: string
  onSearchUser: (address: string) => void
  userPosition?: UserPosition
  isLoading?: boolean
}

export function UserPositionPanel({ totalSupply, onSearchUser, userPosition, isLoading }: UserPositionPanelProps) {
  const [searchAddress, setSearchAddress] = useState("")

  const handleSearch = () => {
    if (searchAddress.trim()) {
      onSearchUser(searchAddress.trim())
    }
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">User Position Panel (Optional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter wallet address..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSearch();
              }
            }}
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          />
          <Button onClick={handleSearch} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? "Loading..." : "Search"}
          </Button>
        </div>

        {userPosition && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">LP Token Balance</h4>
                <p className="text-lg font-bold text-white">
                  {formatNumberWithCommas(Number(formatEther(BigInt(userPosition.lpTokenBalance))))}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Share of Pool</h4>
                <p className="text-lg font-bold text-white">
                  {formatPercentage(calculateShareOfPool(userPosition.lpTokenBalance, totalSupply))}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Last Activity</h4>
              <p className="text-white">{formatDate(userPosition.lastActivity)}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">LP Balance History</h4>
              {userPosition && (
                (() => {
                  const sortedData = [...userPosition.balanceHistory].sort((a, b) => a.timestamp - b.timestamp);
                  const balances = sortedData.map(d => d.balance);
                  const minBalance = Math.min(...balances);
                  const maxBalance = Math.max(...balances);
                  // Add a small buffer to min/max for better visuals
                  const buffer = (maxBalance - minBalance) * 0.05 || 1; // fallback to 1 if flat
                  const yDomain = [
                    Math.floor(minBalance - buffer),
                    Math.ceil(maxBalance + buffer)
                  ];
                  // Adaptive tick formatter
                  const adaptiveTickFormatter = (value: number) => {
                    if (Math.abs(maxBalance) >= 1e6 || Math.abs(minBalance) >= 1e6) {
                      return `${(value / 1e6).toFixed(2)}M`;
                    } else if (Math.abs(maxBalance) >= 1e3 || Math.abs(minBalance) >= 1e3) {
                      return `${(value / 1e3).toFixed(2)}K`;
                    } else {
                      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
                    }
                  };
                  console.log('UserPositionPanel balanceHistory:', sortedData);
                  return (
                    <ChartContainer
                      config={{
                        balance: {
                          label: "LP Balance",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[200px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sortedData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                          <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            domain={yDomain}
                            allowDataOverflow={false}
                            tickFormatter={adaptiveTickFormatter}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            contentStyle={{
                              backgroundColor: "#1F2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                            }}
                          />
                          <Line type="monotone" dataKey="balance" stroke="#10B981" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
