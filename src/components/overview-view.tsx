"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Layers,
  Vote,
} from "lucide-react";
import { HistoryPanel } from "./history-panel";
import { MetricCard, Panel } from "./primitives";
import { formatCompact, formatMoney, formatSignedMoney } from "@/lib/format";
import { pegDifference, type RangeKey } from "@/lib/metrics";
import type { DashboardSnapshot } from "@/lib/types";

export function TokenGuide() {
  return (
    <div className="token-guide">
      {[
        {
          name: "USDe",
          category: "The dollar",
          icon: CircleDollarSign,
          copy: "A synthetic dollar designed to track $1. Holding it alone does not automatically earn staking rewards.",
        },
        {
          name: "sUSDe",
          category: "The staked dollar",
          icon: Layers,
          copy: "Stake USDe to receive sUSDe. Protocol rewards can increase the USDe value of each share. Yield varies.",
        },
        {
          name: "ENA",
          category: "The governance token",
          icon: Vote,
          copy: "A token for Ethena governance. Its market price can move independently of USDe; holding it is not company ownership.",
        },
      ].map(({ name, category, icon: Icon, copy }) => (
        <article key={name} className="token-card">
          <div className="token-top">
            <Icon size={22} strokeWidth={1.5} />
            <span>{category}</span>
          </div>
          <h3>{name}</h3>
          <p>{copy}</p>
        </article>
      ))}
    </div>
  );
}
export default function OverviewView({
  data,
  range,
}: {
  data: DashboardSnapshot;
  range: RangeKey;
}) {
  const { metrics: m } = data;
  const delta = m.supplyChange7d.value;
  const peg = pegDifference(m.price.value);
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
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="small-line" /> INDEPENDENT ETHENA DASHBOARD
          </p>
          <h1>
            The big picture.
            <br />
            <span>In plain English.</span>
          </h1>
          <p className="hero-description">
            Understand Ethena, its dollars, its yield, and its risks.
            <br className="desktop-break" /> Start here. Explore the details
            when you need them.
          </p>
          <Link href="/learn" className="hero-link">
            New to Ethena? Start with the basics <ArrowRight size={16} />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="dollar-mark">
            e<span>≋</span>
          </div>
          <span className="art-caption">DOLLARS · YIELD · TRANSPARENCY</span>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">FIVE THINGS TO KNOW</p>
          <h2>Ethena at a glance</h2>
        </div>
        <span className="quiet">Observation dates shown on every card</span>
      </div>
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
          label="sUSDe estimated yield"
          value={
            m.yield.value === null
              ? "Unavailable"
              : m.yield.value.toFixed(2) + "%"
          }
          detail="Estimated annual yield · APY"
          explanation="A recent reward rate expressed over a year. It can change."
          metric={m.yield}
        />
        <MetricCard
          label="Reported backing"
          value={
            m.backing.value === null
              ? "Unavailable"
              : m.backing.value.toFixed(2) + "%"
          }
          detail="Issuer-reported coverage"
          explanation="Reported assets relative to the dollars they back."
          metric={m.backing}
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
          description="Daily reference prices compared with the $1 target. Short-lived moves between samples may be missed."
          points={data.priceHistory}
          metric={data.priceHistoryMeta}
          range={range}
          kind="price"
        />
      </div>
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
