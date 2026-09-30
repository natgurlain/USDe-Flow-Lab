import { connection } from "next/server";
import DashboardWorkspace, { type Section } from "./dashboard-workspace";
import { emptySnapshot, getInitialDashboardData } from "@/lib/data-provider";
import { parseRange } from "@/lib/metrics";
export type PageQuery = { searchParams: Promise<{ range?: string }> };
export async function DashboardPage({
  section,
  searchParams,
}: PageQuery & { section: Section }) {
  const educational = section === "learn";
  if (!educational) await connection();
  const [query, data] = await Promise.all([
    educational ? Promise.resolve({ range: undefined }) : searchParams,
    educational
      ? Promise.resolve(emptySnapshot("1970-01-01T00:00:00.000Z"))
      : getInitialDashboardData(),
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
