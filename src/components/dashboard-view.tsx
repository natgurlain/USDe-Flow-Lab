"use client";
import dynamic from "next/dynamic";
import LearnView from "./learn-view";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/metrics";
import type { DashboardSnapshot } from "@/lib/types";
import { DashboardSkeleton } from "./dashboard-skeleton";
const OverviewView = dynamic(() => import("./overview-view"), {
  loading: DashboardSkeleton,
});
const TapeView = dynamic(() => import("./tape-view"), {
  loading: DashboardSkeleton,
});
const YieldView = dynamic(() => import("./yield-view"), {
  loading: DashboardSkeleton,
});
const BackingView = dynamic(() => import("./backing-view"), {
  loading: DashboardSkeleton,
});
const MethodologyView = dynamic(() => import("./methodology-view"), {
  loading: DashboardSkeleton,
});
export type Section =
  | "overview"
  | "flow"
  | "yield"
  | "backing"
  | "learn"
  | "sources";
export function sectionForPath(path: string): Section {
  return (
    (
      {
        "/": "overview",
        "/flow": "flow",
        "/tape": "flow",
        "/yield": "yield",
        "/forces": "yield",
        "/backing": "backing",
        "/learn": "learn",
        "/events": "learn",
        "/sources": "sources",
        "/methodology": "sources",
      } as Record<string, Section>
    )[path] ?? "overview"
  );
}
export function DashboardView({
  section,
  data,
  range,
  onRangeChange,
}: {
  section: Section;
  data: DashboardSnapshot;
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}) {
  const isChartPage = ["overview", "flow", "yield"].includes(section);
  const rangeControls = (
    <div className="range-toolbar">
      <span>
        Chart period <small>Charts only · headline windows stay fixed</small>
      </span>
      <div role="group" aria-label="Chart time range">
        {RANGE_OPTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={range === item.key}
            className={range === item.key ? "selected" : ""}
            onClick={() => onRangeChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <>
      {isChartPage && section !== "overview" && rangeControls}
      {section === "overview" && (
        <OverviewView data={data} range={range} chartControls={rangeControls} />
      )}
      {section === "flow" && <TapeView data={data} range={range} />}
      {section === "yield" && <YieldView data={data} range={range} />}
      {section === "backing" && <BackingView data={data} />}
      {section === "learn" && <LearnView />}
      {section === "sources" && <MethodologyView data={data} />}
    </>
  );
}
