import { createDataProvider } from "@/lib/data-provider";
import { getMockSnapshot } from "@/lib/mock-data";
import type { DashboardSnapshot } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await createDataProvider().getSnapshot();
    return Response.json(snapshot, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    const snapshot: DashboardSnapshot = getMockSnapshot();
    const timestamp = new Date().toISOString();
    snapshot.sources.supply = {
      status: "stale",
      name: "DeFiLlama unavailable",
      updatedAt: timestamp,
      note: "Showing the deterministic demo supply path because the live source did not respond.",
    };
    return Response.json(snapshot, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  }
}
