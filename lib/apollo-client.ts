import { API_CONFIG, POOL_ID } from "./config";

// Simple fetch-based GraphQL client - no complex dependencies!
export async function graphqlFetch<T = any>(
  query: string,
  variables?: any,
  endpoint: string = API_CONFIG.endpoint
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  } catch (error) {
    console.error("GraphQL fetch error:", error);
    throw error;
  }
}

// Type-safe query functions
export const queries = {
  // Example queries - replace with your actual subgraph queries
  getPoolOverview: `
    query GetPoolOverview {
    pool(id: "${POOL_ID}") {
      name
      usd0Balance
      usd0PlusBalance
      totalSupply
      volume
      usd0LiquidityAdded
      usd0LiquidityRemoved
      usd0PlusLiquidityAdded
      usd0PlusLiquidityRemoved
      createdAt
      updatedAt
    }
  }
  `,

  getPoolSnapshots: `
    query GetPoolSnapshots($first: Int!, $skip: Int!) {
    poolSnapshots(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
      timestamp
      usd0Balance
      usd0PlusBalance
      totalSupply
    }
  }
  `,

  getTopLPs: `
    query GetTopLPs {
    users(first: 5, orderBy: lpTokenBalance, orderDirection: desc) {
      id
      lpTokenBalance
      shareOfPool
      lastActivity
      txCount
    }
  }
  `,

  getUserPosition: `
    query GetUserPosition($userId: String!) {
    user(id: $userId) {
      id
      lpTokenBalance
      shareOfPool
      lastActivity
      txCount
      userSnapshots(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
        timestamp
        lpTokenBalance
        shareOfPool
      }
    }
  }
  `,
};
