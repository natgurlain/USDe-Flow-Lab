import type { Metric, SeriesPoint } from "./types";

export const ECONOMIC_SOURCES = {
  fees: "https://api.llama.fi/summary/fees/ethena-usde?dataType=dailyFees",
  revenue:
    "https://api.llama.fi/summary/fees/ethena-usde?dataType=dailyRevenue",
  page: "https://defillama.com/protocol/ethena-usde?fees=true",
  adapter:
    "https://github.com/DefiLlama/dimension-adapters/blob/master/fees/ethena.ts",
};

export function economicMetric(kind: "fees" | "revenue"): Metric {
  return {
    value: null,
    status: "unavailable",
    source: "DeFiLlama · Ethena USDe",
    sourceUrl: ECONOMIC_SOURCES[kind],
    observedAt: null,
    fetchedAt: null,
    unit: "USD",
    maxAgeHours: 48,
    coverage: "Ethena USDe adapter · complete UTC daily samples",
    methodology:
      kind === "fees"
        ? "Provider-tracked mint fees, reserve allocations, staking rewards and extra reward distributions. This cash-flow measure is not total business earnings or net Foundation revenue."
        : "Provider revenue includes mint fees and allocations to the reserve fund. It is not net Foundation revenue or executed ENA buybacks.",
  };
}

export function parseEconomics(
  input: unknown,
  now = Date.now(),
): SeriesPoint[] {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid economics object");
  const data = input as Record<string, unknown>;
  if (
    String(data.id) !== "4133" ||
    data.name !== "Ethena USDe" ||
    !Array.isArray(data.totalDataChart)
  )
    throw new Error("Wrong economics protocol or missing daily series");
  const today = new Date(now).toISOString().slice(0, 10);
  const points = new Map<string, number>();
  for (const sample of data.totalDataChart) {
    if (!Array.isArray(sample) || sample.length !== 2)
      throw new Error("Invalid daily economics sample");
    const [timestamp, value] = sample;
    if (
      typeof timestamp !== "number" ||
      !Number.isFinite(timestamp) ||
      timestamp <= 0 ||
      timestamp % 86400 !== 0 ||
      timestamp * 1000 > now ||
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    )
      throw new Error("Invalid daily economics value or timestamp");
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    // Today's cash flows may still be accumulating. Never call them a full day.
    if (date === today) continue;
    if (points.has(date) && points.get(date) !== value)
      throw new Error("Conflicting daily economics values");
    points.set(date, value);
  }
  const result = [...points]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!result.length) throw new Error("No complete daily economics samples");
  return result;
}
