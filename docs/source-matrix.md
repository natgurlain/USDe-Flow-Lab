# Ethena Explained: source matrix and implementation plan

| Metric                         | Source                                                                                    | Observation / method                                                                    | Coverage and limitation                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| USDe supply                    | https://stablecoins.llama.fi/stablecoin/146                                               | Timestamped global `tokens[].circulating.peggedUSD`                                     | Daily aggregate; do not sum bridge balances into global supply                           |
| Chain distribution             | Same endpoint                                                                             | Chain history at latest global sample date                                              | Only aligned chain samples; show covered subtotal, not an assumed global partition       |
| USDe market price              | https://coins.llama.fi/prices/current/ethereum:0x4c9edd5852cd905f086c759e8383e09bff1e68b3 | Provider timestamp                                                                      | Aggregated reference price, not an executable quote                                      |
| Daily price history            | https://stablecoins.llama.fi/stablecoinprices                                             | `prices['ethena-usde']`, UTC sample date                                                | Daily observations; no intraday history claim                                            |
| sUSDe estimated APY            | https://yields.llama.fi/chart/66985a81-9c51-46ca-9977-42b4fe7bc6df                        | Timestamped APY; latest reward distribution annualized, weekly compounding              | Ethereum sUSDe vault only; not realized trailing return or guaranteed yield              |
| Yield calculation              | https://github.com/DefiLlama/yield-server/blob/master/src/adaptors/ethena-usde/index.js   | Latest RewardsReceived amount × 3 × 365 / vault USD TVL; APR converted using 52 periods | Adapter assumes an eight-hour reward interval; methodology may change upstream           |
| ENA price                      | https://coins.llama.fi/prices/current/coingecko:ethena                                    | Provider timestamp                                                                      | Market price; no claim of equity or revenue entitlement                                  |
| Backing / reserve | Official `/api/collateralization/status` | (Backing + reserve) / matching issuer supply | Same reporting timestamp; issuer-reported, reserve counted once |
| Backing categories | Official `/api/collateral-breakdown/historical` | Latest common timestamp across all categories | Separate category subtotal; not added to coverage report |
| Custody concentration | Official transparency attestations | Report links only | No inferred numerical exposures |
| Gross mint / redemption | Official Ethereum issuer `0xe349…62d3` | Finalized Mint/Redeem `usde_amount`, bounded recent day | Ethereum issuer only; not historical or multi-network completeness |
| Realized yield | Official Ethereum sUSDe vault `0x9d39…3497` | `convertToAssets(1e18)` change, actual elapsed 7/30 days | Annualized APY; future returns vary |
| Staking participation | Same-block vault `totalAssets()` / canonical USDe `totalSupply()` | Underlying assets and issued supply | Excludes unvested rewards/cooldown silo; includes bridge-locked supply |
| Cooldown | Ethereum vault `cooldownDuration()` | Current finalized-block setting | Can change; no historical constant hardcoded |
| ENA governance                 | https://docs.ethena.fi/ and https://gov.ethenafoundation.com/                             | Educational role with official links                                                    | No news/events or numerical governance data invented                                     |
| USDtb                          | https://usdtb.money/                                                                      | Separate treasury-backed product                                                        | Educational link; excluded from USDe supply totals                                       |

Public endpoints were inspected on 2026-09-30. Availability is not an SLA.
The DeFiLlama yield adapter is licensed under the yield-server repository's
license; this app consumes public JSON rather than copying adapter source.
Check provider usage terms before scaling requests commercially.

Implementation order:

1. Replace mixed mock/live snapshots with typed metric provenance, validated
   independent adapters, calendar-date calculations and explicit unavailable states.
2. Build Overview and USDe Flow, then Yield, Backing & Risks, Learn and Sources.
3. Keep a separate explicit demo mode; optionally persist verified snapshots
   with read-only fallbacks, authenticated daily cron and isolated preview storage.
4. Test financial/date calculations and failures; lint, type-check, build and
   verify desktop/mobile in a browser. Serve on LAN for user review.
5. Deploy to Vercel only after the user's explicit confirmation.

New adapter details, verified sources and public-provider limits: [integrations](integrations.md).
Review implementation tickets: [ticket index](review-tickets.md).

## October 4 additions

| Metric | Source | Calculation and limitation |
| --- | --- | --- |
| 7/30/90-day USDe growth | Existing global USDe daily supply | Exact UTC endpoint dates; percentage divides change by baseline; zero baselines have no percentage |
| ENA milestone schedule and approval | [Official governance thread](https://gov.ethenafoundation.com/t/ena-fee-switch-activation/830) and its linked Snapshot vote | Published Aug 27, approval reported Sep 8; reviewed Oct 4. Static dated evidence, not a live activation feed |
| 14-day supply average | Existing global daily supply | Arithmetic mean of 14 consecutive daily samples; no interpolation. Comparison to the committee recommendation; implemented trigger adoption is unverified here |
| USDe tracked gross fees | `https://api.llama.fi/summary/fees/ethena-usde?dataType=dailyFees` | Protocol `4133`; mint fees and reward distributions. Sum complete 7/30 UTC days; current day excluded |
| USDe provider revenue | `https://api.llama.fi/summary/fees/ethena-usde?dataType=dailyRevenue` | Protocol `4133`; mint fees and reserve allocations. Independent feed and dates; not Foundation net revenue |
| Fee/revenue definitions | [Official DeFiLlama adapter](https://github.com/DefiLlama/dimension-adapters/blob/master/fees/ethena.ts) | Inspected Oct 4. Definitions may change upstream |
| Foundation net revenue / executed ENA purchases | [Official transparency dashboard](https://app.ethena.fi/dashboards/transparency) | Report link only; no verified numerical feed connected and no values inferred from gross fees |

Live public fee/revenue payloads were inspected on October 4. Locally computed
complete 7/30-day totals matched their provider aggregates. Economics has a
48-hour freshness window and independent stale-series retention. No schema
migration or stored snapshot version change is required.
