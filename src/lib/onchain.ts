import { DAY } from "./metrics";
export const VAULT = "0x9d39a5de30e57443bff2a8307a4256c8797a3497";
export const ISSUER = "0xe3490297a08d6fc8da46edb7b6142e4f461b62d3";
// Official minting ABI linked from docs.ethena.fi/api-documentation/overview.
export const MINT_TOPIC =
  "0x29ee92e51cda311463f5c9ef98c54824a4bebe45e689c37da35edc774585d437";
export const REDEEM_TOPIC =
  "0x0ea36c5b7b274f8fe58654fe884bb9307dec1899e0312f40ae10d9b3d100cc0c";
export type Rpc = (method: string, params: unknown[]) => Promise<unknown>;
export type Block = { number: string; hash: string; timestamp: number };
export type FlowEvent = {
  transactionHash: string;
  logIndex: number;
  blockNumber: number;
  kind: "mint" | "redeem";
  amount: number;
};
export function parseBlock(input: unknown): Block {
  const b = input as Record<string, unknown>;
  if (
    !b ||
    !/^0x[0-9a-f]+$/i.test(String(b.number)) ||
    !/^0x[0-9a-f]{64}$/i.test(String(b.hash)) ||
    !/^0x[0-9a-f]+$/i.test(String(b.timestamp))
  )
    throw new Error("Invalid block");
  const timestamp = Number(BigInt(String(b.timestamp))) * 1000;
  if (!Number.isFinite(timestamp) || timestamp > Date.now() + 300_000)
    throw new Error("Invalid block time");
  return { number: String(b.number), hash: String(b.hash), timestamp };
}
export function uint(input: unknown): bigint {
  if (typeof input !== "string" || !/^0x[0-9a-f]{64}$/i.test(input))
    throw new Error("Invalid contract uint");
  return BigInt(input);
}
export function units(value: bigint): number {
  const n = Number(value) / 1e18;
  if (!Number.isFinite(n) || n < 0) throw new Error("Invalid token amount");
  return n;
}
export function realizedApy(
  before: number,
  after: number,
  milliseconds: number,
): number {
  if (before <= 0 || after <= 0 || milliseconds <= 0)
    throw new Error("Invalid vault observations");
  const value =
    (Math.pow(after / before, (365 * DAY) / milliseconds) - 1) * 100;
  if (!Number.isFinite(value)) throw new Error("Invalid realized return");
  return value;
}
export function makeRpc(endpoint: string | string[]): Rpc {
  const endpoints = typeof endpoint === "string" ? [endpoint] : endpoint;
  const expiresAt = Date.now() + 18_000;
  return async (method, params) => {
    for (const url of endpoints) {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) throw new Error("RPC adapter time budget exhausted");
      try {
        const response = await fetch(url, {
          method: "POST",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            "user-agent": "EthenaDashboard/1.0",
          },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
          signal: AbortSignal.timeout(Math.min(8000, remaining)),
        });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.error || data.result === undefined || data.result === null)
          continue;
        return data.result;
      } catch {
        /* Try the next configured public reader within the shared budget. */
      }
    }
    // Provider messages and credential-bearing URLs never enter logs or responses.
    throw new Error("RPC read failed");
  };
}
export async function finalizedBlock(rpc: Rpc) {
  if ((await rpc("eth_chainId", [])) !== "0x1")
    throw new Error("Ethereum mainnet required");
  return parseBlock(await rpc("eth_getBlockByNumber", ["finalized", false]));
}
export async function blockAt(
  rpc: Rpc,
  end: Block,
  target: number,
): Promise<Block> {
  const n = Number(BigInt(end.number));
  // Limit historical work to a 31-day bracket; no deployment/genesis backfill.
  let low = Math.max(0, n - Math.ceil((end.timestamp - target) / 12) - 7200);
  let high = n;
  let best = parseBlock(
    await rpc("eth_getBlockByNumber", ["0x" + low.toString(16), false]),
  );
  if (best.timestamp > target)
    throw new Error("Historical block bracket unavailable");
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const block = parseBlock(
      await rpc("eth_getBlockByNumber", ["0x" + mid.toString(16), false]),
    );
    if (block.timestamp <= target) {
      best = block;
      low = mid + 1;
    } else high = mid - 1;
  }
  if (target - best.timestamp > 60_000)
    throw new Error("Historical observation too far from target");
  return best;
}
const SHARE_CALL =
  "0x07a2d13a" + (BigInt(10) ** BigInt(18)).toString(16).padStart(64, "0");
