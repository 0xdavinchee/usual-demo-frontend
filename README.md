# USD0/USD0++ Pool Dashboard Demo

This project is a demo analytics dashboard for the USD0/USD0++ Curve pool, built with Next.js and React. It visualizes real-time and historical data from a subgraph (powered by The Graph) and provides insights into liquidity, top LPs, and user positions.

## Features
- **Pool Overview:** Key metrics for the USD0/USD0++ pool (balances, TVL, swap volume, liquidity added/removed).
- **TVL Chart:** Historical Total Value Locked, sampled daily.
- **Top LPs Table:** See the largest liquidity providers and their stats.
- **User Position Panel:** Search any wallet to view their LP balance history and share of pool.
- **Responsive UI:** Modern, dark-themed dashboard with interactive charts (Recharts).

## Data Source
- All data is fetched from a [The Graph](https://thegraph.com/) subgraph endpoint:
  - `https://api.studio.thegraph.com/query/115874/usual-demo/version/latest`
- See `lib/config.ts` for configuration.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   # or
yarn install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   # or
yarn dev
   ```

3. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- `dashboard.tsx` — Main dashboard logic and data fetching
- `components/` — UI components (charts, tables, cards, etc.)
- `lib/apollo-client.ts` — GraphQL client and queries
- `lib/config.ts` — Subgraph endpoint configuration
- `app/` — Next.js app directory (entry point, layout, global styles)

## API Keys & Security
- This demo does **not** require a private API key. The subgraph endpoint is public.
- If you add any API keys for other services, store them in `.env.local` and **never** commit them to version control.
- For demo purposes, some fallback/mock data is used if the subgraph is unavailable.

## Notes
- This project is for demonstration and interview purposes only. It is not production-ready.
- The focus is on data visualization and subgraph integration, not frontend polish or security best practices.
