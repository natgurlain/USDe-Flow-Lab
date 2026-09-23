"use client";

import { Info } from "lucide-react";
import { DriverHistoryChart, ForceHistoryChart, StakingRatioChart } from "@/components/charts";
import { DataBadge, ForceCard, Panel } from "@/components/primitives";
import { formatMoney, formatPercent } from "@/lib/format";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/view-state";
import type { DashboardSnapshot } from "@/lib/types";

const backingMix = [
  { label: "Crypto basis", share: 0.54, color: "#9bc6ff" },
  { label: "Liquid stables", share: 0.18, color: "#3ddc97" },
  { label: "RWA", share: 0.14, color: "#f0bd69" },
  { label: "DeFi lending", share: 0.08, color: "#d5a6ff" },
  { label: "Institutional lending", share: 0.06, color: "#758087" },
];

export default function ForcesView({
  data,
  range,
  onRangeChange,
}: {
  data: DashboardSnapshot;
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}) {
  const current = data.forces[data.forces.length - 1];
  const currentStakingRatio = data.supplyPoints[data.supplyPoints.length - 1].stakingRatio;
  const loopExposure = data.currentSupply * 0.176;
  const loops = [
    { name: "Aave", exposure: loopExposure * 0.56, spread: current.loopSpread, type: "Lending loop" },
    { name: "Morpho", exposure: loopExposure * 0.26, spread: current.loopSpread - 21, type: "Lending loop" },
    { name: "Pendle PT", exposure: loopExposure * 0.18, spread: current.loopSpread + 32, type: "Fixed-yield loop" },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ECONOMIC DRIVERS</div>
          <h1>Forces behind supply</h1>
          <p>Each panel shows what pushes an authorized counterparty toward a mint or a redeem.</p>
        </div>
        <DataBadge status={data.sources.forces.status} label="DRIVER DATA · DEMO" />
      </div>
      <div className="page-toolbar">
        <div className="segmented range-control" aria-label="Force history time range">
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
        <p>Default ForceScore weights · 0.30 / 0.25 / 0.25 / 0.15 / 0.05</p>
      </div>

      <div className="force-detail-grid">
        <ForceCard kind="carry" data={data.forces} />
        <ForceCard kind="funding" data={data.forces} />
        <ForceCard kind="loop" data={data.forces} />
        <ForceCard kind="peg" data={data.forces} />
      </div>

      <div className="content-grid two-up driver-history-grid">
        <Panel title="Carry edge" eyebrow="sUSDE APY VS 3-MONTH T-BILL">
          <div className="panel-source-line"><span>Shade meaning: APY above bill yield favors holding USDe.</span><DataBadge status="simulated" /></div>
          <DriverHistoryChart data={data.forces} range={range} kind="carry" />
          <p className="driver-note"><b>Mint:</b> positive carry widens demand to hold USDe. <b>Redeem:</b> carry below alternatives reduces that incentive.</p>
        </Panel>
        <Panel title="Perp funding / basis" eyebrow="ETH 7D AVERAGE · ANNUALIZED">
          <div className="panel-source-line"><span>Positive funding generally pays a short hedge.</span><DataBadge status="simulated" /></div>
          <DriverHistoryChart data={data.forces} range={range} kind="funding" />
          <p className="driver-note"><b>Mint:</b> positive funding supports the delta-hedged carry trade. <b>Redeem:</b> sustained negative funding raises hedge cost.</p>
        </Panel>
        <Panel title="Leverage loop" eyebrow="sUSDE YIELD − BORROW APR">
          <div className="panel-source-line"><span>Non-positive spread signals loop-unwind pressure.</span><DataBadge status="simulated" /></div>
          <DriverHistoryChart data={data.forces} range={range} kind="loop" />
          <p className="driver-note"><b>Mint:</b> positive borrow-adjusted spread can support leverage loops. <b>Redeem:</b> spread at or below zero can unwind them.</p>
        </Panel>
        <Panel title="Secondary peg" eyebrow="DEX / CEX PRICE VS $1">
          <div className="panel-source-line"><span>Estimated fee is applied before showing arbitrage edge.</span><DataBadge status="simulated" /></div>
          <DriverHistoryChart data={data.forces} range={range} kind="peg" />
          <p className="driver-note"><b>Mint:</b> premium above mint fees supports mint-and-sell. <b>Redeem:</b> discount beyond redeem costs supports buy-and-redeem.</p>
        </Panel>
      </div>

      <Panel title="Borrow-loop exposure" eyebrow="AAVE · MORPHO · PENDLE" action={<DataBadge status="simulated" />}>
        <div className="loop-summary">
          <div><span>MODELED DEPOSITS</span><strong>{formatMoney(loopExposure)}</strong></div>
          <div><span>OF CIRCULATING SUPPLY</span><strong>17.6%</strong></div>
          <div><span>LOOP SPREAD</span><strong className={current.loopSpread > 0 ? "mint-text" : "redeem-text"}>{Math.round(current.loopSpread)} bps</strong></div>
          <div><span>MODELED AAVE BORROW APR</span><strong>{formatPercent(current.susdeApy - current.loopSpread / 100)}</strong></div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Venue</th><th>Position type</th><th className="numeric">Modeled exposure</th><th className="numeric">Spread</th><th>Regime</th></tr></thead>
            <tbody>
              {loops.map((loop) => (
                <tr key={loop.name}>
                  <td>{loop.name}</td>
                  <td>{loop.type}</td>
                  <td className="numeric mono">{formatMoney(loop.exposure)}</td>
                  <td className="numeric mono">{Math.round(loop.spread)} bps</td>
                  <td><span className={"side-pill " + (loop.spread > 0 ? "mint" : "redeem")}>{loop.spread > 0 ? "Mint incentive" : "Loop unwind"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small-note">Exposure allocation and venue spreads are illustrative; no live protocol positions are connected.</p>
      </Panel>

      <div className="content-grid two-up">
        <Panel title="Capacity and friction" eyebrow="MINT / REDEEM COSTS">
          <div className="fee-grid">
            {[
              { asset: "USDC", mint: 5, redeem: 5 },
              { asset: "USDT", mint: 8, redeem: 8 },
              { asset: "stETH", mint: 22, redeem: 24 },
              { asset: "Other", mint: null, redeem: null },
            ].map((fee) => (
              <div className="fee-row" key={fee.asset}>
                <b>{fee.asset}</b>
                <span>Mint <strong>{fee.mint === null ? "n/a" : fee.mint + " bps"}</strong></span>
                <span>Redeem <strong>{fee.redeem === null ? "n/a" : fee.redeem + " bps"}</strong></span>
              </div>
            ))}
          </div>
          <div className="unknown-capacity"><Info size={14} /><span>Per-block caps, idle contract liquidity and queue length are not reported by this adapter.</span></div>
          <p className="small-note">Fee values shown are synthetic placeholders and are not Ethena’s fee schedule.</p>
        </Panel>
        <Panel title="Backing mix · yield engine" eyebrow="COMPOSITION IS CONTEXT, NOT A DIRECT MINT SIGNAL">
          <div className="backing-total"><strong>100.2%</strong><span>illustrative backing ratio</span></div>
          <div className="backing-list">
            {backingMix.map((item) => (
              <div className="backing-row" key={item.label}>
                <span><i style={{ background: item.color }} />{item.label}</span>
                <div className="backing-track"><i style={{ width: item.share * 100 + "%", background: item.color }} /></div>
                <b>{(item.share * 100).toFixed(0)}%</b>
              </div>
            ))}
          </div>
          <p className="small-note">The mix is an illustrative snapshot. Backing near 100% does not prevent redemptions or a falling supply.</p>
        </Panel>
      </div>

      <div className="content-grid two-up">
        <Panel title="sUSDe staking ratio" eyebrow="sUSDE SUPPLY / CIRCULATING USDE" action={<DataBadge status="simulated" />}>
          <div className="backing-total">
            <strong>{(currentStakingRatio * 100).toFixed(1)}%</strong>
            <span>of circulating USDe · illustrative</span>
          </div>
          <StakingRatioChart data={data.supplyPoints} range={range} height={214} />
          <p className="small-note">The ratio and sUSDe share supply are modeled until an official staking-supply source is connected.</p>
        </Panel>
        <Panel
          title="Supply by chain"
          eyebrow="CURRENT CIRCULATING DISTRIBUTION"
          action={<DataBadge status={data.sources.supply.status} label={data.sources.supply.status === "live" ? "LIVE · DEFILLAMA" : "SIMULATED"} />}
        >
          <div className="chain-distribution">
            {data.chainBreakdown.slice(0, 8).map((chain) => (
              <div className="chain-row" key={chain.chain}>
                <span>{chain.chain}</span>
                <div className="backing-track"><i style={{ width: chain.share * 100 + "%", background: "#87a7a0" }} /></div>
                <b>{formatMoney(chain.supply)}</b>
                <small>{(chain.share * 100).toFixed(1)}%</small>
              </div>
            ))}
          </div>
          <p className="small-note">
            {data.sources.supply.status === "live"
              ? "Per-chain circulating history from DeFiLlama; small differences from the headline total can reflect source timestamps."
              : "Chain shares are placeholders in the deterministic demo."}
          </p>
        </Panel>
      </div>

      <Panel title="Combined ForceScore" eyebrow="ROLLING Z-SCORES · HEURISTIC">
        <div className="score-formula">
          <span>+0.30 × carry</span><span>+0.25 × ETH funding</span><span>+0.25 × loop spread</span><span>+0.15 × peg after fees</span><span>−0.05 × redemption stress</span>
        </div>
        <ForceHistoryChart data={data.forces} range={range} height={290} />
        <p className="panel-description">This is a descriptive index with fixed default weights, not a trained model and not a validated predictor.</p>
      </Panel>
    </>
  );
}
