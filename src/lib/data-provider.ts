import type {
  DashboardSnapshot,
  Metric,
  MetricKey,
  SeriesPoint,
} from "./types";
import { supplyDelta, withFreshness } from "./metrics";
import { getMockSnapshot } from "./mock-data";
import { ECONOMIC_SOURCES, economicMetric, parseEconomics } from "./economics";

export const USDE_CONTRACT = "0x4c9edd5852cd905f086c759e8383e09bff1e68b3";
export const SOURCES = {
  supply: "https://stablecoins.llama.fi/stablecoin/146",
  prices: "https://stablecoins.llama.fi/stablecoinprices",
  price: `https://coins.llama.fi/prices/current/ethereum:${USDE_CONTRACT}`,
  yield: "https://yields.llama.fi/chart/66985a81-9c51-46ca-9977-42b4fe7bc6df",
  ena: "https://coins.llama.fi/prices/current/coingecko:ethena",
  backing: "https://app.ethena.fi/dashboards/transparency",
  backingData: "https://app.ethena.fi/api/collateralization/status",
};
export function emptyMetric(
  unit: string,
  sourceUrl: string,
  methodology: string,
  coverage: string,
  maxAgeHours = 36,
): Metric {
  return {
    value: null,
    status: "unavailable",
    source: sourceUrl.includes("llama.fi") ? "DeFiLlama" : "Ethena",
    sourceUrl,
    observedAt: null,
    fetchedAt: null,
    unit,
    methodology,
    coverage,
    maxAgeHours,
  };
}
export function emptySnapshot(
  now = new Date().toISOString(),
): DashboardSnapshot {
  const definitions: Record<MetricKey, Metric> = {
    realized7d: emptyMetric(
      "% APY",
      "https://etherscan.io/address/0x9d39a5de30e57443bff2a8307a4256c8797a3497#readContract",
      "Annualized compounded change in convertToAssets(1e18) over the actual elapsed time between finalized Ethereum blocks approximately seven days apart; excludes market prices and fees.",
      "Ethereum vault · trailing 7 days",
      2,
    ),
    realized30d: emptyMetric(
      "% APY",
      "https://etherscan.io/address/0x9d39a5de30e57443bff2a8307a4256c8797a3497#readContract",
      "Annualized compounded change in convertToAssets(1e18) over the actual elapsed time between finalized Ethereum blocks approximately thirty days apart; excludes market prices and fees.",
      "Ethereum vault · trailing 30 days",
      2,
    ),
    cooldown: emptyMetric(
      "seconds",
      "https://etherscan.io/address/0x9d39a5de30e57443bff2a8307a4256c8797a3497#readContract",
      "cooldownDuration() read at a finalized Ethereum block; the administrative setting may subsequently change.",
      "Current Ethereum vault setting",
      2,
    ),
    vaultAssets: emptyMetric(
      "USDe",
      "https://etherscan.io/address/0x9d39a5de30e57443bff2a8307a4256c8797a3497#readContract",
      "totalAssets() in underlying USDe; excludes unvested rewards and assets moved into the cooldown silo.",
      "Ethereum staking vault",
      2,
    ),
    supply: emptyMetric(
      "USDe",
      SOURCES.supply,
      "Global circulating USDe at the provider's daily timestamp. USDe units, valued at the $1 target.",
      "Global supply; daily observations",
    ),
    price: emptyMetric(
      "USD",
      SOURCES.price,
      "Aggregated secondary-market reference price; not an executable quote.",
      "USDe reference price",
      2,
    ),
    supplyChange7d: emptyMetric(
      "USDe",
      SOURCES.supply,
      "Latest daily supply minus the observation exactly seven calendar days earlier.",
      "Seven calendar days",
    ),
    yield: emptyMetric(
      "% APY",
      SOURCES.yield,
      "Estimated APY: latest reward distribution annualized assuming three distributions per day, with weekly compounding. Not a realized trailing return.",
      "Ethereum sUSDe vault; latest reward distribution (assumed eight-hour interval)",
    ),
    backing: emptyMetric(
      "%",
      SOURCES.backing,
      "(Issuer backing assets + reserve fund) / issuer USDe supply × 100, all from the same reporting timestamp. Reserve is included once.",
      "Issuer report · backing and reserve included",
    ),
    reserve: emptyMetric(
      "USD",
      SOURCES.backing,
      "Issuer-reported reserve fund at the reporting timestamp; included once in the reported backing coverage.",
      "Issuer report · reserve fund",
    ),
    enaPrice: emptyMetric(
      "USD",
      SOURCES.ena,
      "Aggregated ENA market reference price, sourced via DeFiLlama/CoinGecko.",
      "ENA reference price",
      2,
    ),
    stakingShare: emptyMetric(
      "%",
      "https://docs.ethena.fi/video-guides/how-to-stake-usde",
      "Vault totalAssets() divided by canonical Ethereum USDe totalSupply(), read at the same finalized block. Excludes cooldown silo and unvested rewards; includes bridge-locked supply.",
      "Ethereum vault and canonical USDe supply",
    ),
    minted: emptyMetric(
      "USDe",
      "https://docs.ethena.fi/video-guides/how-to-buy-usde",
      "Sum of usde_amount in verified Mint events from the official Ethereum issuer contract, over the bounded finalized-day window. Supply differences are not gross mints.",
      "Ethereum issuer only; bounded finalized-day window",
    ),
    redeemed: emptyMetric(
      "USDe",
      "https://docs.ethena.fi/video-guides/how-to-buy-usde",
      "Sum of usde_amount in verified Redeem events from the official Ethereum issuer contract, over the bounded finalized-day window. Transfers and bridges are excluded.",
      "Ethereum issuer only; bounded finalized-day window",
    ),
  };
  return {
    version: 2,
    mode: "production",
    fetchedAt: now,
    metrics: definitions,
    supplyHistory: [],
    priceHistory: [],
    yieldHistory: [],
    chains: [],
    priceHistoryMeta: emptyMetric(
      "USD",
      SOURCES.prices,
      "Daily USDe market-price observations, selected by the ethena-usde identifier.",
      "Daily history; no intraday detail",
    ),
  };
}
function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid source object");
  return input as Record<string, unknown>;
}
function array(input: unknown): unknown[] {
  if (!Array.isArray(input)) throw new Error("Invalid source series");
  return input;
}
function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
function sampleDate(value: unknown): string | null {
  if ((!validNumber(value) && typeof value !== "string") || value === "")
    return null;
  const date = new Date(typeof value === "number" ? value * 1000 : value);
  return Number.isFinite(date.getTime()) &&
    date.getTime() <= Date.now() + 300_000
    ? date.toISOString()
    : null;
}
function sorted(points: SeriesPoint[]): SeriesPoint[] {
  return [...new Map(points.map((point) => [point.date, point])).values()].sort(
    (a, b) => a.date.localeCompare(b.date),
  );
}
export function parseSupply(input: unknown) {
  const data = record(input);
  if (
    String(data.id) !== "146" ||
    data.symbol !== "USDe" ||
    typeof data.address !== "string" ||
    data.address.toLowerCase() !== USDE_CONTRACT
  )
    throw new Error("Wrong USDe asset");
  const points = sorted(
    array(data.tokens).flatMap((sample) => {
      const point = record(sample);
      const date = sampleDate(point.date);
      const value = record(point.circulating).peggedUSD;
      return date && validNumber(value) && value >= 0
        ? [{ date: date.slice(0, 10), value }]
        : [];
    }),
  );
  if (!points.length) throw new Error("Empty supply series");
  const last = points[points.length - 1];
  const chains = Object.entries(record(data.chainBalances))
    .flatMap(([chain, input]) => {
      const tokens = array(record(input).tokens);
      const match = tokens.findLast(
        (sample) => sampleDate(record(sample).date)?.slice(0, 10) === last.date,
      );
      if (!match) return [];
      const value = record(record(match).circulating).peggedUSD;
      return validNumber(value) && value > 0
        ? [{ chain, supply: value, observedAt: last.date + "T00:00:00.000Z" }]
        : [];
    })
    .sort((a, b) => b.supply - a.supply);
  return { points, chains };
}
export function parsePriceHistory(input: unknown): SeriesPoint[] {
  const points = sorted(
    array(input).flatMap((sample) => {
      const point = record(sample);
      const date = sampleDate(point.date);
      const value = record(point.prices)["ethena-usde"];
      return date && validNumber(value) && value > 0
        ? [{ date: date.slice(0, 10), value }]
        : [];
    }),
  );
  if (!points.length) throw new Error("Empty price history");
  return points;
}
export function parseYieldHistory(input: unknown): SeriesPoint[] {
  const points = sorted(
    array(record(input).data).flatMap((sample) => {
      const point = record(sample);
      const date = sampleDate(point.timestamp);
      return date && validNumber(point.apy) && point.apy >= 0
        ? [{ date, value: point.apy }]
        : [];
    }),
  );
  if (!points.length) throw new Error("Empty yield history");
  return points;
}
export function parsePrice(input: unknown, key: string) {
  const coin = record(record(record(input).coins)[key]);
  const observedAt = sampleDate(coin.timestamp);
  if (
    !validNumber(coin.price) ||
    coin.price <= 0 ||
    !observedAt ||
    !validNumber(coin.confidence) ||
    coin.confidence < 0.5
  )
    throw new Error("Unreliable price");
  return { value: coin.price, observedAt };
}
function observe(
  metric: Metric,
  value: number,
  observedAt: string,
  fetchedAt: string,
): Metric {
  return withFreshness({
    ...metric,
    value,
    observedAt,
    fetchedAt,
    status: "current",
  });
}
export async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
  return response.json();
}
export async function getProviderSnapshot(
  fetcher: (url: string) => Promise<unknown> = fetchJson,
): Promise<DashboardSnapshot> {
  if (process.env.USDE_DATA_PROVIDER === "mock") return getMockSnapshot();
  const snapshot = emptySnapshot();
  // Cache only validated, normalized payloads: raw global feeds exceed 2 MB.
  const cache =
    fetcher === fetchJson ? (await import("next/cache")).unstable_cache : null;
  async function load<T>(
    url: string,
    parse: (input: unknown) => T,
  ): Promise<{ data: T; fetchedAt: string }> {
    const read = async () => ({
      data: parse(await fetcher(url)),
      fetchedAt: new Date().toISOString(),
    });
    return cache
      ? cache(read, ["ethena-normalized-v2", url], { revalidate: 300 })()
      : read();
  }
  // Each adapter owns its validation and failure. No synthetic production fallback.
  const results = await Promise.allSettled([
    (async () => {
      const {
        data: { points, chains },
        fetchedAt,
      } = await load(SOURCES.supply, parseSupply);
      const last = points[points.length - 1];
      snapshot.supplyHistory = points;
      snapshot.chains = chains;
      snapshot.metrics.supply = observe(
        snapshot.metrics.supply,
        last.value,
        last.date + "T00:00:00.000Z",
        fetchedAt,
      );
      const delta = supplyDelta(points, 7);
      if (delta !== null)
        snapshot.metrics.supplyChange7d = observe(
          snapshot.metrics.supplyChange7d,
          delta,
          last.date + "T00:00:00.000Z",
          fetchedAt,
        );
    })(),
    (async () => {
      const { data: points, fetchedAt } = await load(
        SOURCES.prices,
        parsePriceHistory,
      );
      const last = points[points.length - 1];
      snapshot.priceHistory = points;
      snapshot.priceHistoryMeta = observe(
        snapshot.priceHistoryMeta,
        last.value,
        last.date + "T00:00:00.000Z",
        fetchedAt,
      );
    })(),
    (async () => {
      const { data: points, fetchedAt } = await load(
        SOURCES.yield,
        parseYieldHistory,
      );
      const last = points[points.length - 1];
      snapshot.yieldHistory = points;
      snapshot.metrics.yield = observe(
        snapshot.metrics.yield,
        last.value,
        last.date,
        fetchedAt,
      );
    })(),
    ...(
      [
        ["price", SOURCES.price, `ethereum:${USDE_CONTRACT}`],
        ["enaPrice", SOURCES.ena, "coingecko:ethena"],
      ] as const
    ).map(async ([metricKey, url, coin]) => {
      const { data: point, fetchedAt } = await load(url, (input) =>
        parsePrice(input, coin),
      );
      snapshot.metrics[metricKey] = observe(
        snapshot.metrics[metricKey],
        point.value,
        point.observedAt,
        fetchedAt,
      );
    }),
    (async () => {
      const { data: report, fetchedAt } = await load(
        SOURCES.backingData,
        parseBacking,
      );
      snapshot.backingReport = report;
      snapshot.metrics.backing = observe(
        snapshot.metrics.backing,
        ((report.assets + report.reserve) / report.supply) * 100,
        report.observedAt,
        fetchedAt,
      );
      snapshot.metrics.reserve = observe(
        snapshot.metrics.reserve,
        report.reserve,
        report.observedAt,
        fetchedAt,
      );
    })(),
    (async () => {
      const start = Math.floor(Date.now() / 86400000) * 86400 - 7 * 86400;
      const { data: report, fetchedAt } = await load(
        `https://app.ethena.fi/api/collateral-breakdown/historical?startTimestamp=${start}`,
        parseComposition,
      );
      snapshot.composition = {
        ...report,
        fetchedAt,
        status: withFreshness({
          ...snapshot.metrics.backing,
          value: 1,
          observedAt: report.observedAt,
          status: "current",
          maxAgeHours: 24,
        }).status,
      };
    })(),
    ...(["current", "returns", "flows"] as const).map(async (kind) => {
      // Custom test fetchers never invoke a real RPC.
      if (fetcher !== fetchJson)
        throw new Error("RPC not provided in HTTP fixture");
      const { makeRpc, getVaultCurrent, getVaultReturns, getPrimaryFlows } =
        await import("./onchain");
      const endpoints = process.env.ETHEREUM_RPC_URL
        ? [process.env.ETHEREUM_RPC_URL]
        : kind === "flows"
          ? [
              "https://ethereum.publicnode.com",
              "https://eth.drpc.org",
              "https://1rpc.io/eth",
            ]
          : [
              "https://eth.drpc.org",
              "https://ethereum.publicnode.com",
              "https://1rpc.io/eth",
            ];
      const rpc = makeRpc(endpoints);
      const read = async () => {
        if (kind === "current")
          return {
            kind,
            data: await getVaultCurrent(rpc),
            fetchedAt: new Date().toISOString(),
          } as const;
        if (kind === "returns")
          return {
            kind,
            data: await getVaultReturns(rpc),
            fetchedAt: new Date().toISOString(),
          } as const;
        return {
          kind,
          data: await getPrimaryFlows(rpc),
          fetchedAt: new Date().toISOString(),
        } as const;
      };
      const result = cache
        ? await cache(
            read,
            ["ethena-onchain-v3", kind, JSON.stringify(endpoints)],
            {
              revalidate: 900,
            },
          )()
        : await read();
      const fetchedAt = result.fetchedAt;
      const source = (metric: Metric) => ({
        ...metric,
        source: "Ethereum · verified contract",
      });
      if (result.kind === "current") {
        snapshot.metrics.vaultAssets = observe(
          source(snapshot.metrics.vaultAssets),
          result.data.assets,
          result.data.observedAt,
          fetchedAt,
        );
        snapshot.metrics.stakingShare = observe(
          source({
            ...snapshot.metrics.stakingShare,
            methodology:
              "Vault totalAssets() divided by canonical Ethereum USDe totalSupply(), at the same finalized block. Includes bridge-locked USDe in the denominator; excludes the cooldown silo and unvested rewards from the numerator.",
            sourceUrl: snapshot.metrics.vaultAssets.sourceUrl,
            coverage: "Same-block Ethereum vault and canonical USDe supply",
            maxAgeHours: 2,
          }),
          result.data.stakingShare,
          result.data.observedAt,
          fetchedAt,
        );
        snapshot.metrics.cooldown = observe(
          source(snapshot.metrics.cooldown),
          result.data.cooldown,
          result.data.observedAt,
          fetchedAt,
        );
      } else if (result.kind === "returns") {
        for (const point of result.data.results) {
          const key = point.days === 7 ? "realized7d" : "realized30d";
          snapshot.metrics[key] = observe(
            source({
              ...snapshot.metrics[key],
              coverage: `Ethereum vault · ${point.start} to ${result.data.observedAt}`,
            }),
            point.apy,
            result.data.observedAt,
            fetchedAt,
          );
        }
      } else {
        snapshot.flows = result.data;
        for (const key of ["minted", "redeemed"] as const) {
          snapshot.metrics[key] = observe(
            source({
              ...snapshot.metrics[key],
              sourceUrl:
                "https://etherscan.io/address/0xe3490297a08d6fc8da46edb7b6142e4f461b62d3#events",
              methodology:
                "Sum of usde_amount in verified Mint/Redeem events from the official Ethereum issuer contract. Finalized blocks only; excludes bridges and secondary transfers.",
              coverage: `Ethereum issuer only · blocks ${result.data.fromBlock}–${result.data.toBlock} · ${result.data.start} to ${result.data.end}`,
            }),
            result.data[key],
            result.data.end,
            fetchedAt,
          );
        }
      }
    }),
    ...(["fees", "revenue"] as const).map(async (kind) => {
      const { data: points, fetchedAt } = await load(
        ECONOMIC_SOURCES[kind],
        parseEconomics,
      );
      const last = points.at(-1)!;
      snapshot.economics = {
        ...snapshot.economics,
        [kind]: {
          points,
          metric: observe(
            economicMetric(kind),
            last.value,
            last.date + "T00:00:00.000Z",
            fetchedAt,
          ),
        },
      };
    }),
  ]);
  const providers = [
    "supply",
    "price-history",
    "estimated-yield",
    "price",
    "ena-price",
    "backing",
    "composition",
    "vault-current",
    "vault-returns",
    "primary-flows",
    "fees",
    "revenue",
  ];
  snapshot.providerFailures = results.flatMap((result, index) => {
    if (result.status === "fulfilled") return [];
    // Only log provider identifiers; raw URLs and error messages can contain secrets.
    console.warn(
      JSON.stringify({
        event: "provider_failure",
        provider: providers[index],
        category: "request_or_validation",
        at: snapshot.fetchedAt,
      }),
    );
    return [providers[index]];
  });
  return snapshot;
}
export async function getInitialDashboardData() {
  const next = await getProviderSnapshot();
  if (next.mode === "demo") return next;
  const { loadLatestSnapshot } = await import("./snapshot-store");
  const { retainVerified } = await import("./metrics");
  return retainVerified(next, await loadLatestSnapshot());
}

