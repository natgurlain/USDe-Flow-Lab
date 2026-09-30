import postgres from "postgres";
import type { DashboardSnapshot } from "./types";

function connectionString() {
  // Preview never falls through to the production database.
  return process.env.VERCEL_ENV === "preview"
    ? process.env.PREVIEW_DATABASE_URL
    : process.env.DATABASE_URL;
}
export function persistenceEnabled() {
  return Boolean(connectionString());
}
export async function loadLatestSnapshot(): Promise<DashboardSnapshot | null> {
  const url = connectionString();
  if (!url) return null;
  const sql = postgres(url, {
    max: 1,
    connect_timeout: 3,
    idle_timeout: 5,
    prepare: false,
    connection: { statement_timeout: 3000 },
  });
  try {
    const rows =
      await sql`SELECT snapshot FROM ethena_snapshots ORDER BY day DESC LIMIT 1`;
    const value = rows[0]?.snapshot as DashboardSnapshot | undefined;
    if (
      !value ||
      value.version !== 2 ||
      value.mode !== "production" ||
      !value.metrics ||
      !Array.isArray(value.supplyHistory)
    )
      return null;
    return value;
  } catch {
    return null;
  } finally {
    await sql.end({ timeout: 1 });
  }
}
export async function persistDailySnapshot(snapshot: DashboardSnapshot) {
  const url = connectionString();
  if (!url || snapshot.mode !== "production") return false;
  // Never persist demo or retained stale data as new observations.
  if (
    !Object.values(snapshot.metrics).some(
      (metric) => metric.status === "current" && metric.value !== null,
    )
  )
    return false;
  const sql = postgres(url, {
    max: 1,
    connect_timeout: 5,
    idle_timeout: 5,
    prepare: false,
    connection: { statement_timeout: 5000 },
  });
  try {
    const day = snapshot.fetchedAt.slice(0, 10);
    await sql.begin(async (transaction) => {
      // Serialize cron runs so a slower partial run cannot erase newer values.
      await transaction`SELECT pg_advisory_xact_lock(hashtext('ethena_snapshots_refresh'))`;
      const rows =
        await transaction`SELECT snapshot FROM ethena_snapshots ORDER BY day DESC LIMIT 1`;
      const old = rows[0]?.snapshot as DashboardSnapshot | undefined;
      const { retainVerified } = await import("./metrics");
      const stored = retainVerified(snapshot, old ?? null);
      await transaction`INSERT INTO ethena_snapshots (day, snapshot) VALUES (${day}::date, ${transaction.json(JSON.parse(JSON.stringify(stored)))}) ON CONFLICT (day) DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = now()`;
    });
    return true;
  } finally {
    await sql.end({ timeout: 1 });
  }
}
