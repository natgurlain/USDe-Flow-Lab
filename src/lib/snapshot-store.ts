import postgres from "postgres";
import type { DashboardSnapshot } from "@/lib/types";

export async function persistDailySnapshot(snapshot: DashboardSnapshot) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return false;

  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false,
  });

  try {
    const supply = snapshot.supplyPoints[snapshot.supplyPoints.length - 1];
    const flow = snapshot.flows[snapshot.flows.length - 1];
    const force = snapshot.forces[snapshot.forces.length - 1];
    const liveFlow = snapshot.sources.flows.status === "live";
    const liveForces = snapshot.sources.forces.status === "live";

    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS dashboard_daily (" +
        "day date PRIMARY KEY, " +
        "supply_usd double precision NOT NULL, " +
        "minted_usde double precision, redeemed_usde double precision, net_usde double precision, " +
        "susde_apy double precision, tbill_apy double precision, eth_funding_7d double precision, " +
        "loop_spread_bps double precision, peg_bps double precision, force_score double precision, " +
        "supply_source text NOT NULL, flow_source text, force_source text, " +
        "updated_at timestamptz NOT NULL DEFAULT now())",
    );
    await sql.unsafe(
      "INSERT INTO dashboard_daily (" +
        "day, supply_usd, minted_usde, redeemed_usde, net_usde, susde_apy, tbill_apy, " +
        "eth_funding_7d, loop_spread_bps, peg_bps, force_score, supply_source, flow_source, " +
        "force_source, updated_at) " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now()) " +
        "ON CONFLICT (day) DO UPDATE SET " +
        "supply_usd = EXCLUDED.supply_usd, minted_usde = EXCLUDED.minted_usde, " +
        "redeemed_usde = EXCLUDED.redeemed_usde, net_usde = EXCLUDED.net_usde, " +
        "susde_apy = EXCLUDED.susde_apy, tbill_apy = EXCLUDED.tbill_apy, " +
        "eth_funding_7d = EXCLUDED.eth_funding_7d, loop_spread_bps = EXCLUDED.loop_spread_bps, " +
        "peg_bps = EXCLUDED.peg_bps, force_score = EXCLUDED.force_score, " +
        "supply_source = EXCLUDED.supply_source, flow_source = EXCLUDED.flow_source, " +
        "force_source = EXCLUDED.force_source, updated_at = now()",
      [
        supply.date,
        supply.supply,
        liveFlow ? flow.minted : null,
        liveFlow ? flow.redeemed : null,
        liveFlow ? flow.net : null,
        liveForces ? force.susdeApy : null,
        liveForces ? force.tBill : null,
        liveForces ? force.ethFunding7d : null,
        liveForces ? force.loopSpread : null,
        liveForces ? force.pegBps : null,
        liveForces ? force.forceScore : null,
        snapshot.sources.supply.name,
        liveFlow ? snapshot.sources.flows.name : null,
        liveForces ? snapshot.sources.forces.name : null,
      ],
    );
    return true;
  } finally {
    await sql.end({ timeout: 5 });
  }
}
