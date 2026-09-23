export type AssetVolumes = {
  USDT: number;
  USDC: number;
  stETH: number;
  other: number;
};

export type FlowPoint = {
  date: string;
  minted: number;
  redeemed: number;
  redeemedSigned: number;
  net: number;
  cumulativeNet: number;
  mintedByAsset: AssetVolumes;
  redeemedByAsset: AssetVolumes;
};

export type SupplyPoint = {
  date: string;
  supply: number;
  susdeSupply: number;
  stakingRatio: number;
};

export type ForcePoint = {
  date: string;
  susdeApy: number;
  tBill: number;
  carrySpread: number;
  ethFunding7d: number;
  loopSpread: number;
  pegBps: number;
  mintFeeBps: number;
  redeemFeeBps: number;
  redemptionStress: number;
  forceScore: number;
  next7dNet: number | null;
};

export type MintTx = {
  ts: string;
  side: "mint" | "redeem";
  usde: number;
  asset: string;
  assetUsd: number;
  account: string;
  tx: string | null;
};

export type EventItem = {
  id: string;
  date: string;
  endDate?: string;
  kind: "market" | "redemption" | "maturity" | "fee" | "collateral";
  title: string;
  summary: string;
  verification: "illustrative" | "source-required";
};

export type SourceStatus = {
  status: "live" | "simulated" | "stale";
  name: string;
  updatedAt: string;
  note: string;
};

export type DashboardSnapshot = {
  mode: "simulated" | "partial-live";
  updatedAt: string;
  currentSupply: number;
  supplyPoints: SupplyPoint[];
  flows: FlowPoint[];
  forces: ForcePoint[];
  transactions: MintTx[];
  events: EventItem[];
  collateralBreakdown: Array<{
    asset: keyof AssetVolumes;
    minted: number;
    redeemed: number;
  }>;
  topMinters: Array<{ account: string; share: number; flow: number }>;
  chainBreakdown: Array<{ chain: string; supply: number; share: number }>;
  sources: {
    supply: SourceStatus;
    flows: SourceStatus;
    forces: SourceStatus;
    loops: SourceStatus;
    peg: SourceStatus;
  };
};
