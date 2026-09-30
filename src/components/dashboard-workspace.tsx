"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import OverviewView from "./overview-view";
import TapeView from "./tape-view";
import YieldView from "./yield-view";
import BackingView from "./backing-view";
import LearnView from "./learn-view";
import MethodologyView from "./methodology-view";
import {
  RANGE_OPTIONS,
  parseRange,
  retainVerified,
  withFreshness,
  type RangeKey,
} from "@/lib/metrics";
import type { DashboardSnapshot } from "@/lib/types";
export type Section =
  | "overview"
  | "flow"
  | "yield"
  | "backing"
  | "learn"
  | "sources";
const navigation = [
  { section: "overview", href: "/", label: "Overview", icon: LayoutDashboard },
  { section: "flow", href: "/flow", label: "USDe Flow", icon: ArrowLeftRight },
  { section: "yield", href: "/yield", label: "Yield", icon: TrendingUp },
  {
    section: "backing",
    href: "/backing",
    label: "Backing & Risks",
    icon: ShieldCheck,
  },
  { section: "learn", href: "/learn", label: "Learn", icon: BookOpen },
] as const;
function ageSnapshot(snapshot: DashboardSnapshot): DashboardSnapshot {
  return {
    ...snapshot,
    metrics: Object.fromEntries(
      Object.entries(snapshot.metrics).map(([key, metric]) => [
        key,
        withFreshness(metric),
      ]),
    ) as DashboardSnapshot["metrics"],
    priceHistoryMeta: withFreshness(snapshot.priceHistoryMeta),
  };
}
export default function DashboardWorkspace({
  section,
  initialData,
  initialRange = "90d",
}: {
  section: Section;
  initialData: DashboardSnapshot;
  initialRange?: RangeKey;
}) {
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState(initialRange);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const pending = useRef(false);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setRefreshing(true);
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Refresh unavailable");
      const snapshot = (await response.json()) as DashboardSnapshot;
      if (
        snapshot.version !== 2 ||
        !snapshot.metrics ||
        !Array.isArray(snapshot.supplyHistory)
      )
        throw new Error("Invalid dashboard response");
      setData((previous) => ageSnapshot(retainVerified(snapshot, previous)));
      setNotice("Data checked. Observation dates are shown with each metric.");
    } catch {
      if (!controller.signal.aborted || request.current === controller) {
        setData((previous) => ({
          ...previous,
          metrics: Object.fromEntries(
            Object.entries(previous.metrics).map(([key, metric]) => [
              key,
              metric.value !== null && metric.status !== "demo"
                ? { ...metric, status: "stale" }
                : metric,
            ]),
          ) as DashboardSnapshot["metrics"],
          priceHistoryMeta:
            previous.priceHistoryMeta.value !== null && previous.mode !== "demo"
              ? { ...previous.priceHistoryMeta, status: "stale" }
              : previous.priceHistoryMeta,
        }));
        setNotice(
          "Refresh unavailable. Any retained readings keep their original observation dates.",
        );
      }
    } finally {
      window.clearTimeout(timeout);
      pending.current = false;
      if (request.current === controller) {
        setRefreshing(false);
        request.current = null;
      }
    }
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 300_000);
    const onPop = () =>
      setRange(
        parseRange(
          new URL(window.location.href).searchParams.get("range") ?? undefined,
        ),
      );
    window.addEventListener("popstate", onPop);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("popstate", onPop);
      request.current?.abort();
      request.current = null;
    };
  }, [refresh]);
  function changeRange(next: RangeKey) {
    setRange(next);
    const url = new URL(window.location.href);
    if (next === "90d") url.searchParams.delete("range");
    else url.searchParams.set("range", next);
    window.history.pushState(null, "", url);
  }
  const viewQuery = range === "90d" ? "" : "?range=" + range;
  const title =
    navigation.find((item) => item.section === section)?.label ??
    "Sources & methods";
  const isChartPage = ["overview", "flow", "yield"].includes(section);
  const available = Object.values(data.metrics).filter(
    (metric) => metric.value !== null,
  ).length;
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="desktop-sidebar">
        <Link className="brand" href="/">
          <span className="brand-symbol" aria-hidden="true">
            e≋
          </span>
          <span>
            <b>ethena</b>
            <small>EXPLAINED</small>
          </span>
        </Link>
        <p className="sidebar-label">YOUR GUIDE TO ETHENA</p>
        <nav aria-label="Main navigation" className="primary-nav">
          {navigation.map(({ section: id, href, label, icon: Icon }) => (
            <Link
              key={id}
              href={href + viewQuery}
              className={`nav-link ${section === id ? "active" : ""}`}
              aria-current={section === id ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
              {section === id && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <ChartNoAxesCombined size={22} strokeWidth={1.5} />
            <h3>Clarity before complexity.</h3>
            <p>
              Understand the dollars.
              <br />
              Follow the data.
              <br />
              Know the limits.
            </p>
          </div>
          <Link
            className={`nav-link ${section === "sources" ? "active" : ""}`}
            href={"/sources" + viewQuery}
            aria-current={section === "sources" ? "page" : undefined}
          >
            <BookOpen size={17} />
            Sources & methods
          </Link>
          <a
            className="official-link"
            href="https://app.ethena.fi/"
            target="_blank"
            rel="noreferrer"
          >
            Official Ethena app <ArrowUpRight size={15} />
          </a>
          <small className="independent-label">
            Independent. Not affiliated with Ethena.
          </small>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <Link href="/" className="mobile-brand">
            <span className="brand-symbol">e≋</span>
            <b>
              ethena <small>EXPLAINED</small>
            </b>
          </Link>
          <div className="breadcrumb">
            Dashboard <span>/</span>
            <b>{title}</b>
          </div>
          <div className="topbar-status">
            <span
              className={`public-status ${data.mode === "demo" ? "demo" : ""}`}
            >
              <i />
              {data.mode === "demo" ? "Demo data" : "Public data"}
            </span>
            <button
              type="button"
              className="refresh-button"
              onClick={() => void refresh()}
              disabled={refreshing}
              aria-label="Refresh dashboard data"
            >
              <RefreshCw size={15} className={refreshing ? "spinning" : ""} />
              <span>{refreshing ? "Checking…" : "Refresh"}</span>
            </button>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigation.map((item) => (
            <Link
              href={item.href + viewQuery}
              key={item.section}
              className={section === item.section ? "active" : ""}
              aria-current={section === item.section ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {data.mode === "demo" && (
            <div className="notice demo-banner" role="status">
              <b>Demo mode · synthetic values.</b> This is an illustrative
              dataset, not an observation of Ethena.
            </div>
          )}
          {available === 0 && data.mode === "production" && (
            <div className="notice" role="status">
              Public providers are currently unavailable. The dashboard remains
              usable, and missing readings are clearly marked.
            </div>
          )}
          {notice && (
            <p className="refresh-notice" role="status">
              {notice}
            </p>
          )}
          {isChartPage && (
            <div className="range-toolbar">
              <span>
                Explore a period <small>ending at the latest observation</small>
              </span>
              <div role="group" aria-label="Chart time range">
                {RANGE_OPTIONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={range === item.key}
                    className={range === item.key ? "selected" : ""}
                    onClick={() => changeRange(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {section === "overview" && <OverviewView data={data} range={range} />}
          {section === "flow" && <TapeView data={data} range={range} />}
          {section === "yield" && <YieldView data={data} range={range} />}
          {section === "backing" && <BackingView data={data} />}
          {section === "learn" && <LearnView />}
          {section === "sources" && <MethodologyView data={data} />}
        </main>
        <footer className="site-footer">
          <div>
            <b>ethena explained</b>
            <span>Understand first. Explore further.</span>
          </div>
          <p>
            Independent dashboard · Not affiliated with Ethena · Informational,
            not financial advice.
          </p>
          <Link href={"/sources" + viewQuery}>Sources & methods ↗</Link>
        </footer>
      </div>
    </div>
  );
}
