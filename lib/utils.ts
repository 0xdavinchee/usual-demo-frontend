import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas for better readability
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(
  value: number | string,
  decimals: number = 2
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "0.00";

  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(value: number | string, decimals = 2): string {
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateShareOfPool(
  userBalance: string,
  totalSupply: string
): number {
  const balance = Number.parseFloat(userBalance);
  const total = Number.parseFloat(totalSupply);
  return total > 0 ? (balance / total) * 100 : 0;
}

/**
 * Sample data to get one point every day
 * @param data - Array of data points with timestamp
 * @returns Sampled data with one point every day
 */
export function sampleDataEveryDay<T extends { timestamp: number }>(
  data: T[]
): T[] {
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

/**
 * Sample data to get one point per day for the last N days (default 14).
 * For each day, use the first data point of that day, or the previous day's value if missing.
 * @param data - Array of data points with timestamp (in seconds)
 * @param windowSeconds - Number of seconds in the window (default: TWO_WEEKS)
 * @returns Array of sampled data, one per day, oldest to newest
 */
export function sampleDataWindowByDay<T extends { timestamp: number }>(
  data: T[]
): T[] {
  if (data.length === 0) return [];
  // Sort by timestamp ascending
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
  // Find the most recent day (UTC)
  const mostRecent = sortedData[sortedData.length - 1];
  const endDate = new Date(mostRecent.timestamp * 1000);
  endDate.setUTCHours(0, 0, 0, 0);
  // Start date is (window-1) days before endDate
  const startDate = new Date(endDate);
  startDate.setUTCDate(endDate.getUTCDate() - 13); // 14 days total

  const result: T[] = [];
  let prev: T | undefined = undefined;
  let dataIdx = 0;

  for (let d = 0; d < 14; d++) {
    const day = new Date(startDate);
    day.setUTCDate(startDate.getUTCDate() + d);
    const dayStart = Math.floor(day.getTime() / 1000);
    const dayEnd = dayStart + 24 * 60 * 60;
    // Find the first data point in this day
    let found: T | undefined = undefined;
    while (dataIdx < sortedData.length) {
      const ts = sortedData[dataIdx].timestamp;
      if (ts >= dayStart && ts < dayEnd) {
        found = sortedData[dataIdx];
        break;
      } else if (ts >= dayEnd) {
        break;
      }
      dataIdx++;
    }
    const dayDateString = new Date(dayStart * 1000).toLocaleDateString(
      "en-US",
      { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }
    );
    if (found) {
      // If found, ensure date field is correct if present
      result.push({
        ...found,
        timestamp: dayStart,
        ...(found.hasOwnProperty("date") ? { date: dayDateString } : {}),
      });
      prev = found;
    } else if (prev) {
      // Use previous day's value, update timestamp and date
      result.push({
        ...prev,
        timestamp: dayStart,
        ...(prev.hasOwnProperty("date") ? { date: dayDateString } : {}),
      });
    } else {
      // If no previous, use the earliest data point, update timestamp and date
      result.push({
        ...sortedData[0],
        timestamp: dayStart,
        ...(sortedData[0].hasOwnProperty("date")
          ? { date: dayDateString }
          : {}),
      });
      prev = sortedData[0];
    }
  }
  return result;
}
