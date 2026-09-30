# Verified integrations (September 30, 2026)

## Issuer backing

The official transparency application itself uses:

- `https://app.ethena.fi/api/collateralization/status`: timestamp, backing assets,
  reserve fund and matching USDe supply.
- `https://app.ethena.fi/api/collateral-breakdown/historical?startTimestamp=...`:
  dated category histories. Fetch the most recent seven calendar days, cache the
  normalized result, and select the latest timestamp present in every category.

These endpoints were discovered in the public application and verified with real
responses. They are not a documented third-party API contract or SLA. If the
schema changes, validation fails and readings remain unavailable or last verified.
We do not use the whitelisted minting API or bypass authentication.

Backing coverage = (reported backing assets + reported reserve) / reported supply
× 100. The reserve is counted once. Category percentages use their own aligned
subtotal, not the separately timed supply/backing report. Do not add either
subtotal to the other. Values and attestations are issuer reporting, not our audit.

Custodian and counterparty concentration is still unknown. The official
[transparency dashboard](https://app.ethena.fi/dashboards/transparency) links dated
custodian attestations. No exposure percentages are inferred from category names.

## Ethereum vault

The sUSDe address used in the official application's public configuration is
`0x9d39a5de30e57443bff2a8307a4256c8797a3497`.
The issuer's [staking source](https://github.com/ethena-labs/bbp-public-assets/tree/main/contracts/contracts)
confirms ERC-4626 semantics, reward vesting and configurable cooldown.

Verify Ethereum chain ID 1. Read `totalAssets()`, `cooldownDuration()`,
`convertToAssets(1e18)` and `asset()` at finalized blocks. Validate the underlying
asset against canonical USDe. Read USDe `totalSupply()` at the same block for the
staking denominator. `totalAssets()` excludes unvested rewards and the cooldown
silo; the canonical supply includes tokens held in bridge contracts.

For trailing seven/thirty-day returns, binary-search the latest block at or before
the requested timestamp within a bounded recent bracket. Reject a baseline more
than sixty seconds before its target. Use actual elapsed seconds:

`APY = ((ending assets per share / starting assets per share)^(365 days / elapsed) - 1) * 100`

This is an annualized realized vault exchange-rate return, before fees/taxes and
without market-price movements. It does not predict future income. The existing
DeFiLlama estimate history is a distinct series and is labeled accordingly.

Public dRPC supports these reads in the verified local run. PublicNode and 1RPC
are fallback readers for individual failed public requests. A custom RPC override
uses only the configured provider. Set `ETHEREUM_RPC_URL`
for a production provider with archive state. Each adapter has an eighteen-second
request budget; each RPC has at most eight seconds. On-chain results are cached
for fifteen minutes and retain their original fetch and observation timestamps.

## Primary-market events

The production issuer address is
`0xe3490297a08d6fc8da46edb7b6142e4f461b62d3`, verified in
[official minting docs](https://docs.ethena.fi/api-documentation/overview).
The [ABI linked by those docs](https://gist.github.com/mcevoyinit/0660818e968a6a46603e06fa80b20d40)
defines `Mint` and `Redeem` with three indexed fields and four data words. The
fourth data word is `usde_amount`, using USDe's eighteen decimals.

The adapter reads approximately one day ending at a finalized block, entirely
after the already deployed issuer contract. It never backfills from deployment.
It filters by the issuer address and the two exact event topics, validates the
ABI shape and block range, excludes removed events, deduplicates transaction hash
plus log index, rejects conflicting duplicates, and rechecks the finalized anchor.
Failed or range-limited queries produce no partial totals. Zero is shown only
when a complete query returns no matching events.

PublicNode supported the complete recent log range in the verified local run.
Public block reads fall back to dRPC/1RPC if one reader rejects them; log range
limitations remain errors and never yield partial totals.
Public provider capabilities vary; the same configurable server RPC can replace
both defaults. Some free services limit logs to fifty blocks and cannot support
this adapter. All totals explicitly show Ethereum issuer, blocks, UTC dates and
freshness. The twenty most recent events link to Etherscan, with no inferred
account names. Global supply changes, bridges and secondary trades remain separate.

Longer selectable event histories need a separate durable indexer. They are not
claimed by this release. A bounded finalized-window query avoids persistent
checkpoints and reorg mutation; a future ongoing indexer must implement both.

## Failures and deployment

Adapters run independently. Structured `provider_failure` logs contain only
provider identifiers, a generic failure category and timestamp; credentials and
raw provider messages are never logged or returned to browsers. The UI reports
partial update failures and retains original dates. The Learn route neither
fetches providers nor starts refresh requests.

No new environment variable is required for LAN review. Configure production RPC
capacity before scaling traffic. Optional snapshot persistence remains separate
from RPC reads and is documented in README. This revision requires local review
before publishing to Vercel.
