"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { TokenGuide } from "./token-guide";
import { SupplyGrowth } from "./supply-growth";
import { HistoryPanel } from "./history-panel";
import { MetricCard, Panel } from "./primitives";
import { formatCompact, formatMoney, formatSignedMoney } from "@/lib/format";
import { pegDifference, type RangeKey } from "@/lib/metrics";
import type { DashboardSnapshot } from "@/lib/types";

export default function OverviewView({
  data,
  range,
  chartControls,
}: {
  data: DashboardSnapshot;
  range: RangeKey;
  chartControls: ReactNode;
}) {
  const { metrics: m } = data;
  const delta = m.supplyChange7d.value;
  const realized = m.realized7d.value !== null;
  const shownYield = realized ? m.realized7d : m.yield;
  const peg = pegDifference(m.price.value);
  const viewQuery = range === "90d" ? "" : "?range=" + range;
  const supplySummary =
    delta === null
      ? "A seven-day supply comparison is unavailable."
      : `Across the latest seven-day observation window, USDe supply ${delta >= 0 ? "grew" : "fell"} by ${formatMoney(Math.abs(delta))} at its $1 target.`;
  const priceSummary =
    m.price.value === null
      ? "The latest market price is unavailable."
      : `The latest available reference price is $${m.price.value.toFixed(4)}, ${Math.abs(peg!).toFixed(3)}% ${peg! >= 0 ? "above" : "below"} its $1 target.`;
  return (
    <>
      <section className="overview-intro">
        <p className="eyebrow">INDEPENDENT ETHENA DASHBOARD</p>
        <h1>
          Digital dollars.
          <br />
          <span>A clearer perspective.</span>
        </h1>
        <p>
          Follow USDe supply, understand sUSDe yield, and explore the backing.
          Public data, explained in plain English.
        </p>
        <div className="hero-actions">
          <Link href={"/flow" + viewQuery} className="hero-action primary">
            Explore USDe flow <ArrowRight size={16} />
          </Link>
          <Link href="/learn" className="hero-action">
            Start with the basics <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <div className="headline-grid">
        <MetricCard
          label="USDe market price"
          value={
            m.price.value === null
              ? "Unavailable"
              : "$" + m.price.value.toFixed(4)
          }
          detail={
            peg === null
              ? undefined
              : `${peg >= 0 ? "+" : ""}${peg.toFixed(3)}% from the $1 target`
          }
          explanation="How close USDe is trading to one dollar."
          metric={m.price}
        />
        <MetricCard
          label="USDe in circulation"
          value={
            m.supply.value === null
              ? "Unavailable"
              : formatCompact(m.supply.value)
          }
          detail={m.supply.value === null ? undefined : "USDe tokens"}
          explanation="The total amount of USDe tracked by the source."
          metric={m.supply}
        />
        <MetricCard
          label="Supply change · 7 days"
          value={delta === null ? "Unavailable" : formatSignedMoney(delta)}
          detail={delta === null ? undefined : "USDe valued at the $1 target"}
          explanation="Whether the tracked supply grew or shrank."
          metric={m.supplyChange7d}
        />
        <MetricCard
          label={realized ? "sUSDe yield · 7 days" : "sUSDe estimated yield"}
          value={
            shownYield.value === null
              ? "Unavailable"
              : shownYield.value.toFixed(2) + "%"
          }
          detail={
            realized
              ? "Realized · annualized APY"
              : "Estimated annual yield · APY"
          }
          explanation={
            realized
              ? "Past seven days, annualized. Future returns vary."
              : "A recent reward rate expressed over a year. It can change."
          }
          metric={shownYield}
        />
      </div>
      <div className="plain-summary">
        <span className="summary-icon">↗</span>
        <div>
          <h3>What the available data says</h3>
          <p>
            {priceSummary} {supplySummary} These observations alone do not
            explain why supply changed.
          </p>
        </div>
      </div>
      <SupplyGrowth data={data} />
      {chartControls}
      <div className="charts-grid">
        <HistoryPanel
          title="How much USDe is out there?"
          eyebrow="SUPPLY OVER TIME"
          description="A rising line means more USDe in circulation; a falling line means less. Values use its $1 target."
          points={data.supplyHistory}
          metric={m.supply}
          range={range}
          kind="supply"
        />
        <HistoryPanel
          title="Is USDe close to $1?"
          eyebrow="PRICE OVER TIME"
          description="Distance from $1 in percent. The chart shows at least −0.5% to +0.5% for context, not a safety threshold. Daily samples can miss short-lived moves."
          points={data.priceHistory}
          metric={data.priceHistoryMeta}
          range={range}
          kind="price"
        />
      </div>
      <section className="quick-guide" aria-label="Understand the essentials">
        <article className="guide-card">
          <CircleDollarSign size={24} strokeWidth={1.5} />
          <h3>A dollar designed to track $1</h3>
          <p>
            USDe is a synthetic dollar. Holding it alone does not earn staking
            rewards.
          </p>
          <Link href="/learn" className="text-link">
            Understand USDe <ArrowRight size={14} />
          </Link>
        </article>
        <article className="guide-card">
          <Layers size={24} strokeWidth={1.5} />
          <h3>Where the yield comes from</h3>
          <p>
            sUSDe is staked USDe. Rewards can increase its value in USDe;
            returns vary.
          </p>
          <Link href={"/yield" + viewQuery} className="text-link">
            Explore sUSDe yield <ArrowRight size={14} />
          </Link>
        </article>
        <article className="guide-card">
          <ShieldCheck size={24} strokeWidth={1.5} />
          <h3>Understand the backing</h3>
          <p>Coverage alone does not guarantee immediate redemption.</p>
          <p className="guide-meta">
            Reported backing:{" "}
            {m.backing.value === null
              ? "Unavailable; check the issuer report."
              : `${m.backing.value.toFixed(2)}% including reserve · observed ${m.backing.observedAt?.slice(0, 10)} · ${m.backing.status === "stale" ? "last verified / delayed" : m.backing.status === "demo" ? "demo" : "issuer report"}.`}
          </p>
          <Link href={"/backing" + viewQuery} className="text-link">
            Explore backing & risks <ArrowRight size={14} />
          </Link>
          <a
            className="text-link"
            href="https://app.ethena.fi/dashboards/transparency"
            target="_blank"
            rel="noreferrer"
          >
            Official backing reports <ArrowUpRight size={14} />
          </a>
        </article>
      </section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">THREE DIFFERENT ROLES</p>
          <h2>Meet the tokens</h2>
        </div>
        <Link className="text-link" href="/learn">
          How it works <ArrowRight size={14} />
        </Link>
      </div>
      <TokenGuide />
      <div className="two-column">
        <Panel title="Follow the USDe flow" eyebrow="GO A LITTLE DEEPER">
          <p className="body-copy">
            See supply grow and shrink over time, and understand the difference
            between new dollars, redeemed dollars, and everyday trading.
          </p>
          <Link href={"/flow?range=" + range} className="text-link">
            Explore USDe Flow <ArrowRight size={16} />
          </Link>
        </Panel>
        <Panel
          title="Around the Ethena ecosystem"
          eyebrow="KEEP THE ROLES SEPARATE"
        >
          <div className="ecosystem-row">
            <div>
              <b>ENA market price</b>
              <p>Governance token · a separate market from USDe</p>
            </div>
            <strong>
              {m.enaPrice.value === null
                ? "Unavailable"
                : "$" + m.enaPrice.value.toFixed(4)}
            </strong>
          </div>
          <div className="ecosystem-source">
            <a href={m.enaPrice.sourceUrl} target="_blank" rel="noreferrer">
              {m.enaPrice.source} · {m.enaPrice.status} ·{" "}
              {m.enaPrice.observedAt?.replace("T", " ").slice(0, 16) ??
                "No observation"}
              <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="ecosystem-row">
            <div>
              <b>USDtb</b>
              <p>
                A separate dollar product backed primarily by tokenized US
                Treasuries. Its supply is excluded here.
              </p>
            </div>
            <a
              aria-label="USDtb official website"
              href="https://usdtb.money/"
              target="_blank"
              rel="noreferrer"
            >
              <ArrowUpRight size={20} />
            </a>
          </div>
          <a
            className="text-link"
            href="https://gov.ethenafoundation.com/"
            target="_blank"
            rel="noreferrer"
          >
            Read official governance updates <ArrowUpRight size={14} />
          </a>
        </Panel>
      </div>
    </>
  );
}
