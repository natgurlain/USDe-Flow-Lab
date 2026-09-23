import type {
  AssetVolumes,
  DashboardSnapshot,
  FlowPoint,
  ForcePoint,
  SupplyPoint,
} from "@/lib/types";

const DAY = 86_400_000;
const FIRST_DAY = Date.UTC(2024, 1, 19);
const ASSETS: Array<keyof AssetVolumes> = ["USDT", "USDC", "stETH", "other"];

function dateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

function interpolate(date: number, anchors: Array<[number, number]>) {
  if (date <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i += 1) {
    const [rightDate, rightValue] = anchors[i];
    const [leftDate, leftValue] = anchors[i - 1];
    if (date <= rightDate) {
      const progress = (date - leftDate) / (rightDate - leftDate);
      return leftValue + (rightValue - leftValue) * progress;
    }
  }
  return anchors[anchors.length - 1][1];
}

function supplyAt(date: number, index: number, anchors: Array<[number, number]>) {
  const anchor = anchors.find(([anchorDate]) => anchorDate === date);
  if (anchor) return anchor[1];
  const baseline = interpolate(date, anchors);
  const wobble =
    Math.sin(index * 0.051) * 38_000_000 +
    Math.sin(index * 0.19 + 1.4) * 12_000_000 +
    (seeded(index + 700) - 0.5) * 8_000_000;
  return Math.max(100_000_000, baseline + wobble);
}

function splitByAsset(total: number, seed: number): AssetVolumes {
  const weights = [0.37, 0.42, 0.12, 0.09].map(
    (weight, index) => weight + (seeded(seed + index) - 0.5) * 0.08,
  );
  const denominator = weights.reduce((sum, weight) => sum + weight, 0);
  const entries = weights.map((weight) => (total * weight) / denominator);
  return {
    USDT: entries[0],
    USDC: entries[1],
    stETH: entries[2],
    other: entries[3],
  };
}

function makeFlow(
  date: string,
  index: number,
  net: number,
  cumulativeNet: number,
): FlowPoint {
  const ordinaryGross = 17_000_000 + seeded(index + 12) * 36_000_000;
  const gross = Math.max(ordinaryGross, Math.abs(net) + 6_000_000);
  const minted = Math.max(0, (gross + net) / 2);
  const redeemed = Math.max(0, (gross - net) / 2);
  return {
    date,
    minted,
    redeemed,
    redeemedSigned: -redeemed,
    net: minted - redeemed,
    cumulativeNet,
    mintedByAsset: splitByAsset(minted, index + 1),
    redeemedByAsset: splitByAsset(redeemed, index + 2000),
  };
}

function forceBase(date: string, index: number): Omit<ForcePoint, "forceScore" | "next7dNet"> {
  const day = Date.parse(date);
  const octStress = day >= Date.UTC(2025, 9, 10) && day <= Date.UTC(2025, 10, 2);
  const aprilStress = day >= Date.UTC(2026, 3, 2) && day <= Date.UTC(2026, 3, 12);
  const year = (day - FIRST_DAY) / (365.25 * DAY);

  let susdeApy =
    year < 0.9
      ? 15.7 - year * 3.3
      : year < 1.55
        ? 12.7 + Math.sin(index / 17) * 1.4
        : 7.5 + Math.sin(index / 21) * 1.2;
  if (octStress) susdeApy = 5.1 + Math.sin(index) * 0.35;
  if (aprilStress) susdeApy = 4.6 + Math.sin(index / 3) * 0.3;
  if (day > Date.UTC(2026, 3, 12)) susdeApy += Math.min(1.2, (day - Date.UTC(2026, 3, 12)) / (130 * DAY));

  const tBill = Math.max(3.45, 5.24 - Math.max(0, year - 0.65) * 0.92);
  const ethFunding7d =
    (year < 0.8 ? 10.5 : 6.2) +
    Math.sin(index / 10) * 9.5 +
    Math.sin(index / 31) * 4.2 +
    (seeded(index + 600) - 0.5) * 4.5 -
    (octStress ? 21 : 0) -
    (aprilStress ? 13 : 0);
  const loopSpread =
    84 +
    Math.sin(index / 23) * 95 +
    Math.sin(index / 8) * 26 -
    (octStress ? 180 : 0) -
    (aprilStress ? 205 : 0) +
    (day > Date.UTC(2026, 3, 12) ? 35 : 0);
  const pegBps =
    Math.sin(index / 13) * 7 +
    Math.sin(index / 3.6) * 3 -
    (octStress ? 46 : 0) -
    (aprilStress ? 31 : 0);
  const mintFeeBps = 5 + (octStress ? 8 : 0) + (aprilStress ? 11 : 0);
  const redeemFeeBps = 5 + (octStress ? 24 : 0) + (aprilStress ? 28 : 0);
  const redemptionStress =
    redeemFeeBps + (octStress || aprilStress ? 26 : 0) + (loopSpread < 0 ? 12 : 0);

  return {
    date: dateKey(day),
    susdeApy,
    tBill,
    carrySpread: susdeApy - tBill,
    ethFunding7d,
    loopSpread,
    pegBps,
    mintFeeBps,
    redeemFeeBps,
    redemptionStress,
  };
}

