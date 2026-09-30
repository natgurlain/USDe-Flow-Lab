# Ethena Explained

An independent, mobile-first Ethena dashboard for people who want to understand
the dollars, yield, and risks before exploring the technical details.

## Views

- **Overview:** four headline readings and a compact backing summary, plain-English observations, supply and
  daily price charts, USDe/sUSDe/ENA explanations, and a separate ecosystem panel.
- **USDe Flow:** calendar-date supply comparisons, daily differences, aligned
  network distribution, and a bounded day of finalized Ethereum Mint/Redeem events.
- **Yield:** realized trailing 7/30-day vault APY, current cooldown and staking
  participation, provider estimate history, and an editable illustration.
- **Backing & Risks:** dated issuer backing coverage, reserve and category
  composition, official attestations, and six plain-language risk explanations.
- **Learn:** short answers and a glossary. **Sources & methods:** every metric's
  calculation, coverage, unit, observation time, fetch time, and freshness window.

Legacy `/tape`, `/forces`, `/events`, and `/methodology` links redirect to the
corresponding new views while retaining valid time ranges.

## Real data and limitations

Connected public feeds: global USDe daily supply, network distribution at matching
sample dates, USDe reference price and daily price history, sUSDe estimated APY
history, and ENA reference price. See [the source matrix](docs/source-matrix.md).

The Overview prefers **realized trailing seven-day APY**, calculated from the
vault's underlying assets-per-share exchange rate at finalized Ethereum blocks.
It falls back to the explicitly labeled provider estimate when realized readings
are unavailable. Past returns are annualized, not forecasts. The estimate chart
remains separate and uses DeFiLlama's annualization methodology.

Official issuer feeds provide timestamped backing assets, reserve fund, matching
USDe supply and category composition. Coverage includes the reserve once and uses
the issuer's matching denominator; category shares use their separately dated
subtotal. These are issuer reports, not an independent solvency verification.
Custodian/counterparty concentrations remain unavailable; dated attestations are
linked through the official transparency dashboard.

The flow adapter queries only the official Ethereum issuer's Mint/Redeem events
in a bounded finalized-day window. It excludes transfers, bridges and secondary
trading, deduplicates transaction/log identifiers and verifies the finalized anchor.
It requires the entire query to succeed. It does not promise historical or
multi-network coverage. Supply differences stay separate from gross issuance.

See [integration methods and operating limits](docs/integrations.md) and
[tracked review tickets](docs/review-tickets.md).

Providers fail independently. Production never falls back to synthetic numbers.
An open page retains last verified readings as stale; a new visit can use optional
database snapshots or show unavailable data. Retained observations keep their
original dates. `USDE_DATA_PROVIDER=mock` explicitly enables a visibly labeled demo.

## Local development and LAN review

Node.js 22 and pnpm 9 are required. Vercel uses the tested Node.js 22 runtime.

```sh
pnpm install
cp .env.example .env.local
pnpm dev --hostname 0.0.0.0
```

Visit `http://localhost:3000` or `http://YOUR_LAN_IP:3000` from another device on
that network. For a production-mode local review:

```sh
pnpm build
pnpm start --hostname 0.0.0.0
```

The process needs outbound HTTPS access to the public providers. Provider outages
leave a usable interface with unavailable readings. Public defaults require no API keys. For reliable production archive and log
queries, configure a suitable `ETHEREUM_RPC_URL` on the server. The calculator remains a hypothetical illustration
and never initiates transactions.

## Verification

```sh
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Tests exercise real TypeScript modules through the installed compiler. They cover
calendar ranges, exact supply baselines, timestamp chart gaps, calculator bounds,
backing denominators, category alignment, vault annualization, event deduplication,
finalized-anchor changes, independent failures, provenance retention and demo isolation. Charts expose observations in a keyboard-accessible table.

## Caching and persistence

Normalized, validated HTTP provider results are cached server-side for five minutes;
finalized on-chain groups are cached for fifteen minutes.
Raw global feeds exceed Next.js's 2 MB cache-entry limit, so they are fetched
uncached inside the normalized cache wrapper. Their original acquisition times
are stored alongside observations. The API has a short shared response cache.
The browser checks every five minutes while visible; this does not create new
observations or guarantee provider freshness. Returning to the tab triggers a
refresh; display ages are recalculated every minute. Learn does not fetch providers.
Navigation, the header, and the footer stay mounted across routes. Initial loading
uses quiet panel placeholders; subsequent navigation reuses the session's last
verified readings while fetching updated observations. Refreshes update panels in
place and only show a notice when a source cannot update.

Supply, daily price history and yield use a 36-hour freshness window. Current
market reference prices and on-chain metrics use two hours. Backing categories use
24 hours; backing/reserve reports use 36 hours. These are display thresholds, not risk
thresholds. Charts end at the latest available sample; 24H selects daily samples
one day apart and does not claim an intraday or rolling 24-hour tape.

Persistence is optional. Apply `sql/schema.sql`, then set `DATABASE_URL` and
`CRON_SECRET`. The new `ethena_snapshots` JSONB table preserves metric-level
provenance and series; the legacy `dashboard_daily` table is left intact.
Only the authenticated cron writes to storage. Repeated runs serialize through a
transaction advisory lock and upsert the acquisition day. Missing values can
retain previous verified readings with explicit stale status and original dates.
No production snapshot can have demo mode.

Preview deployments never fall back to the production database. Set an isolated
`PREVIEW_DATABASE_URL` if preview persistence is desired. Secrets remain server-side.
No migration is run automatically inside a public page request.

## Vercel preparation

Import the repository as a Next.js project, use pnpm, and use the project root.
Build command: `pnpm build`. Default production mode works without a database.
For persistence, apply the schema and configure the variables above in their
appropriate environments. The existing cron runs once daily at `0 5 * * *` UTC.
Hobby schedules can run once daily and have approximate execution timing; verify
current plan limits before increasing ingestion frequency:
https://vercel.com/docs/cron-jobs/usage-and-pricing

The bounded recent event adapter does not perform large blockchain backfills.
Extending it to selectable historical ranges requires separate ingestion with
durable checkpoints, bounded batches and documented network/contract coverage.

**Production:** https://ethena-dashboard.vercel.app — Vercel project
`ethena-dashboard` in `nat-4184s-projects`. Published after LAN review and explicit
user approval. The production pages and data API were checked without authentication;
all main pages returned HTTP 200 and the browser loaded the charts without errors.

The checkout is linked through `.vercel/project.json` (gitignored). The Vercel
project is connected to `natgurlain/USDe-Flow-Lab`, with `main` as its production
branch and automatic Git deployments enabled. Every push to `main` starts a
production build; the production domain updates after that build succeeds.
Feature branches use Vercel Preview deployments. Manual recovery deployments can
use `vercel deploy --prod --scope nat-4184s-projects`.
Optional database persistence is not enabled or verified against a live database.
