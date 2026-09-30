import { connection } from "next/server";
import DashboardWorkspace, { type Section } from "./dashboard-workspace";
import { getInitialDashboardData } from "@/lib/data-provider";
import { parseRange } from "@/lib/metrics";
export type PageQuery = { searchParams: Promise<{ range?: string }> };
export async function DashboardPage({
  section,
  searchParams,
}: PageQuery & { section: Section }) {
  await connection();
  const [query, data] = await Promise.all([
    searchParams,
    getInitialDashboardData(),
  ]);
  return (
    <DashboardWorkspace
      key={section}
      section={section}
      initialData={data}
      initialRange={parseRange(query.range)}
    />
  );
}
