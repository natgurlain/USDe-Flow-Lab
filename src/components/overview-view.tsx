"use client";

import { ArrowDownRight, ArrowUpRight, ExternalLink, Info } from "lucide-react";
import {
  CumulativeFlowChart,
  FlowChart,
  ForceHistoryChart,
  ForceScatterChart,
  SupplyChart,
} from "@/components/charts";
import { DataBadge, ForceCard, Panel } from "@/components/primitives";
import { formatBps, formatMoney, formatSignedMoney } from "@/lib/format";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/view-state";
import type { DashboardSnapshot } from "@/lib/types";

export default function OverviewView({
  data,
  range,
  onRangeChange,
  logScale,
  onLogScaleChange,
}: {
  data: DashboardSnapshot;
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
  logScale: boolean;
  onLogScaleChange: (value: boolean) => void;
}) {
  const currentForce = data.forces[data.forces.length - 1];
  const demoNet7d = data.flows.slice(-7).reduce((sum, point) => sum + point.net, 0);
  const supplyHistory = data.supplyPoints;
  const sevenDaySupplyDelta =
    supplyHistory.length > 7
      ? supplyHistory[supplyHistory.length - 1].supply - supplyHistory[supplyHistory.length - 8].supply
      : demoNet7d;
  const sevenDayDelta = data.mode === "partial-live" ? sevenDaySupplyDelta : demoNet7d;
  const carrySpread7d =
    data.forces.slice(-7).reduce((sum, point) => sum + point.carrySpread, 0) /
    Math.min(7, data.forces.length);
  const regime =
    sevenDayDelta > 75_000_000 && carrySpread7d > 0.15
      ? "Expansion"
      : sevenDayDelta < -75_000_000 ||
          (sevenDayDelta < 0 && carrySpread7d <= 0)
        ? "Contraction"
        : "Neutral";
  const carryPositive = currentForce.carrySpread > 0;
  const loopsPositive = currentForce.loopSpread > 0;
  const explanation =
    carryPositive && loopsPositive
      ? "Carry and the loop spread both support mint-side interest."
      : carryPositive
        ? "Carry is positive; leverage is not adding to the mint incentive."
        : loopsPositive
          ? "Loop economics are positive while carry trails the T-bill."
          : "Carry and leverage both lean toward redemption.";

  return (
    <>
      <div className="overview-intro">
        <div className="overview-lede">
          <div className="eyebrow">SUPPLY, THEN THE FORCES</div>
          <h1>Why is USDe moving?</h1>
          <p>
            Supply changes when counterparties mint or redeem. Carry, hedging, leverage and the peg
            change how attractive each side is.
          </p>
        </div>
        <div className={"regime-badge " + regime.toLowerCase()}>
          <span className="regime-pulse" />
          <div>
            <small>{data.mode === "partial-live" ? "SUPPLY REGIME · FLOW DEMO" : "DEMO REGIME"}</small>
            <strong>{regime}</strong>
          </div>
        </div>
      </div>

      <div className="plain-read" role="status">
        <div className="plain-read-marker"><Info size={15} /></div>
        <p>
          {data.mode === "partial-live" ? (
            <>
              Live supply is {formatMoney(data.currentSupply)}; 7d supply change{" "}
              <strong className={sevenDayDelta >= 0 ? "mint-text" : "redeem-text"}>
                {formatSignedMoney(sevenDayDelta)}
              </strong>
              . Tape and force attribution are simulated, so this build cannot identify a live
              driver.
            </>
          ) : (
            <>
              Simulated 7d net {formatSignedMoney(sevenDayDelta)}. {explanation}
            </>
          )}
        </p>
      </div>

      <div className="overview-grid">
        <div className="overview-main">
          <Panel
            title="Supply & ForceScore"
            eyebrow="SUPPLY STOCK · USD + HEURISTIC SCORE"
            className="supply-panel"
            action={
              <div className="chart-controls">
                <div className="segmented range-control" aria-label="Supply chart time range">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={range === option.key ? "selected" : ""}
                      onClick={() => onRangeChange(option.key)}
                      aria-pressed={range === option.key}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="segmented scale-control" aria-label="Supply chart scale">
                  <button
                    type="button"
                    className={!logScale ? "selected" : ""}
                    onClick={() => onLogScaleChange(false)}
                    aria-pressed={!logScale}
                  >
                    Linear
                  </button>
                  <button
                    type="button"
                    className={logScale ? "selected" : ""}
                    onClick={() => onLogScaleChange(true)}
                    aria-pressed={logScale}
                  >
                    Log
                  </button>
                </div>
              </div>
            }
          >
            <div className="panel-source-line">
              <span>Supply in USD (left axis) · ForceScore around zero (right axis)</span>
              <span className="source-badges">
                <DataBadge
                  status={data.sources.supply.status}
                  label={
                    data.sources.supply.status === "live"
                      ? "LIVE SUPPLY"
                      : data.sources.supply.status === "stale"
                        ? "STALE SUPPLY"
                        : "DEMO SUPPLY"
                  }
                />
                <DataBadge
                  status={data.sources.forces.status}
                  label={
                    data.sources.forces.status === "live"
                      ? "LIVE SCORE"
                      : data.sources.forces.status === "stale"
                        ? "STALE SCORE"
                        : "DEMO SCORE"
                  }
                />
              </span>
            </div>
            <SupplyChart
              data={data.supplyPoints}
              events={data.events}
              forces={data.forces}
              range={range}
              logScale={logScale}
            />
            <div className="chart-legend">
              <span><i className="legend-line supply-line" />USDe supply</span>
              <span><i className="legend-block score-positive" />Positive score · mint-side</span>
              <span><i className="legend-block score-negative" />Negative score · redeem-side</span>
              <span className="legend-note">ATH annotation: ~$14.8B · Oct 2025 · demo path</span>
            </div>
          </Panel>

          <Panel
            title="The tape"
            eyebrow="PRIMARY-MARKET FLOW · USDE / DAY"
            action={
              <a className="panel-link" href="/tape">
                Open tape <ExternalLink size={12} />
              </a>
            }
          >
            <div className="panel-source-line">
              <span>Mint positive · redeem negative · net in white</span>
              <DataBadge status="simulated" label="SIMULATED TAPE" />
            </div>
            <FlowChart data={data.flows} range={range} height={236} />
            <div className="chart-legend">
              <span><i className="legend-block mint-bg" />Mints</span>
              <span><i className="legend-block redeem-bg" />Redeems</span>
              <span><i className="legend-line net-line" />Net supply change</span>
            </div>
          </Panel>

          <Panel
            title="Cumulative net minted"
            eyebrow="MINTS − REDEEMS"
            action={<span className="panel-meta">Since Feb 2024 · simulated</span>}
          >
            <CumulativeFlowChart data={data.flows} range={range} height={200} />
          </Panel>
        </div>

        <aside className="overview-rail">
          <div className="rail-heading">
            <div>
              <div className="eyebrow">MARKET FORCES</div>
              <h2>What moves the tape?</h2>
            </div>
            <a className="panel-link" href="/forces">All forces →</a>
          </div>
          <div className="force-card-grid">
            <ForceCard kind="carry" data={data.forces} compact />
            <ForceCard kind="funding" data={data.forces} compact />
            <ForceCard kind="loop" data={data.forces} compact />
            <ForceCard kind="peg" data={data.forces} compact />
          </div>

          <Panel title="How to read the signal" eyebrow="CAUSAL CHAIN">
            <div className="causal-chain">
              <div className="causal-step">
                <span className="causal-index">01</span>
                <div><b>Yield & hedge</b><small>Carry and funding change the cost of holding the position.</small></div>
              </div>
              <div className="causal-connector" />
              <div className="causal-step">
                <span className="causal-index">02</span>
                <div><b>Loop & peg</b><small>Borrow spreads and secondary price add or remove arbitrage.</small></div>
              </div>
              <div className="causal-connector" />
              <div className="causal-step outcome">
                <span className="causal-index">03</span>
                <div><b>Mint or redeem</b><small>Whitelisted primary-market flow changes circulating supply.</small></div>
                <span className={sevenDayDelta >= 0 ? "outcome-icon mint-text" : "outcome-icon redeem-text"}>
                  {sevenDayDelta >= 0 ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="What this view knows" eyebrow="SOURCE STATUS">
            <div className="source-status-list">
              <div><span>Supply history</span><DataBadge status={data.sources.supply.status} /></div>
              <div><span>Mint / redeem tape</span><DataBadge status={data.sources.flows.status} /></div>
              <div><span>Market forces</span><DataBadge status={data.sources.forces.status} /></div>
              <p>
                {data.sources.supply.note} {data.sources.flows.note}
              </p>
            </div>
          </Panel>
        </aside>
      </div>

      <Panel
        title="ForceScore vs the next 7 days"
        eyebrow="TRANSPARENT HEURISTIC · NOT A FORECAST"
        action={<span className="panel-meta">Score at day t · flow from t+1 to t+7</span>}
        className="force-score-panel"
      >
        <p className="panel-description">
          The score combines carry, ETH funding, loop spread, net peg premium and redemption stress.
          Each term is standardized against its trailing 90 days using the published default weights.
        </p>
        <div className="force-score-grid">
          <div>
            <div className="subchart-heading"><b>ForceScore and following 7d net</b><span>Over time</span></div>
            <ForceHistoryChart data={data.forces} range={range} height={250} />
          </div>
          <div>
            <div className="subchart-heading"><b>Score vs next-7d net</b><span>One point per day</span></div>
            <ForceScatterChart data={data.forces.slice(-365)} height={250} />
          </div>
        </div>
        <div className="formula-strip">
          <code>
            0.30 carry + 0.25 ETH funding + 0.25 loop spread + 0.15 peg edge − 0.05 redemption stress
          </code>
          <span>Descriptive only · no proven R²</span>
          <a href="/methodology">Methodology <ExternalLink size={11} /></a>
        </div>
        <div className="score-caveat">
          <Info size={13} />
          <span>
            Demo force readings are synthetic. A live supply line does not imply live tape or causal
            attribution.
          </span>
          <span>Current peg edge {formatBps(currentForce.pegBps - currentForce.mintFeeBps)}</span>
        </div>
      </Panel>
    </>
  );
}
