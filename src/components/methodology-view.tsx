"use client";

import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { DataBadge, Panel } from "@/components/primitives";
import { formatMoney } from "@/lib/format";
import type { DashboardSnapshot } from "@/lib/types";

const paragraphs = [
  "Arthur Hayes’s “Dust on Crust” described a synthetic dollar built from long spot exposure and a short perpetual-futures hedge. The hedge is intended to offset the spot price move while funding and basis can provide a return.",
  "Guy Young and Ethena shipped this structure as USDe. Its economics depend on collateral, hedge venues, funding, liquidity and operational constraints, so no single yield number explains supply by itself.",
  "Only primary-market minting and redemption change USDe supply. Secondary-market trading changes the price and creates an arbitrage signal, but it is not itself a supply event.",
  "A premium can reward an eligible counterparty for minting USDe and selling it. A discount can reward buying USDe and redeeming it, after fees, spreads, capacity and whitelist constraints.",
  "The supplied research brief identifies Pendle and Aave leverage loops as amplifiers of 2025 growth. The loop panel here is synthetic until protocol positions and borrow rates are connected.",
  "The brief also labels October 2025 and April 2026 as redemption regimes. Their dates and causal attribution remain source-required annotations in this demo.",
  "ForceScore is descriptive: it combines five trailing z-scores with fixed weights. It is not a forecast, causal model or estimate with proven R².",
  "A backing ratio near 100% does not mean supply cannot fall. It means reported assets may cover liabilities; counterparties can still redeem, and backing composition, liquidity and settlement matter.",
  "The deterministic demo archive is designed to reproduce the requested 2024–2026 shape. Values labeled Demo or Simulated are not observed market data or on-chain transactions.",
];

export default function MethodologyView({ data }: { data: DashboardSnapshot }) {
  const score = data.forces[data.forces.length - 1].forceScore;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DEFINITIONS · SOURCES · LIMITS</div>
          <h1>Methodology</h1>
          <p>What supply means, how the forces are interpreted, and what this first build can verify.</p>
        </div>
        <DataBadge status={data.mode === "partial-live" ? "live" : "simulated"} label={data.mode === "partial-live" ? "SUPPLY PARTIAL-LIVE" : "DEMO ARCHIVE"} />
      </div>

      <Panel title="From hedge economics to USDe supply" eyebrow="THE MODEL IN PLAIN ENGLISH">
        <div className="method-copy">
          {paragraphs.map((paragraph, index) => (
            <p key={index}><span>{String(index + 1).padStart(2, "0")}</span>{paragraph}</p>
          ))}
        </div>
      </Panel>

      <div className="content-grid two-up">
        <Panel title="ForceScore inputs" eyebrow="FIXED DEFAULT WEIGHTS">
          <div className="formula-table">
            <div><code>+ 0.30</code><b>sUSDe APY − T-bill</b><span>Carry advantage, percentage points</span></div>
            <div><code>+ 0.25</code><b>ETH funding, 7d average</b><span>Annualized rate; positive generally pays a short hedge</span></div>
            <div><code>+ 0.25</code><b>Loop spread</b><span>sUSDe APY or PT implied yield less borrow APR</span></div>
            <div><code>+ 0.15</code><b>Peg premium − mint fee</b><span>Estimated mint-side arbitrage edge, basis points</span></div>
            <div><code>− 0.05</code><b>Redemption stress</b><span>Fee and liquidity-stress proxy</span></div>
          </div>
          <p className="small-note">Each component is standardized using its trailing 90 observations. The 90-day window is an implementation choice for the demo, not an empirically optimized parameter.</p>
          <div className="formula-output"><span>Current demo score</span><strong>{score.toFixed(2)}</strong></div>
        </Panel>
        <Panel title="Observed vs simulated" eyebrow="DATA PROVENANCE">
          <div className="provenance-list">
            <div><DataBadge status={data.sources.supply.status} /><span><b>Supply history</b><small>{data.sources.supply.note}</small></span></div>
            <div><DataBadge status={data.sources.flows.status} /><span><b>Primary-market tape</b><small>{data.sources.flows.note}</small></span></div>
            <div><DataBadge status={data.sources.forces.status} /><span><b>Market force series</b><small>{data.sources.forces.note}</small></span></div>
            <div><DataBadge status="simulated" /><span><b>Events and concentration</b><small>Calendar labels and account identities need a verified source.</small></span></div>
          </div>
          <div className="method-callout"><Info size={14} /><span>When a provider fails, the UI stays populated and marks the source stale. It never silently presents fallback values as live observations.</span></div>
        </Panel>
      </div>

      <Panel title="Source adapters" eyebrow="CURRENT COVERAGE">
        <div className="source-adapter-grid">
          <div><span className="source-adapter-index">01</span><b>DeFiLlama stablecoins API</b><small>USDe catalog and chain-history supply. Enabled when USDE_DATA_PROVIDER is not mock.</small></div>
          <div><span className="source-adapter-index">02</span><b>Ethena Mint / Redeem or Dune</b><small>Not yet connected. Wire a Dune query or indexed event adapter to replace the demo tape.</small></div>
          <div><span className="source-adapter-index">03</span><b>Yield, funding, peg and loop</b><small>Panels have a provider boundary; live source adapters remain to be connected per metric.</small></div>
        </div>
        <div className="method-bottom-line">
          <div className="method-equation">
            <span className="mint-text"><ArrowUpRight size={13} /> Mints</span>
            <span>−</span>
            <span className="redeem-text"><ArrowDownRight size={13} /> Redeems</span>
            <span>=</span>
            <b>Net supply change</b>
          </div>
          <span>Circulating supply now {formatMoney(data.currentSupply)}</span>
        </div>
      </Panel>
    </>
  );
}
