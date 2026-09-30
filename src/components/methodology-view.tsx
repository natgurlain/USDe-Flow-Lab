import type { DashboardSnapshot, MetricKey } from "@/lib/types";
import { Panel, SourceLine } from "./primitives";
const names: Record<MetricKey, string> = {
  realized7d: "Realized trailing 7-day APY",
  realized30d: "Realized trailing 30-day APY",
  cooldown: "Current unstaking cooldown",
  vaultAssets: "Underlying staked USDe assets",
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
              separate market reference expressed as percentage distance from
              $1. The visible ±0.5% minimum range is visual context, not a
              safety threshold.
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
      <Panel title="Realized vault returns and current exit settings">
        <p className="body-copy">
          Realized 7/30-day APY uses changes in convertToAssets(1e18) at
          finalized Ethereum blocks, annualized with the actual elapsed seconds
          and a 365-day year. It excludes market-price changes, taxes and fees.
          It is separate from the reward-distribution estimate above. Cooldown
          and underlying vault assets are read from current finalized contract
          state; the setting can subsequently change.
        </p>
        <p className="small-copy">
          The flow totals cover a separate bounded day of finalized events from
          the official Ethereum issuer contract. Chart range selection does not
          extend that coverage. No bridge or secondary-transfer activity is
          counted.
        </p>
      </Panel>
      <Panel title="Refresh and persistence">
        <p className="body-copy">
          The browser checks every five minutes while visible and when returning
          to the tab. Display freshness ages every minute. HTTP upstream
          requests are cached for five minutes, finalized on-chain groups for
          fifteen minutes; shared API responses may be cached briefly. None of
          these intervals changes an observation’s original date. Optional
          database storage preserves verified daily snapshots. Without storage,
          provider outages show unavailable data on a new visit; an open page
          can retain its last verified readings.
        </p>
      </Panel>
    </>
  );
}
