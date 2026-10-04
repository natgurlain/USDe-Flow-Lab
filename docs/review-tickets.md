# September 30 dashboard review tickets

| Ticket | Scope | Verification |
| --- | --- | --- |
| [#1](https://github.com/natgurlain/ethena-dashboard/issues/1) | Compact Overview, first-screen token explanation, readable provenance, backing links | Desktop/mobile browser review |
| [#2](https://github.com/natgurlain/ethena-dashboard/issues/2) | True time axis, missing-data gaps, percentage peg context, chart-only range controls | Timestamp/gap tests and browser filters |
| [#3](https://github.com/natgurlain/ethena-dashboard/issues/3) | Calculator bounds, dynamic heading, tab-return refresh and aging | Calculation regression tests and browser reproduction |
| [#4](https://github.com/natgurlain/ethena-dashboard/issues/4) | Realized 7/30-day APY, current cooldown and same-block staking participation | Real RPC observations and deterministic vault tests |
| [#5](https://github.com/natgurlain/ethena-dashboard/issues/5) | Issuer backing/reserve and aligned category composition, attestation links | Real issuer responses and report validation tests |
| [#6](https://github.com/natgurlain/ethena-dashboard/issues/6) | Bounded finalized-day issuer events and explorer links | Real event query, deduplication, outage and anchor-change tests |
| [#7](https://github.com/natgurlain/ethena-dashboard/issues/7) | Provider-independent Learn, conditional bundles and sanitized diagnostics | Production build, browser network and outage tests |
| [#8](https://github.com/natgurlain/ethena-dashboard/issues/8) | Explicit compact-currency fraction digits for matching Node/Chrome rendering | Regression test and fresh production hydration checks |
| [#9](https://github.com/natgurlain/ethena-dashboard/issues/9) | Persistent navigation, quiet panel placeholders, retained readings during navigation and refresh | Delayed-request desktop/mobile browser checks and production build |

Implementation and operating limitations: [integrations](integrations.md).
The tickets cover the review improvements, not a claim of complete multi-network
historical issuance coverage or verified counterparty concentration.

## October 4 design and feature tickets

| Ticket | Scope | Verification |
| --- | --- | --- |
| [#10](https://github.com/natgurlain/ethena-dashboard/issues/10) | Fixed 7/30/90-day supply growth and percentages on Overview/Flow | Exact dates, leap days, zero baseline, negative growth and missing-data tests |
| [#11](https://github.com/natgurlain/ethena-dashboard/issues/11) | Dated backing allocation graphic and accessible category/value/share table | Existing category alignment tests; desktop/mobile, empty and demo states |
| [#12](https://github.com/natgurlain/ethena-dashboard/issues/12) | ENA milestone view with approval and execution distinguished | Complete daily average, bounded progress and missing-day tests; official governance review |
| [#13](https://github.com/natgurlain/ethena-dashboard/issues/13) | Separate gross-fee and provider-revenue series, Foundation net revenue and purchase states | Protocol/schema validation, partial-day exclusion, exact-window sums, independent failures and stale retention tests |

The accompanying Ethena-inspired redesign uses charcoal surfaces, silver borders,
icy blue accents and a CSS horizon. Mobile navigation includes all views and stays
available while scrolling. Numerical ENA price forecasts and copied third-party
snapshot values are excluded.