async function call(rpc: Rpc, data: string, block: Block) {
  return uint(await rpc("eth_call", [{ to: VAULT, data }, block.number]));
}
export async function getVaultCurrent(rpc: Rpc) {
  const block = await finalizedBlock(rpc);
  const [assets, cooldown, share, supply, asset] = await Promise.all([
    call(rpc, "0x01e1d114", block),
    call(rpc, "0x35269315", block),
    call(rpc, SHARE_CALL, block),
    rpc("eth_call", [
      { to: "0x4c9edd5852cd905f086c759e8383e09bff1e68b3", data: "0x18160ddd" },
      block.number,
    ]).then(uint),
    call(rpc, "0x38d52e0f", block),
  ]);
  if (
    asset !== BigInt("0x4c9edd5852cd905f086c759e8383e09bff1e68b3") ||
    supply === BigInt(0)
  )
    throw new Error("Unexpected vault asset");
  if (cooldown > BigInt(90) * BigInt(86400) || share === BigInt(0))
    throw new Error("Unexpected vault settings");
  return {
    observedAt: new Date(block.timestamp).toISOString(),
    assets: units(assets),
    stakingShare: (units(assets) / units(supply)) * 100,
    cooldown: Number(cooldown),
    share: units(share),
    block,
  };
}
export async function getVaultReturns(rpc: Rpc) {
  const end = await finalizedBlock(rpc);
  const share = units(await call(rpc, SHARE_CALL, end));
  const results = await Promise.all(
    [7, 30].map(async (days) => {
      const start = await blockAt(rpc, end, end.timestamp - days * DAY);
      const before = units(await call(rpc, SHARE_CALL, start));
      return {
        days,
        apy: realizedApy(before, share, end.timestamp - start.timestamp),
        start: new Date(start.timestamp).toISOString(),
      };
    }),
  );
  return { observedAt: new Date(end.timestamp).toISOString(), results };
}
export function parseFlows(
  input: unknown,
  from: number,
  to: number,
): FlowEvent[] {
  if (!Array.isArray(input)) throw new Error("Invalid event response");
  const unique = new Map<string, FlowEvent>();
  for (const log of input) {
    if (log.removed === true) continue;
    if (
      log.address?.toLowerCase() !== ISSUER ||
      !Array.isArray(log.topics) ||
      log.topics.length !== 4 ||
      ![MINT_TOPIC, REDEEM_TOPIC].includes(log.topics[0]) ||
      !log.topics.every(
        (topic: unknown) =>
          typeof topic === "string" && /^0x[0-9a-f]{64}$/i.test(topic),
      ) ||
      !/^0x[0-9a-f]{256}$/i.test(log.data) ||
      !/^0x[0-9a-f]{64}$/i.test(log.transactionHash) ||
      !/^0x[0-9a-f]{64}$/i.test(log.blockHash) ||
      !/^0x[0-9a-f]+$/i.test(log.blockNumber) ||
      !/^0x[0-9a-f]+$/i.test(log.logIndex)
    )
      throw new Error("Invalid issuer event");
    const blockNumber = Number(BigInt(log.blockNumber)),
      logIndex = Number(BigInt(log.logIndex));
    if (blockNumber < from || blockNumber > to)
      throw new Error("Event outside coverage");
    const amount = units(BigInt("0x" + log.data.slice(194, 258)));
    const event = {
      transactionHash: log.transactionHash.toLowerCase(),
      logIndex,
      blockNumber,
      kind:
        log.topics[0] === MINT_TOPIC ? ("mint" as const) : ("redeem" as const),
      amount,
    };
    const key = `${event.transactionHash}:${logIndex}`;
    if (
      unique.has(key) &&
      JSON.stringify(unique.get(key)) !== JSON.stringify(event)
    )
      throw new Error("Conflicting duplicate event");
    unique.set(key, event);
  }
  return [...unique.values()].sort(
    (a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex,
  );
}
export async function getPrimaryFlows(rpc: Rpc) {
  const end = await finalizedBlock(rpc);
  const start = await blockAt(rpc, end, end.timestamp - DAY);
  const from = Number(BigInt(start.number)) + 1,
    to = Number(BigInt(end.number));
  // The range must complete in full; no partial total is presented as complete.
  const raw = await rpc("eth_getLogs", [
    {
      address: ISSUER,
      fromBlock: "0x" + from.toString(16),
      toBlock: end.number,
      topics: [[MINT_TOPIC, REDEEM_TOPIC]],
    },
  ]);
  const events = parseFlows(raw, from, to);
  const check = parseBlock(
    await rpc("eth_getBlockByNumber", [end.number, false]),
  );
  if (check.hash !== end.hash) throw new Error("Finalized anchor changed");
  return {
    events,
    fromBlock: from,
    toBlock: to,
    start: new Date(start.timestamp).toISOString(),
    end: new Date(end.timestamp).toISOString(),
    minted: events
      .filter((e) => e.kind === "mint")
      .reduce((n, e) => n + e.amount, 0),
    redeemed: events
      .filter((e) => e.kind === "redeem")
      .reduce((n, e) => n + e.amount, 0),
  };
}
