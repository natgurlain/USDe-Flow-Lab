import type { ReactNode } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { ForceSparkline } from "@/components/charts";
import { formatBps, formatMoney, formatPercent, formatSignedMoney } from "@/lib/format";
import type { DashboardSnapshot, ForcePoint } from "@/lib/types";

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={"panel " + className}>
      <div className="panel-heading">
        <div>
          {eyebrow && <div className="panel-eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DataBadge({
  status,
  label,
}: {
  status: "live" | "simulated" | "stale";
  label?: string;
}) {
  const names = {
    live: "Live",
    simulated: "Demo",
    stale: "Stale",
  };
  return (
    <span className={"data-badge " + status}>
      <span className="data-badge-dot" />
      {label ?? names[status]}
    </span>
  );
}

export function MetricKpi({
  label,
  value,
  detail,
  tone = "neutral",
  title,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "mint" | "redeem" | "amber" | "blue";
  title?: string;
}) {
  return (
    <div className={"metric-kpi " + tone} title={title}>
      <div className="metric-kpi-label">{label}</div>
      <div className="metric-kpi-value">{value}</div>
      {detail && <div className="metric-kpi-detail">{detail}</div>}
    </div>
  );
}

export function FlowKpis({ data }: { data: DashboardSnapshot }) {
  const lastDay = data.flows[data.flows.length - 1];
  const demo24h = data.flows.slice(-1).reduce((sum, point) => sum + point.net, 0);
  const demo7d = data.flows.slice(-7).reduce((sum, point) => sum + point.net, 0);
  const demo30d = data.flows.slice(-30).reduce((sum, point) => sum + point.net, 0);
  const history = data.supplyPoints;
  const supplyDelta = (days: number, fallback: number) => {
    if (data.mode !== "partial-live" || history.length <= days) return fallback;
    return history[history.length - 1].supply - history[history.length - 1 - days].supply;
  };
  const last24h = supplyDelta(1, demo24h);
  const last7d = supplyDelta(7, demo7d);
  const last30d = supplyDelta(30, demo30d);
  const force = data.forces[data.forces.length - 1];
  const stakingRatio = data.supplyPoints[data.supplyPoints.length - 1].stakingRatio;
  const apySpread7d =
    data.forces.slice(-7).reduce((sum, point) => sum + point.carrySpread, 0) /
    Math.min(7, data.forces.length);
  const regime =
    last7d > 75_000_000 && apySpread7d > 0.15
      ? "Expansion"
      : last7d < -75_000_000 || (last7d < 0 && apySpread7d <= 0)
        ? "Contraction"
        : "Neutral";
  const regimeTone =
    regime === "Expansion" ? "mint" : regime === "Contraction" ? "redeem" : "neutral";

  return (
    <>
      <div className="kpi-grid">
        <MetricKpi
          label="CIRCULATING SUPPLY"
          value={formatMoney(data.currentSupply)}
          detail={
            <span>
              {data.mode === "partial-live" ? "Live total · history source below" : "Demo history"}
            </span>
          }
          tone={data.sources.supply.status === "live" ? "blue" : "neutral"}
          title="USDe supply across tracked chains. The demo value is synthetic."
        />
        <MetricKpi
          label={data.mode === "partial-live" ? "SUPPLY DELTA · 24H" : "NET SUPPLY CHANGE · 24H"}
          value={formatSignedMoney(last24h)}
          detail={
            <span>
              <span className="mint-text">M {formatMoney(lastDay.minted)}</span>
              <span> / </span>
              <span className="redeem-text">R {formatMoney(lastDay.redeemed)}</span>
              <span> · demo tape</span>
            </span>
          }
          tone={last24h >= 0 ? "mint" : "redeem"}
          title="Mints minus redeems for the most recent daily point; gross values are synthetic in this build."
        />
        <MetricKpi
          label={data.mode === "partial-live" ? "SUPPLY DELTA · 7D" : "NET SUPPLY CHANGE · 7D"}
          value={formatSignedMoney(last7d)}
          detail={<span className={"regime-inline " + regimeTone}>{regime} · {data.mode === "partial-live" ? "demo carry" : "demo tape"}</span>}
          tone={last7d >= 0 ? "mint" : "redeem"}
          title="Seven daily supply observations. The live supply adapter provides supply deltas; the detailed primary-market tape remains simulated."
        />
        <MetricKpi
          label={data.mode === "partial-live" ? "SUPPLY DELTA · 30D" : "NET SUPPLY CHANGE · 30D"}
          value={formatSignedMoney(last30d)}
          tone={last30d >= 0 ? "mint" : "redeem"}
          title="Thirty daily supply observations. The live supply adapter provides supply deltas; the detailed primary-market tape remains simulated."
        />
        <MetricKpi
          label="SECONDARY PRICE VS $1"
          value={formatBps(force.pegBps)}
          detail={<span>Demo VWAP · after fees {formatBps(force.pegBps - force.mintFeeBps)}</span>}
          tone={force.pegBps >= 0 ? "mint" : "redeem"}
          title="A premium can make mint-and-sell attractive; a discount can make buy-and-redeem attractive after fees."
        />
        <MetricKpi
          label="sUSDe APY"
          value={formatPercent(force.susdeApy)}
          detail={
            <span>
              T-bill {formatPercent(force.tBill)} · carry{" "}
              <b className={force.carrySpread >= 0 ? "mint-text" : "redeem-text"}>
                {(force.carrySpread > 0 ? "+" : "") + force.carrySpread.toFixed(2)} pp
              </b>
            </span>
          }
          tone={force.carrySpread >= 0 ? "mint" : "redeem"}
          title="sUSDe is staked USDe; APY is the staking contract’s realized reward rate."
        />
        <MetricKpi
          label="STAKING RATIO"
          value={(stakingRatio * 100).toFixed(1) + "%"}
          detail={<span>sUSDe / USDe · demo</span>}
          title="Share of circulating USDe represented by sUSDe in the demo dataset."
        />
        <MetricKpi
          label="PROTOCOL BACKING"
          value="100.2%"
          detail={<span>Illustrative ratio · not live</span>}
          title="Illustrative backing ratio. A ratio near 100% does not prevent supply from falling."
        />
      </div>
    </>
  );
}

