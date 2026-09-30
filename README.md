# Ethena Explained

An independent, mobile-first Ethena dashboard for people who want to understand
the dollars, yield, and risks before exploring the technical details.

## Views

- **Overview:** five headline readings, plain-English observations, supply and
  daily price charts, USDe/sUSDe/ENA explanations, and a separate ecosystem panel.
- **USDe Flow:** calendar-date supply comparisons, daily differences, aligned
  network distribution, and an explanation of primary versus secondary activity.
- **Yield:** sourced sUSDe annualized estimates, history, and an editable illustration.
- **Backing & Risks:** official-report links, honest unavailable states, and six
  plain-language risk explanations.
- **Learn:** short answers and a glossary. **Sources & methods:** every metric's
  calculation, coverage, unit, observation time, fetch time, and freshness window.

Legacy `/tape`, `/forces`, `/events`, and `/methodology` links redirect to the
corresponding new views while retaining valid time ranges.

## Real data and limitations

Connected public feeds: global USDe daily supply, network distribution at matching
sample dates, USDe reference price and daily price history, sUSDe estimated APY
history, and ENA reference price. See [the source matrix](docs/source-matrix.md).

The sUSDe figure is **estimated**, not a realized trailing APY. The inspected
DeFiLlama adapter annualizes the latest reward distribution assuming an eight-hour
interval and weekly compounding. No assumed cooldown duration is displayed.

Backing composition, reserve figures, custody concentration, gross primary-market
events, realized vault returns, and staking participation are **not connected**.
They show unavailable states and source links. A supply difference is never
presented as measured gross mint/redemption activity. Historical event narratives
and the mixed live/demo ForceScore have been removed from production readings.

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
leave a usable interface with unavailable readings. No API keys are required for
the currently connected feeds. The calculator remains a hypothetical illustration
and never initiates transactions.

## Verification

```sh
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Tests exercise real TypeScript modules through the installed compiler. They cover
calendar ranges, exact supply baselines, missing days, peg units, compounded yield,
source validation, independent failures, original provenance retention, and demo
isolation. Charts expose observations in a keyboard-accessible table.

## Caching and persistence

Normalized, validated provider results are cached server-side for five minutes.
Raw global feeds exceed Next.js's 2 MB cache-entry limit, so they are fetched
uncached inside the normalized cache wrapper. Their original acquisition times
are stored alongside observations. The API has a short shared response cache.
The browser checks every five minutes while visible; this does not create new
observations or guarantee provider freshness.

Supply, daily price history and yield use a 36-hour freshness window. Current
market reference prices use two hours. These are display thresholds, not risk
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

Do not attempt large blockchain backfills inside page or cron requests. A future
event indexer needs verified contracts, ABIs, bounded batches, durable checkpoints,
reorg handling, idempotent event identifiers, and stated network coverage before
gross mint/redemption data can be published.

**Production:** https://ethena-dashboard.vercel.app — Vercel project
`ethena-dashboard` in `nat-4184s-projects`. Published after LAN review and explicit
user approval. The production pages and data API were checked without authentication;
all main pages returned HTTP 200 and the browser loaded the charts without errors.

The checkout is linked through `.vercel/project.json` (gitignored). This release
was uploaded directly with the Vercel CLI. GitHub repository connection failed,
so automatic deployment on Git pushes is not configured. Future releases can use
`vercel deploy --prod --scope nat-4184s-projects` until repository access is repaired.
Optional database persistence is not enabled or verified against a live database.
