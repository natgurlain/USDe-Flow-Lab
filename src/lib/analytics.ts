import type { Metric, SeriesPoint } from "./types";
import { DAY, supplyDelta } from "./metrics";

export function supplyGrowth(points: SeriesPoint[], days: number) {
  const last = points.at(-1);
  const change = supplyDelta(points, days);
  if (!last || change === null) return null;
  const baseline = last.value - change;
  return {
    change,
    percent: baseline > 0 ? (change / baseline) * 100 : null,
    start: new Date(Date.parse(last.date) - days * DAY)
      .toISOString()
      .slice(0, 10),
    end: last.date,
  };
}

// Every calendar day must exist once. A sparse series is not a complete window.
export function dailyWindow(points: SeriesPoint[], days: number) {
  if (!Number.isInteger(days) || days < 1 || days > 3650 || !points.length)
    return null;
  const end = points.at(-1)!.date;
  const timestamp = Date.parse(end);
  if (!Number.isFinite(timestamp)) return null;
  const start = new Date(timestamp - (days - 1) * DAY)
    .toISOString()
    .slice(0, 10);
  const window = points.filter(
    (point) => point.date >= start && point.date <= end,
  );
  const dates = new Set(window.map((point) => point.date));
  if (
    window.length !== days ||
    dates.size !== days ||
    window.some((point) => !Number.isFinite(point.value) || point.value < 0)
  )
    return null;
  for (let index = 0; index < days; index++) {
    const date = new Date(timestamp - index * DAY).toISOString().slice(0, 10);
    if (!dates.has(date)) return null;
  }
  const total = window.reduce((sum, point) => sum + point.value, 0);
  return Number.isFinite(total)
    ? { total, average: total / days, start, end }
    : null;
}

export function windowMetric(
  points: SeriesPoint[],
  metric: Metric,
  days: number,
): Metric {
  const window = dailyWindow(points, days);
  return {
    ...metric,
    value: window?.total ?? null,
    status: window ? metric.status : "unavailable",
    coverage: window
      ? `${days} complete UTC daily samples · ${window.start} to ${window.end}`
      : `${days} complete UTC daily samples required`,
    methodology: `Sum of ${days} consecutive complete UTC daily observations. Missing days are not zeros. ${metric.methodology}`,
  };
}

export const BUYBACK_GOVERNANCE = {
  url: "https://gov.ethenafoundation.com/t/ena-fee-switch-activation/830",
  voteUrl:
    "https://snapshot.box/#/s:ethenagovernance.eth/proposal/0xcb6b9ed95bf0c64b6101ff7d3a770af86e07701d8419b541cf91a6894022f2a3",
  published: "2026-08-27",
  voteReported: "2026-09-08",
  reviewed: "2026-10-04",
};
export const BUYBACK_MILESTONES = [
  { supply: 7_500_000_000, rate: 5 },
  { supply: 10_000_000_000, rate: 10 },
  { supply: 15_000_000_000, rate: 15 },
  { supply: 20_000_000_000, rate: 20 },
] as const;

export function milestoneProgress(supply: number | null, target: number) {
  if (
    supply === null ||
    !Number.isFinite(supply) ||
    supply < 0 ||
    !Number.isFinite(target) ||
    target <= 0
  )
    return null;
  return {
    percent: Math.min(100, (supply / target) * 100),
    remaining: Math.max(0, target - supply),
  };
}
