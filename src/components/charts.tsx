"use client";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import type { SeriesPoint } from "@/lib/types";
import { chartObservations } from "@/lib/metrics";
import { formatMoney } from "@/lib/format";

export default function HistoryChart({
  points,
  kind,
  label,
}: {
  points: SeriesPoint[];
  kind: "supply" | "price" | "yield" | "change";
  label: string;
}) {
  if (points.length < 2)
    return (
      <div className="chart-empty">
        <span>Chart unavailable</span>
        <p>
          {points.length === 1
            ? "One observation is available. A trend needs at least two."
            : "No verified observations are available for this period."}
        </p>
      </div>
    );
  const isPrice = kind === "price";
  const formatValue = (value: number) =>
    isPrice
      ? "$" + value.toFixed(4)
      : kind === "yield"
        ? value.toFixed(2) + "%"
        : formatMoney(value);
  const chartData = chartObservations(points, isPrice);
  const formatAxis = isPrice
    ? (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
    : formatValue;
  const first = points[0],
    last = points[points.length - 1];
  return (
    <>
      <div
        className="chart"
        role="img"
        aria-label={`${label}. ${points.length} observations. First: ${first.date.slice(0, 10)}, ${formatValue(first.value)}. Last: ${last.date.slice(0, 10)}, ${formatValue(last.value)}.`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart
            data={chartData}
            margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id={`fill-${kind}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b1f59f" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#b1f59f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff0b" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(date: number) =>
                new Intl.DateTimeFormat("en", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                }).format(new Date(date))
              }
              minTickGap={45}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8b9694", fontSize: 11 }}
            />
            <YAxis
              domain={
                isPrice
                  ? [
                      (min: number) => Math.min(min, -0.5),
                      (max: number) => Math.max(max, 0.5),
                    ]
                  : kind === "change"
                    ? ["auto", "auto"]
                    : [0, "auto"]
              }
              tickFormatter={formatAxis}
              width={70}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8b9694", fontSize: 11 }}
            />
            <Tooltip
              labelFormatter={(label) =>
                new Date(Number(label))
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 19) + " UTC"
              }
              formatter={(value) => [
                isPrice
                  ? `${formatAxis(Number(value))} ($${(1 + Number(value) / 100).toFixed(4)})`
                  : formatValue(Number(value)),
                kind === "yield" ? "Estimated APY" : label,
              ]}
              contentStyle={{
                background: "#16201f",
                border: "1px solid #344440",
                borderRadius: 12,
                color: "#f3f6f3",
              }}
            />
            {isPrice && (
              <ReferenceLine
                y={0}
                stroke="#a1aba7"
                strokeDasharray="4 4"
                label={{
                  value: "$1 target · 0%",
                  position: "insideTopRight",
                  fill: "#a1aba7",
                  fontSize: 11,
                }}
              />
            )}
            {kind === "change" ? (
              <>
                <ReferenceLine y={0} stroke="#a1aba7" />
                <Bar dataKey="value" fill="#9edbcb" radius={[2, 2, 0, 0]} />
              </>
            ) : kind === "supply" ? (
              <Area
                type="linear"
                dataKey="value"
                stroke="#b1f59f"
                strokeWidth={2}
                fill={`url(#fill-${kind})`}
                isAnimationActive={false}
              />
            ) : (
              <Line
                type="linear"
                dataKey="value"
                stroke={isPrice ? "#9edbcb" : "#d1bdf8"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <details className="chart-table">
        <summary>View observations as a table</summary>
        <div className="table-scroll">
          <table>
            <caption>
              {label} · {points.length} observations · UTC
            </caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date}>
                  <td>{point.date.replace("T", " ").slice(0, 19)}</td>
                  <td>{formatValue(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
