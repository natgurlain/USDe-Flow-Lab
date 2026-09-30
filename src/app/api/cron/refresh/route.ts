import { getProviderSnapshot } from "@/lib/data-provider";
import { persistDailySnapshot, persistenceEnabled } from "@/lib/snapshot-store";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return Response.json({
      status: "disabled",
      reason: "CRON_SECRET is not configured.",
    });
  if (request.headers.get("authorization") !== "Bearer " + secret)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!persistenceEnabled())
    return Response.json({
      status: "disabled",
      reason: "Configure an isolated database and apply sql/schema.sql.",
    });
  try {
    const snapshot = await getProviderSnapshot();
    const stored = await persistDailySnapshot(snapshot);
    return Response.json({
      status: stored ? "stored" : "skipped",
      day: snapshot.fetchedAt.slice(0, 10),
    });
  } catch {
    return Response.json(
      {
        status: "error",
        message:
          "Snapshot storage failed. Check migration and database configuration.",
      },
      { status: 500 },
    );
  }
}
