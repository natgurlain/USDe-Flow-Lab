"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import EventsView from "@/components/events-view";
import ForcesView from "@/components/forces-view";
import MethodologyView from "@/components/methodology-view";
import OverviewView from "@/components/overview-view";
import TapeView from "@/components/tape-view";
import { DataBadge, FlowKpis } from "@/components/primitives";
import { formatMoney } from "@/lib/format";
import type { DashboardSnapshot } from "@/lib/types";
import type { RangeKey } from "@/lib/view-state";

type Section = "overview" | "tape" | "forces" | "events" | "methodology";

const navigation: Array<{ section: Section; href: string; label: string; icon: typeof Activity }> = [
  { section: "overview", href: "/", label: "Overview", icon: LayoutDashboard },
  { section: "tape", href: "/tape", label: "Tape", icon: ArrowLeftRight },
  { section: "forces", href: "/forces", label: "Forces", icon: SlidersHorizontal },
  { section: "events", href: "/events", label: "Events", icon: CalendarDays },
  { section: "methodology", href: "/methodology", label: "Methodology", icon: BookOpen },
];

const sectionTitles: Record<Section, string> = {
  overview: "Overview",
  tape: "Primary-market tape",
  forces: "Market forces",
  events: "Event context",
  methodology: "Sources & methodology",
};

export default function DashboardWorkspace({
  section,
  initialData,
  initialRange = "90d",
  initialLogScale = false,
}: {
  section: Section;
  initialData: DashboardSnapshot;
  initialRange?: RangeKey;
  initialLogScale?: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState<RangeKey>(initialRange);
  const [logScale, setLogScale] = useState(initialLogScale);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Dashboard source unavailable");
      const snapshot = (await response.json()) as DashboardSnapshot;
      setData(snapshot);
      setNotice("");
    } catch {
      setNotice("Live refresh unavailable · keeping the last visible snapshot");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const firstRefresh = window.setTimeout(() => void refresh(true), 0);
    const timer = window.setInterval(() => void refresh(true), 120_000);
    return () => {
      window.clearTimeout(firstRefresh);
      window.clearInterval(timer);
    };
  }, [refresh]);

  function changeRange(value: RangeKey) {
    setRange(value);
    const url = new URL(window.location.href);
    if (value === "90d") url.searchParams.delete("range");
    else url.searchParams.set("range", value);
    window.history.replaceState(null, "", url);
  }

  function changeScale(value: boolean) {
    setLogScale(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("scale", "log");
    else url.searchParams.delete("scale");
    window.history.replaceState(null, "", url);
  }

  const dataLabel =
    data.mode === "partial-live"
      ? "PARTIAL LIVE"
      : data.sources.supply.status === "stale"
        ? "STALE · DEMO FALLBACK"
        : "DEMO DATA";
  const viewQuery =
    (range !== "90d" ? "?range=" + range : "") +
    (logScale ? (range !== "90d" ? "&" : "?") + "scale=log" : "");
  const updated = data.updatedAt.slice(0, 16).replace("T", " ") + " UTC";
  const title =
    section === "overview" ? "USDe supply & market forces" : sectionTitles[section];

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark"><span /></span>
          <span><b>USDe</b><small>FLOW LAB</small></span>
        </Link>
        <div className="sidebar-divider" />
        <div className="sidebar-caption">ANALYSIS</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href + viewQuery}
                key={item.section}
                className={section === item.section ? "nav-link active" : "nav-link"}
                aria-current={section === item.section ? "page" : undefined}
              >
                <Icon size={16} strokeWidth={1.8} />
                <span>{item.label}</span>
                {section === item.section && <i />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="sidebar-note-icon"><Activity size={14} /></div>
          <div><b>Supply is the outcome</b><p>Flow is the mechanism. Market forces change the incentive.</p></div>
        </div>
        <div className="sidebar-source">
          <span>DATA MODE</span>
          <DataBadge
            status={data.sources.supply.status}
            label={dataLabel}
          />
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-title">
            <Link className="mobile-brand" href="/">
              <span className="brand-mark"><span /></span><b>USDe <em>FLOW LAB</em></b>
            </Link>
            <div className="breadcrumb"><span>USDE FLOW LAB</span><b>/</b>{title}</div>
          </div>
          <div className="topbar-status">
            <DataBadge status={data.sources.supply.status} label={dataLabel} />
            <span className="updated-label">Updated {updated}</span>
            <button
              className={"refresh-button" + (refreshing ? " refreshing" : "")}
              onClick={() => void refresh()}
              type="button"
              aria-label="Refresh dashboard data"
              title="Refresh dashboard data"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <nav className="mobile-nav scrollbar-none" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href + viewQuery}
                key={item.section}
                className={section === item.section ? "mobile-nav-link active" : "mobile-nav-link"}
                aria-current={section === item.section ? "page" : undefined}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="main-content">
          {notice && <div className="stale-notice" role="status">{notice}</div>}
          <FlowKpis data={data} />

          {section === "overview" && (
            <OverviewView
              data={data}
              range={range}
              onRangeChange={changeRange}
              logScale={logScale}
              onLogScaleChange={changeScale}
            />
          )}
          {section === "tape" && <TapeView data={data} range={range} onRangeChange={changeRange} />}
          {section === "forces" && <ForcesView data={data} range={range} onRangeChange={changeRange} />}
          {section === "events" && <EventsView data={data} />}
          {section === "methodology" && <MethodologyView data={data} />}
        </main>

        <footer className="site-footer">
          <div><span className="footer-brand">USDe FLOW LAB</span><span>Independent data workspace</span></div>
          <p>
            Not affiliated with Ethena. Not financial advice. Primary-market mint / redeem is
            restricted to whitelisted counterparties; secondary volume is not supply.
          </p>
          <a href="https://etherscan.io/token/0x4c9edd5852cd905f086c759e8383e09bff1e68b3" target="_blank" rel="noreferrer">
            USDe contract <span>{formatMoney(data.currentSupply)} shown</span>
          </a>
        </footer>
      </div>
    </div>
  );
}
