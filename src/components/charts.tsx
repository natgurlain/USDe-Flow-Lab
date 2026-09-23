"use client";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { formatAxisDate, formatAxisMoney, formatDate, formatMoney } from "@/lib/format";
import { sliceByRange, type RangeKey } from "@/lib/view-state";
import type { EventItem, FlowPoint, ForcePoint, SupplyPoint } from "@/lib/types";

type TipEntry = {
  name?: unknown;
  value?: unknown;
  color?: string;
};

function formatTooltipValue(name: string, value: number) {
  if (name.toLowerCase().includes("score")) return value.toFixed(2);
  if (name.toLowerCase().includes("ratio")) return (value * 100).toFixed(1) + "%";
  if (name.toLowerCase().includes("apy") || name.toLowerCase().includes("funding") || name === "T-bill") {
    return value.toFixed(2) + "%";
  }
  if (name.toLowerCase().includes("spread") || name.toLowerCase().includes("peg")) {
    return (value > 0 ? "+" : "") + value.toFixed(1) + " bps";
  }
  return formatMoney(value);
}

export function StakingRatioChart({
  data,
  range,
  height = 220,
}: {
  data: SupplyPoint[];
  range: RangeKey;
  height?: number;
}) {
  const visible = sliceByRange(data, range);
  return (
    <div className="chart-frame" style={{ height }} role="img" aria-label="Estimated sUSDe share of circulating USDe over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={visible} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="stakingRatioFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ddc97" stopOpacity={0.13} />
              <stop offset="100%" stopColor="#3ddc97" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#202629" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatAxisDate(value, axisDays(range))}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={{ stroke: "#30383c" }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            domain={[0, 0.45]}
            tickFormatter={(value) => (value * 100).toFixed(0) + "%"}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="stakingRatio"
            name="sUSDe / USDe ratio"
            stroke="#3ddc97"
            strokeWidth={1.7}
            fill="url(#stakingRatioFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TipEntry>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-date">{formatDate(label)}</div>}
      {payload.map((item, index) => (
        <div className="chart-tooltip-row" key={index}>
          <span className="chart-tooltip-dot" style={{ background: item.color }} />
          <span>{String(item.name ?? "Value")}</span>
          <strong>
            {typeof item.value === "number"
              ? formatTooltipValue(String(item.name ?? "Value"), item.value)
              : String(item.value ?? "—")}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function DriverHistoryChart({
  data,
  range,
  kind,
  height = 230,
}: {
  data: ForcePoint[];
  range: RangeKey;
  kind: "carry" | "funding" | "loop" | "peg";
  height?: number;
}) {
  const visible = sliceByRange(data, range);
  const isCarry = kind === "carry";
  const key =
    kind === "funding"
      ? "ethFunding7d"
      : kind === "loop"
        ? "loopSpread"
        : kind === "peg"
          ? "pegBps"
          : "susdeApy";
  const name =
    kind === "funding"
      ? "ETH funding 7d"
      : kind === "loop"
        ? "Loop spread"
        : kind === "peg"
          ? "Peg premium"
          : "sUSDe APY";
  const stroke =
    kind === "funding"
      ? "#9bc6ff"
      : kind === "loop"
        ? "#d5a6ff"
        : kind === "peg"
          ? "#f0bd69"
          : "#3ddc97";
  const zeroLine = kind !== "carry";
  return (
    <div className="chart-frame" style={{ height }} role="img" aria-label={name + " history"}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={visible} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#202629" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatAxisDate(value, axisDays(range))}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={{ stroke: "#30383c" }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            tickFormatter={(value) => isCarry ? value + "%" : value}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} />
          {zeroLine && <ReferenceLine y={0} stroke="#657075" />}
          {isCarry && (
            <Line
              type="monotone"
              dataKey="tBill"
              name="T-bill"
              stroke="#8b969a"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          )}
          <Line
            type="monotone"
            dataKey={key}
            name={name}
            stroke={stroke}
            strokeWidth={1.8}
            dot={false}
            activeDot={{ r: 3, fill: stroke, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function axisDays(range: RangeKey) {
  if (range === "24h") return 1;
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  if (range === "1y") return 365;
  if (range === "all") return 1000;
  return 90;
}

export function SupplyChart({
  data,
  events,
  range,
  logScale = false,
  showStaking = false,
}: {
  data: SupplyPoint[];
  events: EventItem[];
  range: RangeKey;
  logScale?: boolean;
  showStaking?: boolean;
}) {
  const visible = sliceByRange(data, range);
  const visibleDates = new Set(visible.map((point) => point.date));
  const visibleEvents = events.filter((event) => visibleDates.has(event.date));

  return (
    <div
      className="chart-frame supply-chart-frame"
      role="img"
      aria-label="USDe circulating supply history with optional staked supply overlay and event markers"
    >
      <p className="sr-only">
        Supply rises through 2024 and 2025, peaks near 14.8 billion dollars in October 2025,
        falls in two simulated shocks, and recovers to about 4.9 billion dollars in September 2026.
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={visible} margin={{ top: 20, right: 8, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id="supplyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9bc6ff" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#9bc6ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="susdeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ddc97" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#3ddc97" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#202629" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatAxisDate(value, axisDays(range))}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={{ stroke: "#30383c" }}
            tickLine={false}
            minTickGap={32}
            tickMargin={10}
          />
          <YAxis
            yAxisId="supply"
            orientation="right"
            scale={logScale ? "log" : "auto"}
            domain={logScale ? [100_000_000, "auto"] : ["auto", "auto"]}
            tickFormatter={formatAxisMoney}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          {showStaking && (
            <YAxis
              yAxisId="staking"
              orientation="left"
              tickFormatter={formatAxisMoney}
              tick={{ fill: "#5e8f79", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
          )}
          <Tooltip content={<ChartTooltip />} />
          {visibleEvents.map((event) => (
            <ReferenceLine
              key={event.id}
              x={event.date}
              yAxisId="supply"
              stroke="#f0bd69"
              strokeDasharray="3 5"
              strokeOpacity={0.65}
              label={{
                value:
                  event.kind === "market"
                    ? "LIQUIDATION"
                    : event.kind === "redemption"
                      ? "REDEMPTION"
                      : event.kind === "maturity"
                        ? "PT MATURITY"
                        : event.kind === "fee"
                          ? "FEE"
                          : "COLLATERAL",
                position: "insideTop",
                fill: "#d9b773",
                fontSize: 8,
              }}
            />
          ))}
          {visibleDates.has("2025-10-10") && (
            <ReferenceLine
              x="2025-10-10"
              yAxisId="supply"
              stroke="#c4ddff"
              strokeDasharray="2 5"
              strokeOpacity={0.55}
              label={{ value: "ATH · $14.8B", position: "insideTopRight", fill: "#c4ddff", fontSize: 8 }}
            />
          )}
          <Area
            yAxisId="supply"
            type="monotone"
            dataKey="supply"
            name="Circulating supply"
            stroke="#c4ddff"
            strokeWidth={2}
            fill="url(#supplyFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#c4ddff" }}
          />
          {showStaking && (
            <Area
              yAxisId="staking"
              type="monotone"
              dataKey="susdeSupply"
              name="sUSDe supply · modelled"
              stroke="#3ddc97"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#susdeFill)"
              dot={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FlowChart({
  data,
  range,
  height = 242,
}: {
  data: FlowPoint[];
  range: RangeKey;
  height?: number;
}) {
  const visible = sliceByRange(data, range);
  return (
    <div
      className="chart-frame"
      style={{ height }}
      role="img"
      aria-label="Daily USDe mints above zero, redeems below zero, and net flow in white"
    >
      <p className="sr-only">
        Green bars are mints, red bars are redemptions shown below zero, and the white line is net
        supply change.
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={visible} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#202629" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatAxisDate(value, axisDays(range))}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={{ stroke: "#30383c" }}
            tickLine={false}
            minTickGap={30}
            tickMargin={10}
          />
          <YAxis
            tickFormatter={formatAxisMoney}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine y={0} stroke="#657075" />
          <Bar dataKey="minted" name="Mints" fill="#3ddc97" maxBarSize={9} />
          <Bar dataKey="redeemedSigned" name="Redeems" fill="#ff5a5f" maxBarSize={9} />
          <Line
            type="monotone"
            dataKey="net"
            name="Net supply change"
            stroke="#f3f4f2"
            strokeWidth={1.7}
            dot={false}
            activeDot={{ r: 3, fill: "#f3f4f2", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CumulativeFlowChart({
  data,
  range,
  height = 224,
}: {
  data: FlowPoint[];
  range: RangeKey;
  height?: number;
}) {
  const visible = sliceByRange(data, range);
  return (
    <div className="chart-frame" style={{ height }} role="img" aria-label="Cumulative net USDe minted">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={visible} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#202629" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatAxisDate(value, axisDays(range))}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={{ stroke: "#30383c" }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            tickFormatter={formatAxisMoney}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine y={0} stroke="#657075" />
          <Line
            type="monotone"
            dataKey="cumulativeNet"
            name="Cumulative net minted"
            stroke="#f3f4f2"
            strokeWidth={1.8}
            dot={false}
            activeDot={{ r: 3, fill: "#f3f4f2", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ForceSparkline({
  data,
  dataKey,
  color,
}: {
  data: ForcePoint[];
  dataKey: keyof ForcePoint;
  color: string;
}) {
  const visible = data.slice(-90);
  return (
    <div className="sparkline" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={visible}>
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ForceHistoryChart({
  data,
  range,
  height = 250,
}: {
  data: ForcePoint[];
  range: RangeKey;
  height?: number;
}) {
  const visible = sliceByRange(data, range);
  return (
    <div className="chart-frame" style={{ height }} role="img" aria-label="ForceScore and next 7-day net supply change over time">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={visible} margin={{ top: 14, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#202629" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatAxisDate(value, axisDays(range))}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={{ stroke: "#30383c" }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            yAxisId="score"
            tick={{ fill: "#a8b8c2", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <YAxis
            yAxisId="flow"
            orientation="right"
            tickFormatter={formatAxisMoney}
            tick={{ fill: "#3ddc97", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine yAxisId="score" y={0} stroke="#576166" />
          <Line
            yAxisId="score"
            type="monotone"
            dataKey="forceScore"
            name="ForceScore"
            stroke="#f1f3f1"
            strokeWidth={1.7}
            dot={false}
          />
          <Line
            yAxisId="flow"
            type="monotone"
            dataKey="next7dNet"
            name="Following 7-day net"
            stroke="#3ddc97"
            strokeWidth={1.6}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ForceScatterChart({ data, height = 260 }: { data: ForcePoint[]; height?: number }) {
  const points = data.filter(
    (point): point is ForcePoint & { next7dNet: number } => point.next7dNet !== null,
  );
  return (
    <div className="chart-frame" style={{ height }} role="img" aria-label="Scatter plot of daily ForceScore against net supply change during the following seven days">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 8, left: 4, bottom: 8 }}>
          <CartesianGrid stroke="#202629" />
          <XAxis
            type="number"
            dataKey="forceScore"
            name="ForceScore"
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={{ stroke: "#30383c" }}
            tickLine={false}
            label={{ value: "ForceScore at day t", position: "insideBottom", offset: -4, fill: "#7f8b8f", fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="next7dNet"
            name="Following 7-day net"
            tickFormatter={formatAxisMoney}
            tick={{ fill: "#7f8b8f", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <ZAxis range={[24, 24]} />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine y={0} stroke="#657075" />
          <Scatter name="Daily observations" data={points} fill="#9bc6ff" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
