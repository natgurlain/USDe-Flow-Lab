import type { DashboardSnapshot, MetricKey, SeriesPoint } from "./types";
import { DAY, supplyDelta } from "./metrics";
import { emptySnapshot } from "./data-provider";

// Explicit demo only. These values do not describe historical Ethena events.
export function getMockSnapshot(): DashboardSnapshot {
  const end = new Date().setUTCHours(0, 0, 0, 0);
  const make = (fn: (day: number) => number): SeriesPoint[] =>
    Array.from({ length: 400 }, (_, index) => ({
      date: new Date(end - (399 - index) * DAY).toISOString().slice(0, 10),
      value: fn(index),
    }));
  const data = emptySnapshot();
  data.mode = "demo";
  data.supplyHistory = make(
    (day) => 4_000_000_000 + day * 2_500_000 + Math.sin(day / 30) * 150_000_000,
  );
  data.priceHistory = make((day) => 1 + Math.sin(day / 12) * 0.002);
  data.yieldHistory = make((day) => 4.5 + Math.sin(day / 45));
  const values: Partial<Record<MetricKey, number>> = {
    supply: data.supplyHistory.at(-1)!.value,
    price: data.priceHistory.at(-1)!.value,
    yield: data.yieldHistory.at(-1)!.value,
    supplyChange7d: supplyDelta(data.supplyHistory, 7)!,
    backing: 101.2,
    reserve: 60_000_000,
    enaPrice: 0.25,
  };
  for (const key of Object.keys(values) as MetricKey[])
    data.metrics[key] = {
      ...data.metrics[key],
      value: values[key]!,
      status: "demo",
      source: "Illustrative demo",
      observedAt: new Date(end).toISOString(),
      fetchedAt: data.fetchedAt,
      methodology: "Synthetic illustration; not an Ethena observation.",
    };
  data.priceHistoryMeta = { ...data.metrics.price, status: "demo" };
  data.chains = [
    {
      chain: "Ethereum",
      supply: data.metrics.supply.value! * 0.7,
      observedAt: new Date(end).toISOString(),
    },
    {
      chain: "Other networks",
      supply: data.metrics.supply.value! * 0.3,
      observedAt: new Date(end).toISOString(),
    },
  ];
  return data;
}