export function parseBacking(input: unknown) {
  const data = record(input);
  const observedAt = sampleDate(data.timestamp);
  const assets = data.totalBackingAssetsInUsd,
    reserve = data.totalReserveFundInUsd,
    supply = data.totalTokenSupplyInUsd;
  if (
    !observedAt ||
    !validNumber(assets) ||
    assets < 0 ||
    !validNumber(reserve) ||
    reserve < 0 ||
    !validNumber(supply) ||
    supply <= 0
  )
    throw new Error("Invalid issuer report");
  return { assets, reserve, supply, observedAt };
}

export function parseComposition(input: unknown) {
  const series = Object.entries(record(record(input).breakdown)).map(
    ([name, input]) => {
      if (!name.trim()) throw new Error("Invalid category name");
      return {
        name,
        points: array(input).map((sample) => {
          const point = record(sample),
            date = sampleDate(point.timestamp);
          if (!date || !validNumber(point.value) || point.value < 0)
            throw new Error("Invalid category observation");
          return { date, value: point.value };
        }),
      };
    },
  );
  if (!series.length) throw new Error("Empty composition");
  const common = series[0].points
    .map((p) => p.date)
    .filter((date) =>
      series.every((s) => s.points.some((p) => p.date === date)),
    )
    .sort();
  const observedAt = common.at(-1);
  if (!observedAt) throw new Error("No aligned category observations");
  const items = series
    .map((s) => ({
      name: s.name,
      value: s.points.findLast((p) => p.date === observedAt)!.value,
    }))
    .sort((a, b) => b.value - a.value);
  if (items.reduce((total, item) => total + item.value, 0) <= 0)
    throw new Error("Empty category total");
  return { items, observedAt };
}
