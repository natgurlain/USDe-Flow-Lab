import { redirect } from "next/navigation";
import { parseRange } from "@/lib/metrics";
import type { PageQuery } from "@/components/dashboard-page";
export default async function Page({ searchParams }: PageQuery) {
  const query = await searchParams;
  const range = parseRange(query.range);
  redirect("/flow" + (range === "90d" ? "" : "?range=" + range));
}
