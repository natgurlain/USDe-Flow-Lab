"use client";
import dynamic from "next/dynamic";
import { Panel, SourceLine } from "./primitives";
import { sliceByRange, type RangeKey } from "@/lib/metrics";
import type { Metric, SeriesPoint } from "@/lib/types";
const HistoryChart = dynamic(() => import("./charts"), {
  ssr: false,
  loading: () => <div className="chart-empty">Preparing chart…</div>,
});
export function HistoryPanel({
  title,
  description,
  points,
  metric,
  range,
  kind,
  eyebrow,
}: {
  title: string;
  description: string;
  points: SeriesPoint[];
  metric: Metric;
  range: RangeKey;
  kind: "supply" | "price" | "yield" | "change";
  eyebrow?: string;
}) {
  const selected = sliceByRange(points, range);
  return (
    <Panel title={title} description={description} eyebrow={eyebrow}>
      <HistoryChart points={selected} kind={kind} label={title} />
      <div className="chart-footer">
        <span>
          {selected.length} observations ·{" "}
          {selected[0]?.date.slice(0, 10) ?? "—"} to{" "}
          {selected.at(-1)?.date.slice(0, 10) ?? "—"} ·{" "}
          {range === "24h"
            ? "Sampled observations; not continuous 24-hour coverage"
            : "Period ends at latest available observation"}
        </span>
        <SourceLine metric={metric} />
      </div>
    </Panel>
  );
}
