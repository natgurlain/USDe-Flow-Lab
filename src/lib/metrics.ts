import type { DashboardSnapshot, Metric, SeriesPoint } from "./types";

export const DAY = 86_400_000;
export const RANGE_OPTIONS = [
  { key: "24h", label: "24H", days: 1 },
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "1y", label: "1Y", days: 365 },
  { key: "all", label: "All", days: Infinity },
] as const;
export type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];
export function parseRange(value?: string): RangeKey {
  return RANGE_OPTIONS.find((range) => range.key === value)?.key ?? "90d";
}
export function sliceByRange(
  points: SeriesPoint[],
  range: RangeKey,
): SeriesPoint[] {
  if (!points.length) return [];
  const days = RANGE_OPTIONS.find((item) => item.key === range)?.days ?? 90;
  const end = Date.parse(points[points.length - 1].date);
  return points.filter((point) => Date.parse(point.date) >= end - days * DAY);
}
// Require observations on the two calendar dates, not N array positions.
export function supplyDelta(
  points: SeriesPoint[],
  days: number,
): number | null {
  const last = points.at(-1);
  if (!last) return null;
  const target = new Date(Date.parse(last.date) - days * DAY)
    .toISOString()
    .slice(0, 10);
  const previous = points.find((point) => point.date === target);
  return previous ? last.value - previous.value : null;
}
export function dailyChanges(points: SeriesPoint[]): SeriesPoint[] {
  return points.flatMap((point, index) => {
    const previous = points[index - 1];
    return previous &&
      Date.parse(point.date) - Date.parse(previous.date) === DAY
      ? [{ date: point.date, value: point.value - previous.value }]
      : [];
  });
}
export function pegDifference(price: number | null): number | null {
  return price === null ? null : (price - 1) * 100;
}
export function illustrateYield(
  amount: number,
  apy: number,
  days: number,
): number | null {
  if (
    ![amount, apy, days].every(Number.isFinite) ||
    amount < 0 ||
    amount > 1_000_000_000 ||
    apy < 0 ||
    apy > 100 ||
    !Number.isInteger(days) ||
    days < 0 ||
    days > 3650
  )
    return null;
  const gain = amount * (Math.pow(1 + apy / 100, days / 365) - 1);
  return Number.isFinite(gain) ? gain : null;
}
export function withFreshness(metric: Metric, now = Date.now()): Metric {
  if (metric.status === "demo" || metric.value === null || !metric.observedAt)
    return metric;
  const age = now - Date.parse(metric.observedAt);
  return {
    ...metric,
    status:
      metric.status === "stale" ||
      !Number.isFinite(age) ||
      age > metric.maxAgeHours * 3_600_000 ||
      age < -300_000
        ? "stale"
        : "current",
  };
}
export function retainVerified(
  next: DashboardSnapshot,
  previous: DashboardSnapshot | null,
): DashboardSnapshot {
  if (
    !previous ||
    previous.version !== 2 ||
    previous.mode !== "production" ||
    next.mode !== "production"
  )
    return next;
  const result = { ...next, metrics: { ...next.metrics } };
  for (const kind of ["fees", "revenue"] as const) {
    const old = previous.economics?.[kind];
    const current = next.economics?.[kind];
    if (
      old &&
      old.metric.status !== "demo" &&
      (!current ||
        Date.parse(old.metric.observedAt ?? "") >
          Date.parse(current.metric.observedAt ?? ""))
    ) {
      result.economics = {
        ...result.economics,
        [kind]: { ...old, metric: { ...old.metric, status: "stale" } },
      };
    }
  }
  if (
    previous.composition &&
    (!next.composition ||
      Date.parse(previous.composition.observedAt) >
        Date.parse(next.composition.observedAt))
  )
    result.composition = { ...previous.composition, status: "stale" };
  for (const key of Object.keys(next.metrics) as Array<
    keyof DashboardSnapshot["metrics"]
  >) {
    const old = previous.metrics[key];
    if (
      (next.metrics[key].value === null ||
        (old?.observedAt !== null &&
          next.metrics[key].observedAt !== null &&
          Date.parse(old?.observedAt ?? "") >
            Date.parse(next.metrics[key].observedAt!))) &&
      old?.value !== null &&
      old?.value !== undefined &&
      old.status !== "demo"
    ) {
      result.metrics[key] = {
        ...old,
        status: "stale",
        methodology: old.methodology,
      };
      if (key === "supply") {
        result.supplyHistory = previous.supplyHistory;
        result.chains = previous.chains;
      }
      if (key === "yield") result.yieldHistory = previous.yieldHistory;
      if (key === "backing") result.backingReport = previous.backingReport;
      if (key === "minted" || key === "redeemed") result.flows = previous.flows;
    }
  }
  if (
    (next.priceHistoryMeta.value === null ||
      Date.parse(previous.priceHistoryMeta.observedAt ?? "") >
        Date.parse(next.priceHistoryMeta.observedAt ?? "")) &&
    previous.priceHistoryMeta.value !== null &&
    previous.priceHistoryMeta.status !== "demo"
  ) {
    result.priceHistory = previous.priceHistory;
    result.priceHistoryMeta = { ...previous.priceHistoryMeta, status: "stale" };
  }
  // Recalculate from the retained supply series; never mix independent histories.
  const change = supplyDelta(result.supplyHistory, 7);
  result.metrics.supplyChange7d = {
    ...result.metrics.supply,
    value: change,
    unit: "USDe",
    status: change === null ? "unavailable" : result.metrics.supply.status,
    methodology:
      "Latest daily supply minus the observation exactly seven calendar days earlier.",
  };
  return result;
}

// Preserve elapsed time and break lines across missing daily observations.
export function chartObservations(points: SeriesPoint[], price = false) {
  return points.flatMap((point, index) => {
    const timestamp = Date.parse(point.date);
    const previous = points[index - 1];
    const gap =
      previous && timestamp - Date.parse(previous.date) > DAY * 1.5
        ? [
            {
              timestamp: Date.parse(previous.date) + DAY,
              value: null as number | null,
            },
          ]
        : [];
    return [
      ...gap,
      { timestamp, value: price ? (point.value - 1) * 100 : point.value },
    ];
  });
}
