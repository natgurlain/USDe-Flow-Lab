const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const quantity = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatMoney(value: number) {
  return money.format(value);
}

export function formatCompact(value: number) {
  return quantity.format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00.000Z"));
}

export function formatSignedMoney(value: number) {
  if (value === 0) return "$0";
  return (value > 0 ? "+" : "−") + formatMoney(Math.abs(value));
}

export function formatPercent(value: number, digits = 2) {
  return value.toFixed(digits) + "%";
}

export function formatBps(value: number) {
  return (value > 0 ? "+" : "") + value.toFixed(1) + " bps";
}

export function formatAxisMoney(value: number) {
  const absolute = Math.abs(value);
  const formatted =
    absolute >= 1_000_000_000
      ? (absolute / 1_000_000_000).toFixed(absolute >= 10_000_000_000 ? 0 : 1) + "B"
      : absolute >= 1_000_000
        ? (absolute / 1_000_000).toFixed(0) + "M"
        : (absolute / 1_000).toFixed(0) + "K";
  return (value < 0 ? "−" : "") + "$" + formatted;
}

export function formatAxisDate(value: string, rangeDays: number) {
  const date = new Date(value + "T00:00:00.000Z");
  const options: Intl.DateTimeFormatOptions =
    rangeDays <= 30
      ? { month: "short", day: "numeric", timeZone: "UTC" }
      : { month: "short", year: "2-digit", timeZone: "UTC" };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}
