import type { DashboardSnapshot } from "@/lib/types";
import { supplyGrowth } from "@/lib/analytics";
import { formatSignedMoney } from "@/lib/format";
import { Panel, SourceLine } from "./primitives";

export function SupplyGrowth({
  data,
  includeDaily = false,
}: {
  data: DashboardSnapshot;
  includeDaily?: boolean;
}) {
  return (
    <Panel
      title="Supply growth across calendar windows"
      eyebrow={includeDaily ? "1 / 7 / 30 / 90 DAYS" : "7 / 30 / 90 DAYS"}
      description="Fixed calendar windows ending at the latest daily observation. These comparisons stay the same when you change the chart period."
    >
      <div className={`growth-grid ${includeDaily ? "with-daily" : ""}`}>
        {(includeDaily ? [1, 7, 30, 90] : [7, 30, 90]).map((days) => {
          const growth = supplyGrowth(data.supplyHistory, days);
          return (
            <article key={days} className="growth-reading">
              <h3>
                {days} {days === 1 ? "day" : "days"}
              </h3>
              <p className="growth-value">
                {growth ? formatSignedMoney(growth.change) : "Unavailable"}
              </p>
              <p
                className={
                  growth && growth.change < 0
                    ? "growth-negative"
                    : "growth-percent"
                }
              >
                {growth?.percent != null
                  ? `${growth.percent > 0 ? "+" : ""}${growth.percent.toFixed(2)}% from the baseline`
                  : growth
                    ? "Percentage unavailable: zero baseline"
                    : "Exact baseline observation missing"}
              </p>
              {growth && (
                <p className="guide-meta">
                  {growth.start} → {growth.end} · UTC
                </p>
              )}
            </article>
          );
        })}
      </div>
      <SourceLine
        metric={{
          ...data.metrics.supply,
          methodology:
            "Latest global daily USDe supply minus the observation exactly the indicated number of calendar days earlier. Percentage change divides that difference by baseline supply; a zero baseline has no percentage. USDe is valued at its $1 target.",
        }}
        expanded
      />
    </Panel>
  );
}
