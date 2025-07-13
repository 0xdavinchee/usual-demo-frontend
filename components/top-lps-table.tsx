import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAddress,
  formatNumberWithCommas,
  formatPercentage,
  formatDate,
} from "@/lib/utils";
import { formatEther } from "viem";
import { useState } from "react";

interface TopLPsTableProps {
  data: Array<{
    id: string;
    lpTokenBalance: string;
    shareOfPool: string;
    lastActivity: number;
    txCount: number;
  }>;
  totalSupply: string;
  isLoading?: boolean;
  error?: string | null;
}

// Copy icon component
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// Check icon component for copy success
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

// Address cell component with tooltip and copy functionality
function AddressCell({ address }: { address: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex items-center gap-2 ${
          isHovered ? "cursor-pointer" : ""
        }`}
      >
        <span
          className={`font-mono transition-all duration-200 ease-in-out ${
            isHovered
              ? "text-blue-300 cursor-pointer underline decoration-blue-300/50"
              : "text-white"
          }`}
          onClick={handleCopy}
        >
          {formatAddress(address)}
        </span>
        <button
          onClick={handleCopy}
          className={`transition-all duration-200 ease-in-out ${
            isHovered
              ? "opacity-100 scale-100 cursor-pointer"
              : "opacity-0 scale-95"
          } ${isCopied ? "text-green-400" : "text-gray-400 hover:text-white"}`}
          title="Copy address"
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>

      {/* Tooltip */}
      <div
        className={`absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg border border-gray-600 z-10 transition-all duration-200 ease-in-out ${
          isHovered
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-1 pointer-events-none"
        }`}
        style={{ minWidth: "max-content" }}
      >
        <div className="font-mono text-xs">{address}</div>

        {/* Tooltip arrow */}
        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
}

export function TopLPsTable({
  data,
  totalSupply,
  isLoading,
  error,
}: TopLPsTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Top Liquidity Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400">Loading top LPs...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Top Liquidity Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-400 text-sm">
              Error loading data: {error}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Top Liquidity Providers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">Wallet Address</TableHead>
              <TableHead className="text-gray-300">LP Token Balance</TableHead>
              <TableHead className="text-gray-300">Share of Pool</TableHead>
              <TableHead className="text-gray-300">Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((lp, index) => (
              <TableRow key={lp.id || index} className="border-gray-700">
                <TableCell>
                  <AddressCell address={lp.id} />
                </TableCell>
                <TableCell className="text-white">
                  {formatNumberWithCommas(
                    Number(formatEther(BigInt(lp.lpTokenBalance)))
                  )}
                </TableCell>
                <TableCell className="text-white">
                  {formatPercentage(Number(lp.shareOfPool) * 100)}
                </TableCell>
                <TableCell className="text-gray-300">
                  {formatDate(lp.lastActivity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
