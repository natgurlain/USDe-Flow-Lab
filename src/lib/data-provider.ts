import type {
  DashboardSnapshot,
  Metric,
  MetricKey,
  SeriesPoint,
} from "./types";
import { supplyDelta, withFreshness } from "./metrics";
import { getMockSnapshot } from "./mock-data";

export const USDE_CONTRACT = "0x4c9edd5852cd905f086c759e8383e09bff1e68b3";
export const SOURCES = {
  supply: "https://stablecoins.llama.fi/stablecoin/146",
  prices: "https://stablecoins.llama.fi/stablecoinprices",
  price: `https://coins.llama.fi/prices/current/ethereum:${USDE_CONTRACT}`,
  yield: "https://yields.llama.fi/chart/66985a81-9c51-46ca-9977-42b4fe7bc6df",
  ena: "https://coins.llama.fi/prices/current/coingecko:ethena",
  backing: "https://app.ethena.fi/dashboards/transparency",
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
      "Requires dated issuer backing and USDe supply with a defined treatment of reserves. No public feed verified.",
      "Issuer reporting; integration unavailable",
    ),
    reserve: emptyMetric(
      "USD",
      SOURCES.backing,
      "Requires a dated issuer reserve balance. No public feed verified.",
      "Issuer reporting; integration unavailable",
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
      "Vault underlying USDe assets divided by global circulating USDe; dated vault assets not connected.",
      "Unavailable; sUSDe token counts are not USDe assets",
    ),
    minted: emptyMetric(
      "USDe",
      "https://docs.ethena.fi/video-guides/how-to-buy-usde",
      "Gross primary-market mint events require a verified event indexer. Supply differences are not gross mints.",
      "Primary-market events not indexed",
    ),
    redeemed: emptyMetric(
      "USDe",
      "https://docs.ethena.fi/video-guides/how-to-buy-usde",
      "Gross primary-market redemption events require a verified event indexer. Transfers and bridge events are not redemptions.",
      "Primary-market events not indexed",
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
  await Promise.allSettled([
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
  ]);
  return snapshot;
}
export async function getInitialDashboardData() {
  const next = await getProviderSnapshot();
  if (next.mode === "demo") return next;
  const { loadLatestSnapshot } = await import("./snapshot-store");
  const { retainVerified } = await import("./metrics");
  return retainVerified(next, await loadLatestSnapshot());
}
