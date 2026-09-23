CREATE TABLE IF NOT EXISTS dashboard_daily (
  day date PRIMARY KEY,
  supply_usd double precision NOT NULL,
  minted_usde double precision,
  redeemed_usde double precision,
  net_usde double precision,
  susde_apy double precision,
  tbill_apy double precision,
  eth_funding_7d double precision,
  loop_spread_bps double precision,
  peg_bps double precision,
  force_score double precision,
  supply_source text NOT NULL,
  flow_source text,
  force_source text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
