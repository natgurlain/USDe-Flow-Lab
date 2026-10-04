import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/types";
import {
  BUYBACK_GOVERNANCE,
  BUYBACK_MILESTONES,
  dailyWindow,
  milestoneProgress,
} from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { MetricCard, Panel, SourceLine, Unavailable } from "./primitives";

export default function EnaView({ data }: { data: DashboardSnapshot }) {
  const average = dailyWindow(data.supplyHistory, 14);
  const supply = average?.average ?? null;
  const next = BUYBACK_MILESTONES.find(
    (milestone) => supply === null || milestone.supply > supply,
  );
  const target = next ?? BUYBACK_MILESTONES.at(-1)!;
  const progress = milestoneProgress(supply, target.supply);
  const averageMetric = {
    ...data.metrics.supply,
    value: supply,
    status:
      supply === null ? ("unavailable" as const) : data.metrics.supply.status,
    methodology:
      "Arithmetic mean of 14 consecutive UTC daily USDe supply observations, ending at the latest provider date. Requires every day once. A comparison to the committee recommendation, not verification of the implemented trigger.",
    coverage: average
      ? `${average.start} to ${average.end} · 14 daily samples`
      : "14 consecutive UTC daily samples required",
  };
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">ENA & VALUE ACCRUAL</p>
        <h1>
          Follow the milestones.
          <br />
          <span>Check the evidence.</span>
        </h1>
        <p>
          The buyback framework links supply milestones to revenue allocation.
          Governance approval, a threshold comparison, and actual ENA purchases
          are three different facts.
        </p>
      </div>
      <div className="three-column">
        <MetricCard
          label="ENA reference price"
          value={
            data.metrics.enaPrice.value === null
              ? "Unavailable"
              : "$" + data.metrics.enaPrice.value.toFixed(4)
          }
          explanation="A market reference, not an executable quote or a valuation forecast."
          metric={data.metrics.enaPrice}
        />
        <MetricCard
          label="Latest daily USDe supply"
          value={
            data.metrics.supply.value === null
              ? "Unavailable"
              : formatMoney(data.metrics.supply.value)
          }
          explanation="The latest global daily sample. It is separate from the average comparison."
          metric={data.metrics.supply}
        />
        <MetricCard
          label="14-day average supply"
          value={supply === null ? "Unavailable" : formatMoney(supply)}
          detail={average ? `${average.start} → ${average.end}` : undefined}
          explanation="A complete daily average for comparison with the committee’s recommended supply measure."
          metric={averageMetric}
        />
      </div>
      <Panel
        title={
          next
            ? "Distance to the next published milestone"
            : "All published supply milestones reached in this comparison"
        }
        eyebrow="14-DAY AVERAGE COMPARISON"
      >
        {progress ? (
          <>
            <div className="milestone-summary">
              <div>
                <p className="metric-label">
                  {formatMoney(target.supply)} supply milestone
                </p>
                <strong>{progress.percent.toFixed(1)}%</strong>
              </div>
              <div>
                <p className="metric-label">Additional average supply</p>
                <strong>{formatMoney(progress.remaining)}</strong>
              </div>
            </div>
            <div
              className="milestone-track"
              role="progressbar"
              aria-label="Average supply compared with the published milestone"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percent}
              aria-valuetext={`${progress.percent.toFixed(1)}% of ${formatMoney(target.supply)}; ${formatMoney(progress.remaining)} remaining`}
            >
              <span style={{ width: `${progress.percent}%` }} />
            </div>
          </>
        ) : (
          <Unavailable title="Average comparison unavailable">
            Every day in the 14-day window is needed. Missing supply samples are
            not interpolated.
          </Unavailable>
        )}
        <p className="small-copy">
          The 14-day average was recommended in the committee discussion. This
          dashboard has not verified its adoption as the implemented trigger.
          Reaching a displayed milestone does not prove activation or executed
          buybacks.
        </p>
        <SourceLine metric={averageMetric} expanded />
      </Panel>
      <div className="two-column">
        <Panel title="Published buyback ladder" eyebrow="GOVERNANCE FRAMEWORK">
          <div className="milestone-ladder">
            {BUYBACK_MILESTONES.map((milestone) => (
              <div key={milestone.supply} className="milestone-rung">
                <b>{formatMoney(milestone.supply)}</b>
                <span>{milestone.rate}% protocol revenue take rate</span>
                <small>
                  {milestone === next
                    ? "Next in this comparison"
                    : supply !== null && supply >= milestone.supply
                      ? "Supply comparison met"
                      : "Later milestone"}
                </small>
              </div>
            ))}
          </div>
          <p className="small-copy">
            The separate 95% allocation discussed for Foundation net revenue is
            a different revenue base. Do not multiply either percentage by the
            tracked fees below.
          </p>
          <a
            className="text-link"
            href={BUYBACK_GOVERNANCE.url}
            target="_blank"
            rel="noreferrer"
          >
            Read the official framework & analysis ↗
          </a>
        </Panel>
        <Panel title="Approval and execution" eyebrow="WHAT HAS BEEN VERIFIED">
          <div className="evidence-row">
            <b>Governance vote</b>
            <span className="data-status current">Reported passed</span>
          </div>
          <p className="body-copy">
            The official forum reported the vote passed on{" "}
            {BUYBACK_GOVERNANCE.voteReported}. The framework was published{" "}
            {BUYBACK_GOVERNANCE.published}; reviewed here{" "}
            {BUYBACK_GOVERNANCE.reviewed}.
          </p>
          <a
            className="text-link"
            href={BUYBACK_GOVERNANCE.voteUrl}
            target="_blank"
            rel="noreferrer"
          >
            View the vote results ↗
          </a>
          <Unavailable
            title="Buyback execution is unverified here"
            href="https://app.ethena.fi/dashboards/transparency"
            label="Check official buyback reporting"
          >
            No verified purchases feed is connected. An unavailable total is not
            evidence that purchases were zero.
          </Unavailable>
          <Link href="/economics" className="text-link">
            Understand fees and revenue →
          </Link>
        </Panel>
      </div>
    </>
  );
}
