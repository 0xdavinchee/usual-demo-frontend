// Configuration constants
export const GRAPHQL_ENDPOINT = "https://api.studio.thegraph.com/query/115874/usual-curve-demo/version/latest";

// Pool configuration
export const POOL_ID = "0x1d08E7adC263CfC70b1BaBe6dC5Bb339c16Eec52";

// API configuration
export const API_CONFIG = {
  endpoint: GRAPHQL_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
    // demo api key
    Authorization: `Bearer 358d40d80344753daa83b8d31983d8bc`,
  },
} as const; 