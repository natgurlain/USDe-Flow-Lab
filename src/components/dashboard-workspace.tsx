"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDashboardSession } from "./dashboard-shell";
import { DashboardView } from "./dashboard-view";
import {
  parseRange,
  retainVerified,
  withFreshness,
  type RangeKey,
} from "@/lib/metrics";
import type { DashboardSnapshot } from "@/lib/types";
import type { Section } from "./dashboard-view";
export type { Section } from "./dashboard-view";
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
    composition: snapshot.composition
      ? {
          ...snapshot.composition,
          status: withFreshness({
            ...snapshot.metrics.backing,
            value: 1,
            status: snapshot.composition.status,
            observedAt: snapshot.composition.observedAt,
            maxAgeHours: 24,
          }).status,
        }
      : undefined,
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
  const {
    snapshot,
    publish,
    setRange: publishRange,
    setRefreshing: publishRefreshing,
    registerRefresh,
  } = useDashboardSession();
  const [data, setData] = useState(() => retainVerified(initialData, snapshot));
  const [range, setRange] = useState(initialRange);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const pending = useRef(false);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (section === "learn" || pending.current) return;
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
        !["realized7d", "realized30d", "cooldown", "vaultAssets"].every(
          (key) => key in snapshot.metrics,
        ) ||
        !Array.isArray(snapshot.supplyHistory)
      )
        throw new Error("Invalid dashboard response");
      setData((previous) => ageSnapshot(retainVerified(snapshot, previous)));
      setNotice(
        snapshot.providerFailures?.length
          ? `Checked available sources. ${snapshot.providerFailures.length} source integrations could not update; retained readings keep their original dates.`
          : "",
      );
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
  }, [section]);
  useEffect(() => {
    if (section === "learn") return;
    const onReturn = () => {
      setData((previous) => ageSnapshot(previous));
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    const ageTimer = window.setInterval(
      () => setData((previous) => ageSnapshot(previous)),
      60_000,
    );
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
      window.clearInterval(ageTimer);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("popstate", onPop);
      request.current?.abort();
      request.current = null;
    };
  }, [refresh, section]);
  function changeRange(next: RangeKey) {
    setRange(next);
    const url = new URL(window.location.href);
    if (next === "90d") url.searchParams.delete("range");
    else url.searchParams.set("range", next);
    window.history.pushState(null, "", url);
  }
  const available = Object.values(data.metrics).filter(
    (metric) => metric.value !== null,
  ).length;
  useEffect(() => {
    if (section !== "learn") publish(data);
  }, [data, section, publish]);
  useEffect(() => {
    publishRange(range);
  }, [range, publishRange]);
  useEffect(() => {
    publishRefreshing(refreshing);
  }, [refreshing, publishRefreshing]);
  useEffect(() => {
    registerRefresh(section === "learn" ? null : refresh);
    return () => {
      registerRefresh(null);
      publishRefreshing(false);
    };
  }, [refresh, section, registerRefresh, publishRefreshing]);
  return (
    <>
      {data.mode === "demo" && (
        <div className="notice demo-banner" role="status">
          <b>Demo mode · synthetic values.</b> This is an illustrative dataset,
          not an observation of Ethena.
        </div>
      )}
      {section !== "learn" && available === 0 && data.mode === "production" && (
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
      <DashboardView
        section={section}
        data={data}
        range={range}
        onRangeChange={changeRange}
      />
    </>
  );
}
