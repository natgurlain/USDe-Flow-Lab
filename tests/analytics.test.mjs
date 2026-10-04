import test from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "./helpers.mjs";
const a = loadModule("analytics");
const provider = loadModule("data-provider");
const point = (date, value) => ({ date, value });
const days = (count) =>
  Array.from({ length: count }, (_, index) =>
    point(
      new Date(Date.parse("2024-02-16") + index * 86400000)
        .toISOString()
        .slice(0, 10),
      index + 1,
    ),
  );

test("growth uses exact dates, signed percentages and zero-baseline nulls", () => {
  const points = [point("2024-02-22", 100), point("2024-02-29", 80)];
  const result = a.supplyGrowth(points, 7);
  assert.equal(result.change, -20);
  assert.equal(result.percent, -20);
  assert.equal(result.start, "2024-02-22");
  assert.equal(a.supplyGrowth(points, 30), null);
  assert.equal(
    a.supplyGrowth([point("2024-02-22", 0), point("2024-02-29", 80)], 7)
      .percent,
    null,
  );
});
test("daily averages require consecutive days, including leap day", () => {
  const points = days(14);
  const window = a.dailyWindow(points, 14);
  assert.equal(window.average, 7.5);
  assert.equal(window.end, "2024-02-29");
  assert.equal(window.start, "2024-02-16");
  assert.equal(a.dailyWindow(points.slice(1), 14), null);
  assert.equal(
    a.dailyWindow([...points.slice(0, 13), points[12], points[13]], 14),
    null,
  );
  assert.equal(a.dailyWindow([point("bad-date", 1)], 1), null);
});
test("cash-flow windows include zero days and never treat missing dates as zeros", () => {
  const points = days(30).map((p) => ({ ...p, value: 0 }));
  assert.equal(a.dailyWindow(points, 30).total, 0);
  assert.equal(
    a.dailyWindow(
      points.filter((_, i) => i !== 28),
      7,
    ),
    null,
  );
  const metric = provider.emptySnapshot().metrics.supply;
  const missing = a.windowMetric(
    points.filter((_, i) => i !== 28),
    metric,
    7,
  );
  assert.equal(missing.value, null);
  assert.equal(missing.status, "unavailable");
});
test("milestone progress is bounded and never forecasts activation", () => {
  assert.equal(a.milestoneProgress(5, 10).percent, 50);
  assert.equal(a.milestoneProgress(12, 10).percent, 100);
  assert.equal(a.milestoneProgress(12, 10).remaining, 0);
  assert.equal(a.milestoneProgress(null, 10), null);
  assert.equal(a.milestoneProgress(-1, 10), null);
});
