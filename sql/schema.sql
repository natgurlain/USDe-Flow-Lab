-- Apply before enabling persistence. This preserves any legacy dashboard_daily table.
CREATE TABLE IF NOT EXISTS ethena_snapshots (
  day date PRIMARY KEY,
  snapshot jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (snapshot->>'mode' = 'production'),
  CHECK ((snapshot->>'version')::int = 2)
);
