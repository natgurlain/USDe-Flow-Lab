import { getMockSnapshot } from "@/lib/mock-data";
import type { DashboardSnapshot, SupplyPoint } from "@/lib/types";

export interface DataProvider {
  getSnapshot(): Promise<DashboardSnapshot>;
}

type Stablecoin = {
  id: string | number;
  name: string;
  symbol: string;
  circulating?: { peggedUSD?: number };
};

type StablecoinCatalog =
  | Stablecoin[]
  | {
      peggedAssets?: Stablecoin[];
    };

type ChainHistory = {
  tokens?: Array<{
    date?: number;
    circulating?: { peggedUSD?: number };
  }>;
};

type StablecoinHistory = {
  chainBalances?: Record<string, ChainHistory>;
};

function toDailySupply(history: StablecoinHistory): SupplyPoint[] {
  const totals = new Map<string, number>();
  for (const chain of Object.values(history.chainBalances ?? {})) {
    for (const sample of chain.tokens ?? []) {
      if (!sample.date || !Number.isFinite(sample.circulating?.peggedUSD)) continue;
      const date = new Date(sample.date * 1000).toISOString().slice(0, 10);
      totals.set(date, (totals.get(date) ?? 0) + (sample.circulating?.peggedUSD ?? 0));
    }
  }
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, supply]) => ({
      date,
      supply,
      susdeSupply: 0,
      stakingRatio: 0,
    }));
}

function latestByChain(history: StablecoinHistory) {
  const entries = Object.entries(history.chainBalances ?? {})
    .map(([chain, series]) => {
      const latest = (series.tokens ?? []).reduce<{
        date: number;
        supply: number;
      } | null>((current, sample) => {
        const supply = sample.circulating?.peggedUSD;
        if (!sample.date || !Number.isFinite(supply)) return current;
        if (!current || sample.date > current.date) {
          return { date: sample.date, supply: supply ?? 0 };
        }
        return current;
      }, null);
      return latest ? { chain, supply: latest.supply } : null;
    })
    .filter((item): item is { chain: string; supply: number } => item !== null && item.supply > 0)
    .sort((left, right) => right.supply - left.supply);
  const total = entries.reduce((sum, item) => sum + item.supply, 0);
  return entries.map((item) => ({
    ...item,
    share: total > 0 ? item.supply / total : 0,
  }));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error("DeFiLlama returned HTTP " + response.status);
  }
  return response.json() as Promise<T>;
}

export class MockDataProvider implements DataProvider {
  async getSnapshot() {
    return getMockSnapshot();
  }
}

export class DefiLlamaDataProvider implements DataProvider {
  async getSnapshot() {
    const demo = getMockSnapshot();
    const [catalog, history] = await Promise.all([
      fetchJson<StablecoinCatalog>("https://stablecoins.llama.fi/stablecoins"),
      fetchJson<StablecoinHistory>("https://stablecoins.llama.fi/stablecoin/146"),
    ]);
    const assets = Array.isArray(catalog) ? catalog : catalog.peggedAssets ?? [];
    const usde = assets.find(
      (asset) => String(asset.id) === "146" || asset.name === "Ethena USDe",
    );
    const supplyPoints = toDailySupply(history);
    if (!usde || supplyPoints.length < 30) {
      throw new Error("DeFiLlama returned incomplete USDe supply history");
    }

    const latest = usde.circulating?.peggedUSD ?? supplyPoints[supplyPoints.length - 1].supply;
    const chainBreakdown = latestByChain(history);
    const mockStakingRatio = new Map(
      demo.supplyPoints.map((point) => [point.date, point.stakingRatio]),
    );
    const alignedSupply = supplyPoints.map((point) => {
      const stakingRatio = mockStakingRatio.get(point.date) ?? 0.24;
      return {
        ...point,
        susdeSupply: point.supply * stakingRatio,
        stakingRatio,
      };
    });
    const timestamp = new Date().toISOString();

    return {
      ...demo,
      mode: "partial-live" as const,
      updatedAt: timestamp,
      currentSupply: latest,
      supplyPoints: alignedSupply,
      chainBreakdown: chainBreakdown.length ? chainBreakdown : demo.chainBreakdown,
      sources: {
        ...demo.sources,
        supply: {
          status: "live" as const,
          name: "DeFiLlama stablecoin API",
          updatedAt: timestamp,
          note: "Circulating USDe aggregated from DeFiLlama chain history; staking split remains simulated.",
        },
      },
    };
  }
}

export function createDataProvider(): DataProvider {
  if (process.env.USDE_DATA_PROVIDER === "mock") return new MockDataProvider();
  return new DefiLlamaDataProvider();
}

export async function getInitialDashboardData() {
  return getMockSnapshot();
}
