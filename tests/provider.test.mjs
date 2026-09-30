import test from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "./helpers.mjs";
const p = loadModule("data-provider");
const date = (day) => Date.parse(day + "T00:00:00Z") / 1000;
const token = (day, amount) => ({
  date: date(day),
  circulating: { peggedUSD: amount },
});
const supply = {
  id: "146",
  symbol: "USDe",
  address: p.USDE_CONTRACT,
  tokens: [token("2026-01-01", 100), token("2026-01-08", 120)],
  chainBalances: {
    Ethereum: { tokens: [token("2026-01-08", 80)] },
    OldChain: { tokens: [token("2026-01-01", 50)] },
  },
};

test("global supply avoids double-counting chain balances; chain dates must align", () => {
  const result = p.parseSupply(supply);
  assert.equal(result.points.at(-1).value, 120);
  assert.equal(result.chains.length, 1);
  assert.equal(result.chains[0].supply, 80);
  assert.throws(() => p.parseSupply({ ...supply, address: "wrong" }));
});
test("unreliable prices and empty histories are rejected", () => {
  assert.throws(() =>
    p.parsePrice(
      {
        coins: {
          key: { price: 1, timestamp: date("2026-01-01"), confidence: 0.1 },
        },
      },
      "key",
    ),
  );
  assert.throws(() => p.parseYieldHistory({ data: [] }));
  assert.throws(() =>
    p.parsePriceHistory([{ date: date("2026-01-01"), prices: { other: 1 } }]),
  );
  const values = p.parseYieldHistory({
    data: [
      { timestamp: "2026-01-01T00:00:00Z", apy: 5 },
      { timestamp: "2026-01-02T00:00:00Z", apy: null },
    ],
  });
  assert.equal(values.length, 1);
  assert.equal(values[0].value, 5);
});
test("one failed provider does not erase independent observations", async () => {
  const snapshot = await p.getProviderSnapshot(async (url) => {
    if (url === p.SOURCES.supply) return supply;
    if (url === p.SOURCES.yield)
      return { data: [{ timestamp: "2026-01-08T12:00:00Z", apy: 5 }] };
    throw new Error("Provider offline");
  });
  assert.equal(snapshot.mode, "production");
  assert.equal(snapshot.metrics.supply.value, 120);
  assert.equal(snapshot.metrics.supplyChange7d.value, 20);
  assert.equal(snapshot.metrics.yield.value, 5);
  assert.equal(snapshot.metrics.price.value, null);
  assert.equal(snapshot.metrics.backing.value, null);
  assert.equal(snapshot.metrics.minted.value, null);
});
test("total source outage produces no fabricated production observations", async () => {
  const snapshot = await p.getProviderSnapshot(async () => {
    throw new Error("offline");
  });
  assert.equal(snapshot.mode, "production");
  assert.ok(
    Object.values(snapshot.metrics).every(
      (metric) => metric.value === null && metric.status === "unavailable",
    ),
  );
  assert.equal(snapshot.supplyHistory.length, 0);
});
test("synthetic values are available only in explicit demo mode", async () => {
  const demoProvider = loadModule("data-provider", {
    process: { env: { USDE_DATA_PROVIDER: "mock" } },
  });
  const data = await demoProvider.getProviderSnapshot(async () => {
    throw new Error("Must not request a live source");
  });
  assert.equal(data.mode, "demo");
  assert.equal(data.metrics.supply.status, "demo");
  assert.ok(data.metrics.supply.value > 0);
});

test("issuer backing report preserves reporting time and reserve denominator", () => {
  const report = p.parseBacking({
    timestamp: "2026-01-01T12:00:00Z",
    totalBackingAssetsInUsd: 100,
    totalReserveFundInUsd: 2,
    totalTokenSupplyInUsd: 100,
  });
  assert.equal(((report.assets + report.reserve) / report.supply) * 100, 102);
  assert.equal(report.observedAt, "2026-01-01T12:00:00.000Z");
  assert.throws(() =>
    p.parseBacking({
      timestamp: "2026-01-01",
      totalBackingAssetsInUsd: 100,
      totalReserveFundInUsd: 2,
      totalTokenSupplyInUsd: 0,
    }),
  );
});
test("category shares require a common timestamp rather than mixing latest values", () => {
  const r = p.parseComposition({
    breakdown: {
      A: [
        { timestamp: date("2026-01-01"), value: 60 },
        { timestamp: date("2026-01-02"), value: 99 },
      ],
      B: [{ timestamp: date("2026-01-01"), value: 40 }],
    },
  });
  assert.equal(r.observedAt, "2026-01-01T00:00:00.000Z");
  assert.equal(r.items[0].value, 60);
  assert.throws(() =>
    p.parseComposition({
      breakdown: {
        A: [{ timestamp: date("2026-01-01"), value: 60 }],
        B: [{ timestamp: date("2026-01-02"), value: 40 }],
      },
    }),
  );
});
test("provider failures have sanitized names and never leak errors or credentials", async () => {
  const logs = [];
  const provider = loadModule("data-provider", {
    console: { warn: (s) => logs.push(s) },
  });
  const result = await provider.getProviderSnapshot(async () => {
    throw new Error("secret-rpc-key");
  });
  assert.ok(result.providerFailures.includes("backing"));
  assert.ok(logs.length > 0);
  assert.ok(logs.every((s) => !s.includes("secret-rpc-key")));
});
