export type RangeKey = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

export const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; days: number }> = [
  { key: "24h", label: "24H", days: 1 },
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "1y", label: "1Y", days: 365 },
  { key: "all", label: "ALL", days: Number.POSITIVE_INFINITY },
];

export function sliceByRange<T extends { date: string }>(rows: T[], range: RangeKey) {
  const selected = RANGE_OPTIONS.find((option) => option.key === range);
  if (!selected || !Number.isFinite(selected.days)) return rows;
  return rows.slice(-selected.days);
}
