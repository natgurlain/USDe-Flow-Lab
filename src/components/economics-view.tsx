import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/types";
import { windowMetric } from "@/lib/analytics";
import { ECONOMIC_SOURCES, economicMetric } from "@/lib/economics";
import { formatMoney } from "@/lib/format";
import { Panel, MetricCard, Unavailable } from "./primitives";
import { HistoryPanel } from "./history-panel";
import type { RangeKey } from "@/lib/metrics";

export default function EconomicsView({
  data,
  range,
}: {
  data: DashboardSnapshot;
  range: RangeKey;
}) {
  const fees = data.economics?.fees;
  const revenue = data.economics?.revenue;
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">PROTOCOL ECONOMICS</p>
        <h1>
          Follow the revenue.
          <br />
          <span>Know what it measures.</span>
        </h1>
        <p>
          Tracked cash flows help explain the protocol. Gross fees, provider
          revenue, Foundation net revenue, and ENA buybacks use different
          definitions.
        </p>
      </div>
      <div className="headline-grid">
        {(["fees", "revenue"] as const).flatMap((kind) =>
          [7, 30].map((days) => {
            const series = data.economics?.[kind];
            const metric = windowMetric(
              series?.points ?? [],
              series?.metric ?? economicMetric(kind),
              days,
            );
            return (
              <MetricCard
                key={`${kind}-${days}`}
                label={`${kind === "fees" ? "Tracked gross fees" : "Provider revenue"} · ${days} days`}
                value={
                  metric.value === null
                    ? "Unavailable"
                    : formatMoney(metric.value)
                }
                detail={
                  metric.value === null
                    ? "Complete daily window required"
                    : metric.coverage
                }
                explanation={
                  kind === "fees"
                    ? "Includes mint fees and reward distributions under the provider’s definition."
                    : "Mint fees and reserve allocations, under the provider’s definition."
                }
                metric={metric}
              />
            );
          }),
        )}
      </div>
      <div className="plain-summary">
        <span className="summary-icon">i</span>
        <div>
          <h3>Cash flows are not all business earnings</h3>
          <p>
            The USDe-specific DeFiLlama adapter tracks selected on-chain
            distributions. These figures exclude a verified net revenue
            statement across the Foundation’s business lines. They are not an
            ENA buyback budget.
          </p>
        </div>
      </div>
      <div className="charts-grid">
        <HistoryPanel
          title="Tracked daily gross fees"
          eyebrow="COMPLETE UTC DAYS"
          description="Daily mint fees and reward distributions tracked by the provider. Distribution timing can create spikes; missing days stay unfilled."
          points={fees?.points ?? []}
          metric={fees?.metric ?? economicMetric("fees")}
          kind="change"
          range={range}
        />
        <HistoryPanel
          title="Provider-defined daily revenue"
          eyebrow="COMPLETE UTC DAYS"
          description="Daily mint fees and reserve allocations. This is separate from Foundation net revenue and executed ENA buybacks."
          points={revenue?.points ?? []}
          metric={revenue?.metric ?? economicMetric("revenue")}
          kind="change"
          range={range}
        />
      </div>
      <div className="two-column">
        <Panel title="Foundation net revenue" eyebrow="SEPARATE REVENUE BASE">
          <Unavailable
            title="Verified net revenue unavailable"
            href="https://app.ethena.fi/dashboards/transparency"
          >
            No dated Foundation net revenue statement is connected. Operating
            costs and revenue across its business lines cannot be inferred from
            this USDe cash-flow series.
          </Unavailable>
        </Panel>
        <Panel
          title="Executed ENA buybacks"
          eyebrow="PURCHASES NEED THEIR OWN EVIDENCE"
        >
          <Unavailable
            title="Executed purchase total unavailable"
            href="https://app.ethena.fi/dashboards/transparency"
          >
            No verified purchases feed is connected. Neither protocol revenue
            nor a supply milestone proves that ENA was bought.
          </Unavailable>
          <Link className="text-link" href="/ena">
            View ENA milestones & governance →
          </Link>
        </Panel>
      </div>
      <Panel
        title="Where the numbers come from"
        eyebrow="DEFINITIONS & COVERAGE"
      >
        <p className="body-copy">
          We use the Ethena USDe adapter, not the parent Ethena aggregate. Fee
          and revenue feeds update independently. Headline totals require every
          day in their 7/30-day window, ending at the latest completed sample;
          the current UTC day is excluded. Delayed readings keep their original
          dates.
        </p>
        <a
          className="text-link"
          href={ECONOMIC_SOURCES.page}
          target="_blank"
          rel="noreferrer"
        >
          Open the provider dashboard ↗
        </a>{" "}
        <a
          className="text-link"
          href={ECONOMIC_SOURCES.adapter}
          target="_blank"
          rel="noreferrer"
        >
          Inspect the fee and revenue definitions ↗
        </a>
      </Panel>
    </>
  );
}
