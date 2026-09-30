import type { DashboardSnapshot, MetricKey } from "@/lib/types";
import { Panel, SourceLine } from "./primitives";
const names: Record<MetricKey, string> = {
  supply: "USDe supply",
  price: "USDe price",
  supplyChange7d: "Seven-day supply change",
  yield: "sUSDe estimated APY",
  backing: "Reported backing",
  reserve: "Reported reserve",
  enaPrice: "ENA price",
  stakingShare: "Staking participation",
  minted: "USDe created",
  redeemed: "USDe redeemed",
};
export default function MethodologyView({ data }: { data: DashboardSnapshot }) {
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">EVERY NUMBER HAS A STORY</p>
        <h1>
          Sources, dates,
          <br />
          and honest limits.
        </h1>
        <p>
          This is an independent dashboard. Data comes from public providers;
          explanations link to official Ethena publications. No missing
          production metric is replaced with a demo value.
        </p>
      </div>
      <Panel title="How to read the data labels">
        <div className="status-guide">
          {[
            [
              "current",
              "Current",
              "The observation is within its declared freshness window. It is not a claim of tick-by-tick data.",
            ],
            [
              "stale",
              "Delayed / last verified",
              "The observation is old or retained after a failed refresh. Its original observation date stays visible.",
            ],
            [
              "unavailable",
              "Unavailable",
              "No verified value or connected source is available. Zero would be misleading.",
            ],
            [
              "demo",
              "Demo",
              "Synthetic values for an explicitly separate demonstration. They are not market observations.",
            ],
          ].map(([status, title, description]) => (
            <div key={status}>
              <span className={`data-status ${status}`}>{title}</span>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Metric-by-metric coverage">
        <div className="source-register">
          {(Object.keys(names) as MetricKey[]).map((key) => (
            <article key={key}>
              <h3>{names[key]}</h3>
              <p>{data.metrics[key].methodology}</p>
              <p className="small-copy">
                {data.metrics[key].coverage} · Unit: {data.metrics[key].unit}
              </p>
              <SourceLine metric={data.metrics[key]} expanded />
            </article>
          ))}
          <article>
            <h3>Daily USDe price history</h3>
            <p>{data.priceHistoryMeta.methodology}</p>
            <SourceLine metric={data.priceHistoryMeta} expanded />
          </article>
        </div>
      </Panel>
      <div className="two-column">
        <Panel title="What the charts measure">
          <ul className="simple-list">
            <li>
              Supply uses the provider’s global series. Chain samples are
              aligned to its latest day and may have different bridge
              accounting.
            </li>
            <li>
              Supply changes compare exact calendar dates. Missing baseline
              dates produce unavailable values.
            </li>
            <li>
              Daily bars require consecutive calendar dates; gaps are excluded.
            </li>
            <li>
              The 24H chart filter selects daily observations one day apart. It
              is not an intraday or rolling 24-hour tape.
            </li>
            <li>
              Supply charts value USDe at its $1 target. Price charts measure a
              separate market reference.
            </li>
          </ul>
        </Panel>
        <Panel title="How the yield estimate is made">
          <p className="body-copy">
            The inspected DeFiLlama adapter annualizes the latest reward
            distribution assuming three distributions per day. It converts the
            resulting APR to APY with weekly compounding. The series displays
            these estimates, not a trailing realized vault return.
          </p>
          <a
            className="text-link"
            href="https://github.com/DefiLlama/yield-server/blob/master/src/adaptors/ethena-usde/index.js"
            target="_blank"
            rel="noreferrer"
          >
            Inspect the provider’s calculation ↗
          </a>
          <p className="small-copy">
            Methodology checked September 30, 2026. Provider logic and
            distribution schedules can change.
          </p>
        </Panel>
      </div>
      <Panel title="Refresh and persistence">
        <p className="body-copy">
          The browser checks every five minutes while visible. Upstream requests
          are cached for five minutes; shared API responses may be cached
          briefly. None of these intervals changes an observation’s original
          date. Optional database storage preserves verified daily snapshots.
          Without storage, provider outages show unavailable data on a new
          visit; an open page can retain its last verified readings.
        </p>
      </Panel>
    </>
  );
}
