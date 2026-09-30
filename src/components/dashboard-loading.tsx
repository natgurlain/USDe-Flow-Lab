"use client";
import { usePathname } from "next/navigation";
import { useDashboardSession } from "./dashboard-shell";
import { DashboardView, sectionForPath } from "./dashboard-view";
import { DashboardSkeleton } from "./dashboard-skeleton";
export default function DashboardLoading() {
  const session = useDashboardSession();
  const section = sectionForPath(usePathname());
  return session.snapshot ? (
    <DashboardView
      section={section}
      data={session.snapshot}
      range={session.range}
      onRangeChange={session.setRange}
    />
  ) : (
    <DashboardSkeleton />
  );
}
