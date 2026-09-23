"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { CumulativeFlowChart, FlowChart } from "@/components/charts";
import { DataBadge, Panel } from "@/components/primitives";
import { formatDate, formatMoney, formatSignedMoney } from "@/lib/format";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/view-state";
import type { DashboardSnapshot } from "@/lib/types";

const assetColors: Record<string, string> = {
  USDT: "#58c8a0",
  USDC: "#64a9ff",
  stETH: "#a889ff",
  other: "#8b969a",
};

export default function TapeView({
  data,
  range,
  onRangeChange,
}: {
  data: DashboardSnapshot;
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}) {
  const totalMints = data.collateralBreakdown.reduce((sum, item) => sum + item.minted, 0);
  const totalRedeems = data.collateralBreakdown.reduce((sum, item) => sum + item.redeemed, 0);
  const topShare = data.topMinters.reduce((sum, item) => sum + item.share, 0);
  const visibleTransactions = data.transactions.slice(0, 18);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PRIMARY MARKET</div>
          <h1>The tape</h1>
          <p>Gross mints and redeems stay separate; net is the signed difference between them.</p>
        </div>
        <DataBadge status={data.sources.flows.status} label="SIMULATED TAPE" />
      </div>
      <div className="page-toolbar">
        <div className="segmented range-control" aria-label="Tape time range">
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
        <p>Daily values · {data.flows.length.toLocaleString()} simulated days</p>
      </div>

      <div className="tape-summary-grid">
        <div><span>30D MINTS</span><b className="mint-text">{formatMoney(totalMints)}</b></div>
        <div><span>30D REDEEMS</span><b className="redeem-text">{formatMoney(totalRedeems)}</b></div>
        <div><span>30D NET</span><b>{formatSignedMoney(totalMints - totalRedeems)}</b></div>
        <div><span>TOP 5 MINTERS SHARE</span><b>{(topShare * 100).toFixed(1)}%</b></div>
      </div>

      <div className="content-grid two-up">
        <Panel title="Mints and redeems by day" eyebrow="GROSS PRIMARY-MARKET FLOW">
          <div className="panel-source-line">
            <span>Positive bars mint · negative bars redeem · white line is net</span>
            <DataBadge status="simulated" />
          </div>
          <FlowChart data={data.flows} range={range} height={300} />
          <div className="chart-legend">
            <span><i className="legend-block mint-bg" />Mints</span>
            <span><i className="legend-block redeem-bg" />Redeems</span>
            <span><i className="legend-line net-line" />Net</span>
          </div>
        </Panel>
        <Panel title="Cumulative net minted" eyebrow="SUPPLY CHANGE SINCE FIRST DATA POINT">
          <div className="panel-source-line">
            <span>Net equals mints less redeems each day.</span>
            <DataBadge status="simulated" />
          </div>
          <CumulativeFlowChart data={data.flows} range={range} height={300} />
        </Panel>
      </div>

      <div className="content-grid two-up">
        <Panel title="Collateral mix" eyebrow="30D MINT / REDEEM VALUE">
          <div className="collateral-legend">
            {data.collateralBreakdown.map((item) => (
              <span key={item.asset}>
                <i style={{ background: assetColors[item.asset] }} />
                {item.asset}
              </span>
            ))}
          </div>
          <div className="asset-flow-row">
            <span className="asset-flow-label mint-text"><ArrowUpRight size={13} /> Mint</span>
            <div className="asset-stack">
              {data.collateralBreakdown.map((item) => (
                <span
                  key={item.asset}
                  style={{
                    width: (totalMints ? item.minted / totalMints : 0) * 100 + "%",
                    background: assetColors[item.asset],
                  }}
                  title={item.asset + " mints " + formatMoney(item.minted)}
                />
              ))}
            </div>
            <b>{formatMoney(totalMints)}</b>
          </div>
          <div className="asset-flow-row">
            <span className="asset-flow-label redeem-text"><ArrowDownRight size={13} /> Redeem</span>
            <div className="asset-stack">
              {data.collateralBreakdown.map((item) => (
                <span
                  key={item.asset}
                  style={{
                    width: (totalRedeems ? item.redeemed / totalRedeems : 0) * 100 + "%",
                    background: assetColors[item.asset],
                  }}
                  title={item.asset + " redeems " + formatMoney(item.redeemed)}
                />
              ))}
            </div>
            <b>{formatMoney(totalRedeems)}</b>
          </div>
          <div className="asset-values">
            {data.collateralBreakdown.map((item) => (
              <div key={item.asset}>
                <span><i style={{ background: assetColors[item.asset] }} />{item.asset}</span>
                <b className="mint-text">{formatMoney(item.minted)}</b>
                <b className="redeem-text">{formatMoney(item.redeemed)}</b>
              </div>
            ))}
          </div>
          <p className="small-note">Collaterals are an illustrative mix until primary-market logs are connected.</p>
        </Panel>

        <Panel title="Whitelisted minter concentration" eyebrow="TOP ACCOUNT SHARE · 30D FLOW">
          <div className="concentration-total">
            <strong>{(topShare * 100).toFixed(1)}%</strong>
            <span>of simulated 30d gross flow attributed to the top five accounts</span>
          </div>
          <div className="concentration-list">
            {data.topMinters.map((minter, index) => (
              <div className="concentration-row" key={minter.account}>
                <span className="concentration-rank">{String(index + 1).padStart(2, "0")}</span>
                <code>{minter.account}</code>
                <div className="concentration-bar"><i style={{ width: minter.share / data.topMinters[0].share * 100 + "%" }} /></div>
                <b>{(minter.share * 100).toFixed(1)}%</b>
              </div>
            ))}
          </div>
          <p className="small-note">
            Account identities and shares are generated placeholders. They are not real whitelist or wallet data.
          </p>
        </Panel>
      </div>

      <Panel
        title="Recent mint / redeem observations"
        eyebrow="TRANSACTION LOOKUP"
        action={<span className="panel-meta">{visibleTransactions.length} sample rows</span>}
      >
        <div className="panel-source-line">
          <span>Address and transaction IDs are placeholders in demo mode.</span>
          <Link className="panel-link" href="/methodology">Source notes <ExternalLink size={12} /></Link>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Side</th>
                <th>Account</th>
                <th className="numeric">USDe</th>
                <th>Collateral</th>
                <th className="numeric">Collateral USD</th>
                <th>Tx hash</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map((tx, index) => (
                <tr key={tx.ts + index}>
                  <td className="mono">{formatDate(tx.ts.slice(0, 10))} {tx.ts.slice(11, 16)}</td>
                  <td><span className={"side-pill " + tx.side}>{tx.side}</span></td>
                  <td><code className="table-address">{tx.account}</code></td>
                  <td className="numeric mono">{formatMoney(tx.usde)}</td>
                  <td>{tx.asset}</td>
                  <td className="numeric mono">{formatMoney(tx.assetUsd)}</td>
                  <td><span className="simulated-hash">sample · no on-chain hash</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
