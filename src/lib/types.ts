export type DataStatus = "current" | "stale" | "unavailable" | "demo";
export type Metric = {
  value: number | null;
  status: DataStatus;
  source: string;
  sourceUrl: string;
  observedAt: string | null;
  fetchedAt: string | null;
  unit: string;
  methodology: string;
  coverage: string;
  maxAgeHours: number;
};
export type SeriesPoint = { date: string; value: number };
export type ChainPoint = { chain: string; supply: number; observedAt: string };
export type MetricKey =
  | "supply"
  | "price"
  | "supplyChange7d"
  | "yield"
  | "backing"
  | "reserve"
  | "enaPrice"
  | "stakingShare"
  | "minted"
  | "redeemed"
  | "realized7d"
  | "realized30d"
  | "cooldown"
  | "vaultAssets";
export type DashboardSnapshot = {
  version: 2;
  mode: "production" | "demo";
  fetchedAt: string;
  metrics: Record<MetricKey, Metric>;
  supplyHistory: SeriesPoint[];
  priceHistory: SeriesPoint[];
  yieldHistory: SeriesPoint[];
  priceHistoryMeta: Metric;
  chains: ChainPoint[];
  providerFailures?: string[];
  composition?: {
    items: { name: string; value: number }[];
    observedAt: string;
    fetchedAt: string;
    status: DataStatus;
  };
  backingReport?: {
    assets: number;
    reserve: number;
    supply: number;
    observedAt: string;
  };
  flows?: {
    events: import("./onchain").FlowEvent[];
    fromBlock: number;
    toBlock: number;
    start: string;
    end: string;
  };
};
