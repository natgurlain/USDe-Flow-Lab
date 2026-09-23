# USDe Flow Lab

USDe Flow Lab is a dark, mobile-first research workspace for comparing USDe circulating supply with the primary-market tape and the market forces that can change mint and redeem incentives.

## What is in this first version

- An Overview that leads with the supply path, shows signed mint and redeem flow, and summarizes carry, perp funding, loop spread and peg conditions.
- Tape, Forces, Events and Methodology pages with the same source labels and shared time-range state.
- A deterministic daily demo archive from February 2024 through today. It reproduces the requested climb toward $14.8B in October 2025, a sharp decline, a second drop toward $3.9B in April 2026, and a recovery toward $4.9B.
- A server-side DeFiLlama adapter for USDe circulating history and per-chain supply. It is enabled by default. If the source is unavailable, the route returns the demo snapshot with a stale label.
- A provider boundary in src/lib/data-provider.ts. Tape, market forces, concentration, fee schedule, backing mix and event labels are still simulated and are explicitly marked as such.
- A Postgres daily snapshot table and an optional Vercel Cron handler. The schema and route are present; persistent writes activate only when DATABASE_URL and CRON_SECRET are configured.

The live adapter currently replaces supply history and chain distribution only. It does not yet make the mint/redeem tape or force attribution live. The Overview states this directly so real supply is not accidentally paired with simulated drivers as a causal explanation.

## Local setup

Requirements: Node.js 20.9 or later and pnpm.

~~~sh
pnpm install
cp .env.example .env.local
pnpm dev
~~~

Open http://localhost:3000. Set USDE_DATA_PROVIDER=mock for a fully offline demo. Without that setting, the browser calls the same-origin dashboard route; that server route fetches DeFiLlama and uses a five-minute upstream cache. The browser never calls the data provider directly.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| USDE_DATA_PROVIDER | No | Use defillama by default, or mock for the deterministic offline dataset. |
| DATABASE_URL | No | Postgres URL used by the scheduled daily snapshot writer. |
| CRON_SECRET | No | Bearer secret required to run the scheduled snapshot writer. |

The dashboard works without a database. To enable scheduled persistence, create a Postgres database, apply sql/schema.sql, then configure DATABASE_URL and CRON_SECRET in Vercel for Production and Preview as appropriate. The daily cron runs at 05:00 UTC. It stores the live supply point and leaves non-live flow/force columns NULL rather than recording demo values as observations.

## Routes and refresh behavior

- GET /api/dashboard serves the provider result. DeFiLlama fetches revalidate after five minutes; the route response uses a short shared cache with stale-while-revalidate.
- GET /api/cron/refresh is scheduled once per day by vercel.json. It is a no-op until both DATABASE_URL and CRON_SECRET exist, and then rejects requests without the matching Bearer token.
- The browser refreshes the same-origin dashboard route every two minutes and keeps the last rendered snapshot if refresh fails.

## Data tables

The first persistent table is dashboard_daily, defined in sql/schema.sql:

| Column | Meaning |
| --- | --- |
| day | UTC date and primary key |
| supply_usd | Circulating USDe supply from the live supply provider |
| minted_usde, redeemed_usde, net_usde | Nullable primary-market values; remain NULL until a live tape provider exists |
| susde_apy, tbill_apy, eth_funding_7d, loop_spread_bps, peg_bps, force_score | Nullable force values; remain NULL until their live sources are connected |
| supply_source, flow_source, force_source | Source names for values written on the row |
| updated_at | Time the daily point was last upserted |

## Add a new force

1. Add its typed values to ForcePoint in src/lib/types.ts.
2. Generate deterministic values in src/lib/mock-data.ts and state the simulation assumptions beside the generator.
3. Add the live adapter in src/lib/data-provider.ts. Keep secrets on the server, cache upstream requests there, and leave missing values explicitly stale or unavailable.
4. Add the mint-side and redeem-side interpretation in src/components/primitives.tsx. Give the force a visible reading, a 90-day sparkline, and a one-sentence definition.
5. Add the detail chart and its unit formatting in src/components/charts.tsx, then show it on the Forces page.
6. If the value is persisted, add a nullable column to sql/schema.sql and to the snapshot writer. Never store simulated data in a live-source column.

## ForceScore

The index uses trailing 90-observation z-scores and the fixed default weights:

~~~text
+ 0.30 × z(sUSDe APY − T-bill)
+ 0.25 × z(ETH funding 7d)
+ 0.25 × z(loop spread)
+ 0.15 × z(peg premium − mint fee)
− 0.05 × z(redemption stress)
~~~

The page plots the score at day t against net flow from t+1 through t+7. The index is a transparent descriptive heuristic; it is not a forecast and has no proven R².

## Deploy to Vercel

This is a standard Next.js App Router project. Import the repository in Vercel or deploy the project root with the Vercel connector. The production build requires no Ethena API key and no database. The public DeFiLlama adapter can fail independently without making the site blank.

Configure DATABASE_URL and CRON_SECRET only when a Postgres database is ready. Until then, the scheduled route reports that persistence is disabled and the dashboard continues to use live DeFiLlama supply with visibly simulated tape and force panels.

## Caveats

The demo transactions, minter identities, collateral allocation, staking ratio, backing mix, fees, loop exposure, force histories and event labels are synthetic. The October 2025 and April 2026 annotations follow the supplied research brief and need primary-source verification. Secondary-market volume is not mint/redeem volume. This dashboard does not execute trades or mint/redeem USDe.
