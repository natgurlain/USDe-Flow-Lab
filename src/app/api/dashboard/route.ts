import { getInitialDashboardData } from "@/lib/data-provider";
export const runtime = "nodejs";
export async function GET() {
  const snapshot = await getInitialDashboardData();
  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