type ForceKind = "carry" | "funding" | "loop" | "peg";

function readForce(force: ForcePoint, kind: ForceKind) {
  if (kind === "carry") {
    return {
      title: "Carry",
      value: formatPercent(force.susdeApy),
      detail: (force.carrySpread >= 0 ? "+" : "") + force.carrySpread.toFixed(2) + " pp vs T-bill",
      mint: "Mint: higher sUSDe yield can attract holding demand.",
      redeem: "Redeem: a weaker yield edge makes alternatives more attractive.",
      direction:
        force.carrySpread > 0.15 ? "mint" : force.carrySpread < -0.15 ? "redeem" : "neutral",
      badge:
        force.carrySpread > 0.15 ? "Push mint" : force.carrySpread < -0.15 ? "Push redeem" : "Balanced",
      definition: "sUSDe APY minus the 3-month Treasury bill yield; positive values favor holding USDe.",
      dataKey: "carrySpread" as const,
      color: "#3ddc97",
    };
  }
  if (kind === "funding") {
    return {
      title: "Funding / basis",
      value: (force.ethFunding7d > 0 ? "+" : "") + force.ethFunding7d.toFixed(1) + "%",
      detail: "ETH 7d average · annualized",
      mint: "Mint: positive funding pays the short-perp hedge.",
      redeem: "Redeem: negative funding makes the hedge costly.",
      direction: force.ethFunding7d > 2 ? "mint" : force.ethFunding7d < 0 ? "redeem" : "neutral",
      badge: force.ethFunding7d > 2 ? "Push mint" : force.ethFunding7d < 0 ? "Push redeem" : "Balanced",
      definition: "Annualized 7-day average ETH perpetual funding; positive rates generally pay the short side.",
      dataKey: "ethFunding7d" as const,
      color: "#9bc6ff",
    };
  }
  if (kind === "loop") {
    return {
      title: "Loop spread",
      value: formatBps(force.loopSpread),
      detail: "sUSDe APY − modeled borrow APR",
      mint: "Mint: a positive loop spread can make leverage profitable.",
      redeem: "Redeem: a non-positive spread can trigger loop unwinds.",
      direction: force.loopSpread > 0 ? "mint" : "redeem",
      badge: force.loopSpread <= 0 ? "Loop unwind" : "Push mint",
      definition: "sUSDe APY less the modeled USDe borrow APR; a non-positive spread removes the loop incentive.",
      dataKey: "loopSpread" as const,
      color: "#d5a6ff",
    };
  }
  const netPremium = force.pegBps - force.mintFeeBps;
  const redemptionEdge = force.pegBps + force.redeemFeeBps;
  const direction = netPremium > 0 ? "mint" : redemptionEdge < 0 ? "redeem" : "neutral";
  return {
    title: "Peg arbitrage",
    value: formatBps(force.pegBps),
    detail: "Net mint edge " + formatBps(netPremium),
    mint: "Mint: a premium above estimated mint fees rewards arbitrage.",
    redeem: "Redeem: a discount beyond redeem costs rewards buy-and-redeem.",
    direction,
    badge: direction === "mint" ? "Push mint" : direction === "redeem" ? "Push redeem" : "Fee-bound",
    definition: "Secondary-market price relative to $1; mint or redeem only when the gap exceeds estimated fees.",
    dataKey: "pegBps" as const,
    color: "#f0bd69",
  };
}

export function ForceCard({
  kind,
  data,
  compact = false,
}: {
  kind: ForceKind;
  data: ForcePoint[];
  compact?: boolean;
}) {
  const current = data[data.length - 1];
  const reading = readForce(current, kind);
  const DirectionIcon =
    reading.direction === "mint"
      ? ArrowUpRight
      : reading.direction === "redeem"
        ? ArrowDownRight
        : Minus;
  return (
    <article
      className={"force-card " + reading.direction + (compact ? " compact" : "")}
      title={reading.definition}
    >
      <div className="force-card-top">
        <div className="force-card-title">
          <Activity size={13} strokeWidth={1.8} />
          <h3>{reading.title}</h3>
        </div>
        <span className={"force-direction " + reading.direction}>
          <DirectionIcon size={12} />
          {reading.badge}
        </span>
      </div>
      <div className="force-card-reading">
        <strong>{reading.value}</strong>
        <span>{reading.detail}</span>
      </div>
      <ForceSparkline data={data} dataKey={reading.dataKey} color={reading.color} />
      <div className={"force-interpretation" + (compact ? " compact-read" : "")}>
        <p><b>Mint</b> · {reading.mint.replace("Mint: ", "")}</p>
        <p><b>Redeem</b> · {reading.redeem.replace("Redeem: ", "")}</p>
      </div>
    </article>
  );
}
