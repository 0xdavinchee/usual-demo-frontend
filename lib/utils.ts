import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with commas for better readability
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0.00';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatNumber(value: number | string, decimals = 2): string {
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`
  return `$${num.toFixed(decimals)}`
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateShareOfPool(userBalance: string, totalSupply: string): number {
  const balance = Number.parseFloat(userBalance)
  const total = Number.parseFloat(totalSupply)
  return total > 0 ? (balance / total) * 100 : 0
}

/**
 * Sample data to get one point every day
 * @param data - Array of data points with timestamp
 * @returns Sampled data with one point every day
 */
export function sampleDataEveryDay<T extends { timestamp: number }>(data: T[]): T[] {
  if (data.length === 0) return [];
  
  // Sort data by timestamp (oldest first)
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
  
  const sampledData: T[] = [];
  const oneDayInSeconds = 24 * 60 * 60; // 1 day in seconds
  let lastSampledTimestamp = 0;
  
  // Always include the first data point
  if (sortedData.length > 0) {
    sampledData.push(sortedData[0]);
    lastSampledTimestamp = sortedData[0].timestamp;
  }
  
  // Sample every day
  for (const point of sortedData) {
    if (point.timestamp - lastSampledTimestamp >= oneDayInSeconds) {
      sampledData.push(point);
      lastSampledTimestamp = point.timestamp;
    }
  }
  
  // Always include the last data point if it's different from the last sampled point
  const lastPoint = sortedData[sortedData.length - 1];
  if (lastPoint && lastPoint.timestamp !== lastSampledTimestamp) {
    sampledData.push(lastPoint);
  }
  
  return sampledData;
}
