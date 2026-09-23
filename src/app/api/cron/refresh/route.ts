import { createDataProvider } from "@/lib/data-provider";
import { persistDailySnapshot } from "@/lib/snapshot-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !process.env.DATABASE_URL) {
    return Response.json({
      status: "disabled",
      reason: "Set CRON_SECRET and DATABASE_URL to enable scheduled persistence.",
    });
  }
  if (request.headers.get("authorization") !== "Bearer " + secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await createDataProvider().getSnapshot();
    if (snapshot.sources.supply.status !== "live") {
      return Response.json(
        { status: "skipped", reason: "No live supply observation was available." },
        { status: 503 },
      );
    }
    const stored = await persistDailySnapshot(snapshot);
    return Response.json({
      status: stored ? "stored" : "skipped",
      day: snapshot.supplyPoints[snapshot.supplyPoints.length - 1].date,
      source: snapshot.sources.supply.name,
      note: "Non-live tape and force columns remain NULL in storage.",
    });
  } catch {
    return Response.json({ status: "error", message: "Snapshot refresh failed." }, { status: 500 });
  }
}
