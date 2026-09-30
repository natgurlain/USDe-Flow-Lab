import test from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "./helpers.mjs";
const chain = loadModule("onchain");
const word = (n) => BigInt(n).toString(16).padStart(64, "0");
const hex = (n) => "0x" + n.toString(16);
const endNumber = 2_000_000,
  endTime = Date.parse("2026-01-31T00:00:00Z");
const block = (n) => ({
  number: hex(n),
  hash: "0x" + word(n),
  timestamp: hex((endTime - (endNumber - n) * 12000) / 1000),
});
const log = (kind = chain.MINT_TOPIC) => ({
  address: chain.ISSUER,
  topics: [kind, ...Array(3).fill("0x" + word(1))],
  data: "0x" + word(1) + word(2) + word(3) + word(5n * 10n ** 18n),
  blockNumber: hex(endNumber - 1),
  blockHash: "0x" + word(123),
  transactionHash: "0x" + word(456),
  logIndex: "0x0",
  removed: false,
});
const rpc = async (method, params) => {
  if (method === "eth_chainId") return "0x1";
  if (method === "eth_getBlockByNumber")
    return block(
      params[0] === "finalized" ? endNumber : Number(BigInt(params[0])),
    );
  if (method === "eth_getLogs") return [log(), log()];
  if (method === "eth_call") {
    const [input, at] = params;
    if (input.data === "0x35269315") return "0x" + word(86400);
    if (input.data === "0x38d52e0f")
      return "0x" + word(BigInt("0x4c9edd5852cd905f086c759e8383e09bff1e68b3"));
    if (input.data === "0x18160ddd") return "0x" + word(1000n * 10n ** 18n);
    if (input.data === "0x01e1d114") return "0x" + word(500n * 10n ** 18n);
    const elapsed = endNumber - Number(BigInt(at));
    return "0x" + word(10n ** 18n - BigInt(elapsed) * 10000000000n);
  }
  throw new Error("Unexpected RPC");
};
test("realized annualization uses exchange rate and actual elapsed time", () => {
  assert.ok(Math.abs(chain.realizedApy(1, 1.05, 365 * 86400000) - 5) < 1e-10);
  assert.ok(chain.realizedApy(1, 0.99, 7 * 86400000) < 0);
  assert.throws(() => chain.realizedApy(0, 1, 100));
});
test("vault reads same-block underlying assets, supply and current cooldown", async () => {
  const r = await chain.getVaultCurrent(rpc);
  assert.equal(r.assets, 500);
  assert.equal(r.stakingShare, 50);
  assert.equal(r.cooldown, 86400);
  const returns = await chain.getVaultReturns(rpc);
  assert.equal(returns.results.length, 2);
  assert.ok(returns.results.every((x) => Number.isFinite(x.apy) && x.apy > 0));
});
test("event parsing deduplicates and excludes removed logs; rejects unrelated contracts", () => {
  const r = chain.parseFlows(
    [log(), log(), { ...log(), removed: true }],
    endNumber - 10,
    endNumber,
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].amount, 5);
  assert.throws(() =>
    chain.parseFlows(
      [{ ...log(), address: chain.VAULT }],
      endNumber - 10,
      endNumber,
    ),
  );
  assert.throws(() =>
    chain.parseFlows([{ ...log(), data: "0x0" }], endNumber - 10, endNumber),
  );
  assert.throws(() => chain.parseFlows([log()], endNumber, endNumber));
});
test("flow totals require complete finalized coverage and a stable anchor", async () => {
  const r = await chain.getPrimaryFlows(rpc);
  assert.equal(r.minted, 5);
  assert.equal(r.redeemed, 0);
  assert.equal(r.events.length, 1);
  let reads = 0;
  await assert.rejects(() =>
    chain.getPrimaryFlows(async (m, p) => {
      if (
        m === "eth_getBlockByNumber" &&
        p[0] === hex(endNumber) &&
        ++reads > 0
      )
        return { ...block(endNumber), hash: "0x" + word(999) };
      return rpc(m, p);
    }),
  );
  await assert.rejects(() =>
    chain.getPrimaryFlows(async (m, p) =>
      m === "eth_getLogs" ? Promise.reject(new Error("rate limit")) : rpc(m, p),
    ),
  );
});

test("RPC fallback handles rejected public readers without exposing messages", async () => {
  const calls = [];
  const adapter = loadModule("onchain", {
    fetch: async (url) => {
      calls.push(url);
      return url === "first"
        ? { ok: false }
        : { ok: true, json: async () => ({ result: "0x1" }) };
    },
  });
  assert.equal(
    await adapter.makeRpc(["first", "second"])("eth_chainId", []),
    "0x1",
  );
  assert.equal(calls.join(","), "first,second");
  const failed = loadModule("onchain", {
    fetch: async () => ({
      ok: true,
      json: async () => ({ error: { message: "private-key" } }),
    }),
  });
  await assert.rejects(
    () => failed.makeRpc("custom")("eth_chainId", []),
    (error) => error.message === "RPC read failed",
  );
});
