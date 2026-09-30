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
| Backing / reserve / custody    | https://app.ethena.fi/dashboards/transparency                                             | Official reported data and attestations                                                 | No documented public adapter verified; show unavailable and link to issuer               |
| Gross mint / redemption events | Official verified contracts and indexed primary-market events required                    | Not connected                                                                           | Do not synthesize gross events from supply differences                                   |
| Staking share / realized yield | Vault assets and dated assets-per-share observations required                             | Not connected                                                                           | Do not substitute token counts or third-party USD TVL                                    |
| Cooldown                       | https://docs.ethena.fi/video-guides/how-to-stake-usde and current application             | Configurable contract parameter                                                         | No current on-chain read configured; link current rules instead of freezing old duration |
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
