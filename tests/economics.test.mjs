import test from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "./helpers.mjs";
const e = loadModule("economics");
const p = loadModule("data-provider");
const m = loadModule("metrics");
const a = loadModule("analytics");
const now = Date.parse("2026-01-10T12:00:00Z");
const ts = (date) => Date.parse(date) / 1000;
const payload = (samples) => ({
  id: "4133",
  name: "Ethena USDe",
  totalDataChart: samples,
});
const samples = Array.from({ length: 9 }, (_, i) => [
  ts(`2026-01-0${i + 1}`),
  i === 0 ? 0 : 100,
]);

test("economics validates the USDe identity, normalizes days and excludes the partial day", () => {
  const series = e.parseEconomics(
    payload([...samples, [ts("2026-01-10"), 999]]),
    now,
  );
  assert.equal(series.length, 9);
  assert.equal(series.at(-1).date, "2026-01-09");
  assert.equal(a.dailyWindow(series, 7).total, 700);
  assert.throws(() =>
    e.parseEconomics({ ...payload(samples), id: "parent#ethena" }, now),
  );
  assert.throws(() => e.parseEconomics(payload([[ts("2026-01-09"), -1]]), now));
  assert.throws(() => e.parseEconomics(payload([[ts("2026-01-11"), 1]]), now));
  assert.throws(() =>
    e.parseEconomics(payload([[ts("2026-01-09T12:00:00Z"), 1]]), now),
  );
});
test("identical duplicate days are deduplicated; conflicting daily values fail", () => {
  assert.equal(
    e.parseEconomics(payload([samples[0], samples[0]]), now).length,
    1,
  );
  assert.throws(() =>
    e.parseEconomics(payload([samples[0], [samples[0][0], 999]]), now),
  );
});
test("fee and revenue integrations fail independently and use distinct definitions", async () => {
  const data = await p.getProviderSnapshot(async (url) => {
    if (url === e.ECONOMIC_SOURCES.fees) return payload(samples);
    throw new Error("offline");
  });
  assert.equal(data.economics.fees.points.length, 9);
  assert.equal(data.economics.revenue, undefined);
  assert.ok(data.providerFailures.includes("revenue"));
  assert.equal(data.metrics.supply.value, null);
  assert.equal(data.mode, "production");
  assert.match(
    e.economicMetric("revenue").methodology,
    /not net Foundation revenue/,
  );
});
test("retained economics preserves old dates and never imports demo values", () => {
  const previous = p.emptySnapshot();
  previous.economics = {
    fees: {
      points: e.parseEconomics(payload(samples), now),
      metric: {
        ...e.economicMetric("fees"),
        value: 100,
        status: "current",
        observedAt: "2026-01-09T00:00:00.000Z",
      },
    },
  };
  const result = m.retainVerified(p.emptySnapshot(), previous);
  assert.equal(result.economics.fees.metric.status, "stale");
  assert.equal(
    result.economics.fees.metric.observedAt,
    previous.economics.fees.metric.observedAt,
  );
  assert.equal(result.economics.fees.points.length, 9);
  assert.equal(
    m.retainVerified(p.emptySnapshot(), { ...previous, mode: "demo" })
      .economics,
    undefined,
  );
  assert.equal(
    m.retainVerified(p.emptySnapshot(), p.emptySnapshot()).economics,
    undefined,
  );
});
