import test from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "./helpers.mjs";
const metrics = loadModule("metrics");
const provider = loadModule("data-provider");
const point = (date, value) => ({ date, value });

test("calendar ranges include actual dates, not N observations", () => {
  const points = [
    point("2026-01-01", 10),
    point("2026-01-20", 15),
    point("2026-01-30", 20),
    point("2026-01-31", 21),
  ];
  assert.equal(metrics.sliceByRange(points, "7d").length, 2);
  assert.equal(metrics.sliceByRange(points, "24h").length, 2);
  assert.equal(metrics.sliceByRange(points, "all").length, 4);
  assert.equal(metrics.parseRange("invalid"), "90d");
});
test("supply comparisons require exact baseline dates and handle UTC leap days", () => {
  const points = [
    point("2024-02-22", 100),
    point("2024-02-28", 110),
    point("2024-02-29", 120),
  ];
  assert.equal(metrics.supplyDelta(points, 7), 20);
  assert.equal(metrics.supplyDelta(points, 1), 10);
  assert.equal(metrics.supplyDelta(points, 30), null);
  assert.equal(metrics.supplyDelta([], 7), null);
});
test("daily differences exclude multi-day gaps", () => {
  const changes = metrics.dailyChanges([
    point("2026-01-01", 10),
    point("2026-01-03", 30),
    point("2026-01-04", 25),
  ]);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].value, -5);
});
test("peg percentages and compounded illustrations have correct units", () => {
  assert.ok(Math.abs(metrics.pegDifference(0.99) + 1) < 1e-10);
  assert.equal(metrics.pegDifference(null), null);
  assert.ok(Math.abs(metrics.illustrateYield(1000, 5, 365) - 50) < 1e-10);
  assert.equal(metrics.illustrateYield(1000, 5, 0), 0);
  assert.equal(metrics.illustrateYield(-1, 5, 365), null);
  assert.equal(metrics.illustrateYield(1000, NaN, 365), null);
});
test("freshness uses observation time, not fetch time", () => {
  const now = Date.parse("2026-01-04T00:00:00Z");
  const metric = {
    ...provider.emptySnapshot().metrics.supply,
    value: 100,
    status: "current",
    observedAt: "2026-01-01T00:00:00Z",
    fetchedAt: new Date(now).toISOString(),
  };
  assert.equal(metrics.withFreshness(metric, now).status, "stale");
  assert.equal(
    metrics.withFreshness(
      { ...metric, observedAt: "2026-01-03T00:00:00Z" },
      now,
    ).status,
    "current",
  );
  assert.equal(
    metrics.withFreshness(
      { ...metric, observedAt: "2026-01-05T00:00:00Z" },
      now,
    ).status,
    "stale",
  );
});
test("outages retain verified values and original provenance, never demo data", () => {
  const previous = provider.emptySnapshot();
  previous.metrics.price = {
    ...previous.metrics.price,
    value: 0.999,
    status: "current",
    observedAt: "2026-01-01T12:00:00Z",
  };
  previous.metrics.supply = {
    ...previous.metrics.supply,
    value: 120,
    status: "current",
    observedAt: "2026-01-08T00:00:00Z",
  };
  previous.supplyHistory = [point("2026-01-01", 100), point("2026-01-08", 120)];
  const retained = metrics.retainVerified(provider.emptySnapshot(), previous);
  assert.equal(retained.metrics.price.value, 0.999);
  assert.equal(retained.metrics.price.observedAt, "2026-01-01T12:00:00Z");
  assert.equal(retained.metrics.price.status, "stale");
  assert.equal(retained.metrics.supplyChange7d.value, 20);
  assert.equal(retained.metrics.supplyChange7d.status, "stale");
  const demo = { ...previous, mode: "demo" };
  assert.equal(
    metrics.retainVerified(provider.emptySnapshot(), demo).metrics.price.value,
    null,
  );
});

test("retention cannot regress to an older verified observation", () => {
  const previous = provider.emptySnapshot();
  previous.metrics.price = {
    ...previous.metrics.price,
    value: 1.001,
    status: "current",
    observedAt: "2026-01-02T12:00:00Z",
  };
  const next = provider.emptySnapshot();
  next.metrics.price = {
    ...next.metrics.price,
    value: 0.998,
    status: "current",
    observedAt: "2026-01-01T12:00:00Z",
  };
  const retained = metrics.retainVerified(next, previous);
  assert.equal(retained.metrics.price.value, 1.001);
  assert.equal(
    retained.metrics.price.observedAt,
    previous.metrics.price.observedAt,
  );
});
test("retained supply without a seven-day baseline keeps change unavailable", () => {
  const previous = provider.emptySnapshot();
  previous.metrics.supply = {
    ...previous.metrics.supply,
    value: 100,
    status: "current",
    observedAt: "2026-01-08T00:00:00Z",
  };
  previous.supplyHistory = [point("2026-01-08", 100)];
  const retained = metrics.retainVerified(provider.emptySnapshot(), previous);
  assert.equal(retained.metrics.supplyChange7d.value, null);
  assert.equal(retained.metrics.supplyChange7d.status, "unavailable");
});