function zScore(values: number[], index: number, window = 90) {
  const start = Math.max(0, index - window + 1);
  const sample = values.slice(start, index + 1);
  const mean = sample.reduce((sum, value) => sum + value, 0) / sample.length;
  const variance =
    sample.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sample.length;
  const deviation = Math.sqrt(variance);
  return deviation < 0.0001 ? 0 : (values[index] - mean) / deviation;
}

export function getMockSnapshot(): DashboardSnapshot {
  const today = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );
  const anchors: Array<[number, number]> = [
    [Date.UTC(2024, 1, 19), 420_000_000],
    [Date.UTC(2024, 6, 1), 3_600_000_000],
    [Date.UTC(2024, 11, 31), 5_700_000_000],
    [Date.UTC(2025, 3, 30), 7_900_000_000],
    [Date.UTC(2025, 8, 30), 13_900_000_000],
    [Date.UTC(2025, 9, 10), 14_800_000_000],
    [Date.UTC(2025, 9, 17), 11_900_000_000],
    [Date.UTC(2025, 10, 1), 8_900_000_000],
    [Date.UTC(2025, 11, 31), 5_650_000_000],
    [Date.UTC(2026, 2, 31), 5_620_000_000],
    [Date.UTC(2026, 3, 6), 3_900_000_000],
    [Date.UTC(2026, 4, 15), 4_060_000_000],
    [Date.UTC(2026, 8, 23), 4_900_000_000],
  ];
  if (today > anchors[anchors.length - 1][0]) {
    anchors.push([today, anchors[anchors.length - 1][1]]);
  }

  const dayCount = Math.floor((today - FIRST_DAY) / DAY) + 1;
  const supplies: SupplyPoint[] = Array.from({ length: dayCount }, (_, index) => {
    const timestamp = FIRST_DAY + index * DAY;
    const supply = supplyAt(timestamp, index, anchors);
    const stakingRatio = Math.min(
      0.39,
      Math.max(0.09, 0.17 + Math.sin(index / 90) * 0.025 + index / dayCount * 0.045),
    );
    return {
      date: dateKey(timestamp),
      supply,
      susdeSupply: supply * stakingRatio,
      stakingRatio,
    };
  });

  const flows: FlowPoint[] = supplies.map((point, index) => {
    const previousSupply = supplies[Math.max(0, index - 1)].supply;
    const net = index === 0 ? 0 : point.supply - previousSupply;
    return makeFlow(
      point.date,
      index,
      net,
      index === 0 ? 0 : supplies[index].supply - supplies[0].supply,
    );
  });

  const rawForces = supplies.map((point, index) => forceBase(point.date, index));
  const carry = rawForces.map((point) => point.carrySpread);
  const funding = rawForces.map((point) => point.ethFunding7d);
  const loop = rawForces.map((point) => point.loopSpread);
  const pegAfterFee = rawForces.map((point) => point.pegBps - point.mintFeeBps);
  const stress = rawForces.map((point) => point.redemptionStress);

  const forces: ForcePoint[] = rawForces.map((point, index) => {
    const next7d = flows.slice(index + 1, index + 8);
    return {
      ...point,
      forceScore:
        0.3 * zScore(carry, index) +
        0.25 * zScore(funding, index) +
        0.25 * zScore(loop, index) +
        0.15 * zScore(pegAfterFee, index) -
        0.05 * zScore(stress, index),
      next7dNet:
        next7d.length === 7
          ? next7d.reduce((sum, flow) => sum + flow.net, 0)
          : null,
    };
  });

  const latestDate = supplies[supplies.length - 1].date;
  const transactionAssets = ["USDC", "USDT", "USDC", "stETH", "USDT", "other"];
  const transactions = Array.from({ length: 42 }, (_, index) => {
    const daysAgo = Math.floor(seeded(index + 900) * 21);
    const side = (seeded(index + 1200) > 0.47 ? "mint" : "redeem") as "mint" | "redeem";
    const usde = (250_000 + seeded(index + 1600) * 15_000_000) * (side === "mint" ? 1 : 0.82);
    const asset = transactionAssets[Math.floor(seeded(index + 1900) * transactionAssets.length)];
    const timestamp =
      Date.parse(latestDate + "T12:00:00.000Z") -
      daysAgo * DAY -
      Math.floor(seeded(index + 2300) * 86_000_000);
    const accountSeed = Math.floor(seeded(index + 2700) * 0xffffff)
      .toString(16)
      .padStart(6, "0");
    return {
      ts: new Date(timestamp).toISOString(),
      side,
      usde,
      asset,
      assetUsd: usde * (0.9994 + seeded(index + 2800) * 0.0012),
      account: "0x" + accountSeed + "…" + index.toString(16).padStart(4, "0"),
      tx: null,
    };
  }).sort((a, b) => b.ts.localeCompare(a.ts));

  const recentFlows = flows.slice(-30);
  const collateralBreakdown = ASSETS.map((asset) => ({
    asset,
    minted: recentFlows.reduce((sum, flow) => sum + flow.mintedByAsset[asset], 0),
    redeemed: recentFlows.reduce((sum, flow) => sum + flow.redeemedByAsset[asset], 0),
  }));
  const recentGross = recentFlows.reduce((sum, flow) => sum + flow.minted + flow.redeemed, 0);
  const topMinters = [
    { account: "0x8e2a…9f10", share: 0.19 },
    { account: "0x41d9…3c71", share: 0.14 },
    { account: "0xf201…de03", share: 0.1 },
    { account: "0x77a0…1b6e", share: 0.08 },
    { account: "0xc329…67aa", share: 0.06 },
  ].map((minter) => ({ ...minter, flow: recentGross * minter.share }));

  return {
    mode: "simulated",
    updatedAt: new Date().toISOString(),
    currentSupply: supplies[supplies.length - 1].supply,
    supplyPoints: supplies,
    flows,
    forces,
    transactions,
    events: [
      {
        id: "oct-2025-dislocation",
        date: "2025-10-10",
        endDate: "2025-10-11",
        kind: "market",
        title: "Market liquidation / CEX dislocation",
        summary:
          "A market-wide liquidation window is labeled here as a possible source of redemption pressure. This event annotation is illustrative and needs source verification before analytical use.",
        verification: "source-required",
      },
      {
        id: "apr-2026-redemptions",
        date: "2026-04-02",
        endDate: "2026-04-08",
        kind: "redemption",
        title: "Post-rsETH redemption window / PT expiry",
        summary:
          "This window marks the second simulated supply drawdown and a possible PT expiry interaction. Timing and attribution are illustrative until matched to primary-source event data.",
        verification: "source-required",
      },
      {
        id: "pt-maturity-2025",
        date: "2025-12-25",
        kind: "maturity",
        title: "Pendle PT maturity window",
        summary:
          "A PT maturity can release or unwind leveraged USDe positions around expiry. This marker is a calendar placeholder and should be replaced with verified market-specific maturity dates.",
        verification: "illustrative",
      },
      {
        id: "pt-maturity-2026",
        date: "2026-06-25",
        kind: "maturity",
        title: "Pendle PT maturity window",
        summary:
          "Maturity dates can concentrate roll and redemption activity into a short period. This marker is illustrative and is not an assertion about a specific Pendle market.",
        verification: "illustrative",
      },
      {
        id: "fee-change-2026",
        date: "2026-07-15",
        kind: "fee",
        title: "Illustrative fee-schedule review",
        summary:
          "Mint and redeem fees alter the spread at which an arbitrage becomes worthwhile. The date is a mock annotation and does not represent a verified Ethena fee change.",
        verification: "illustrative",
      },
    ],
    collateralBreakdown,
    topMinters,
    chainBreakdown: [
      { chain: "Ethereum", supply: 3_286_000_000, share: 0.67 },
      { chain: "Plasma", supply: 931_000_000, share: 0.19 },
      { chain: "Solana", supply: 392_000_000, share: 0.08 },
      { chain: "Other chains", supply: 291_000_000, share: 0.06 },
    ],
    sources: {
      supply: {
        status: "simulated",
        name: "Deterministic demo model",
        updatedAt: new Date().toISOString(),
        note: "Generated supply path; not an on-chain observation.",
      },
      flows: {
        status: "simulated",
        name: "Deterministic demo model",
        updatedAt: new Date().toISOString(),
        note: "Daily mints and redeems are derived from the simulated supply change.",
      },
      forces: {
        status: "simulated",
        name: "Deterministic demo model",
        updatedAt: new Date().toISOString(),
        note: "Driver readings are illustrative values, not live market data.",
      },
      loops: {
        status: "simulated",
        name: "Deterministic demo model",
        updatedAt: new Date().toISOString(),
        note: "Loop spread and utilization are illustrative.",
      },
      peg: {
        status: "simulated",
        name: "Deterministic demo model",
        updatedAt: new Date().toISOString(),
        note: "Secondary price and fees are illustrative.",
      },
    },
  };
}
