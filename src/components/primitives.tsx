import type { ReactNode } from "react";
import { ArrowUpRight, Database } from "lucide-react";
import type { Metric } from "@/lib/types";

export function Panel({
  title,
  eyebrow,
  children,
  action,
  className = "",
  description,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  description?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {description && <p className="panel-description">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function observedLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        hour12: false,
      }).format(new Date(value)) + " UTC"
    : "No observation";
}
function readableSource(url: string) {
  if (url.includes("api.llama.fi/summary/fees/ethena-usde"))
    return "https://defillama.com/protocol/ethena-usde?fees=true";
  if (url.includes("stablecoins.llama.fi"))
    return "https://defillama.com/stablecoin/ethena-usde";
  if (url.includes("yields.llama.fi"))
    return "https://defillama.com/yields/pool/66985a81-9c51-46ca-9977-42b4fe7bc6df";
  if (url.includes("coins.llama.fi"))
    return url.includes("coingecko:ethena")
      ? "https://defillama.com/protocol/ethena"
      : "https://defillama.com/stablecoin/ethena-usde";
  return url;
}
export function SourceLine({
  metric,
  expanded = false,
}: {
  metric: Metric;
  expanded?: boolean;
}) {
  const status = {
    current: "Current",
    stale: "Delayed / last verified",
    unavailable: "Unavailable",
    demo: "Demo",
  }[metric.status];
  return (
    <div className="source-block">
      <div className="source-line">
        <span className={`data-status ${metric.status}`}>{status}</span>
        <a
          href={readableSource(metric.sourceUrl)}
          target="_blank"
          rel="noreferrer"
        >
          {metric.source}
          <ArrowUpRight size={12} />
        </a>
      </div>
      <p className="observation">
        {metric.observedAt
          ? metric.coverage.toLowerCase().includes("daily")
            ? "Daily observation · "
            : "Observed · "
          : ""}
        {observedLabel(metric.observedAt)}
      </p>
      {expanded && (
        <details className="method-details">
          <summary>Source & calculation</summary>
          <p>{metric.methodology}</p>
          <a href={metric.sourceUrl} target="_blank" rel="noreferrer">
            Inspect the underlying source ↗
          </a>
          <p>Coverage: {metric.coverage}</p>
          <p>
            Unit: {metric.unit}. Freshness window: {metric.maxAgeHours} hours.
          </p>
          <p>Fetched: {observedLabel(metric.fetchedAt)}</p>
        </details>
      )}
    </div>
  );
}
export function MetricCard({
  label,
  value,
  explanation,
  metric,
  detail,
}: {
  label: string;
  value: string;
  explanation: string;
  metric: Metric;
  detail?: string;
}) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <div className={`metric-value ${metric.value === null ? "missing" : ""}`}>
        {value}
      </div>
      {detail && <p className="metric-detail">{detail}</p>}
      <p className="metric-explanation">{explanation}</p>
      <SourceLine metric={metric} expanded />
    </article>
  );
}
export function Unavailable({
  title,
  children,
  href,
  label = "Open official source",
}: {
  title: string;
  children: ReactNode;
  href?: string;
  label?: string;
}) {
  return (
    <div className="unavailable">
      <Database size={22} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{children}</p>
      {href && (
        <a className="text-link" href={href} target="_blank" rel="noreferrer">
          {label}
          <ArrowUpRight size={14} />
        </a>
      )}
    </div>
  );
}
