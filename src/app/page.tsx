import DashboardWorkspace from "@/components/dashboard-workspace";
import { getMockSnapshot } from "@/lib/mock-data";
import type { RangeKey } from "@/lib/view-state";

const ranges: RangeKey[] = ["24h", "7d", "30d", "90d", "1y", "all"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; scale?: string }>;
}) {
  const query = await searchParams;
  const range = ranges.includes(query.range as RangeKey)
    ? (query.range as RangeKey)
    : "90d";

  return (
    <DashboardWorkspace
      section="overview"
      initialData={getMockSnapshot()}
      initialRange={range}
      initialLogScale={query.scale === "log"}
    />
  );
}
