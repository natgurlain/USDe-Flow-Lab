"use client";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
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
import type { DashboardSnapshot } from "@/lib/types";
import type { RangeKey } from "@/lib/metrics";
import { sectionForPath, type Section } from "./dashboard-view";
type Session = {
  snapshot: DashboardSnapshot | null;
  publish: (data: DashboardSnapshot) => void;
  range: RangeKey;
  setRange: (range: RangeKey) => void;
  setRefreshing: (value: boolean) => void;
  registerRefresh: (callback: (() => Promise<void>) | null) => void;
};
const Context = createContext<Session | null>(null);
export function useDashboardSession() {
  const session = useContext(Context);
  if (!session) throw new Error("Dashboard session is missing");
  return session;
}
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
export default function DashboardShell({ children }: { children: ReactNode }) {
  const section: Section = sectionForPath(usePathname());
  const [snapshot, publish] = useState<DashboardSnapshot | null>(null);
  const [range, setRange] = useState<RangeKey>("90d");
  const [refreshing, setRefreshing] = useState(false);
  const [refresh, setRefresh] = useState<(() => Promise<void>) | null>(null);
  const registerRefresh = useCallback(
    (callback: (() => Promise<void>) | null) => setRefresh(() => callback),
    [],
  );
  const viewQuery = range === "90d" ? "" : "?range=" + range;
  const title =
    navigation.find((item) => item.section === section)?.label ??
    "Sources & methods";
  const data = snapshot ?? { mode: "production" };
  return (
    <Context.Provider
      value={{
        snapshot,
        publish,
        range,
        setRange,
        setRefreshing,
        registerRefresh,
      }}
    >
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
                {section === "learn"
                  ? "Learning guide"
                  : data.mode === "demo"
                    ? "Demo data"
                    : "Public data"}
              </span>
              <button
                type="button"
                className="refresh-button"
                onClick={() => refresh?.()}
                disabled={refreshing || section === "learn" || !refresh}
                aria-label="Refresh dashboard data"
              >
                <RefreshCw size={15} className={refreshing ? "spinning" : ""} />
                <span>{refreshing ? "Updating…" : "Refresh"}</span>
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
            {children}
          </main>

          <footer className="site-footer">
            <div>
              <b>ethena explained</b>
              <span>Understand first. Explore further.</span>
            </div>
            <p>
              Independent dashboard · Not affiliated with Ethena ·
              Informational, not financial advice.
            </p>
            <Link href={"/sources" + viewQuery}>Sources & methods ↗</Link>
          </footer>
        </div>
      </div>
    </Context.Provider>
  );
}
