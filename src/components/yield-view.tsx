"use client";
import { useState } from "react";
import type { DashboardSnapshot } from "@/lib/types";
import { illustrateYield, type RangeKey } from "@/lib/metrics";
import { HistoryPanel } from "./history-panel";
import { MetricCard, Panel, Unavailable } from "./primitives";
export default function YieldView({
  data,
  range,
}: {
  data: DashboardSnapshot;
  range: RangeKey;
}) {
  const metric = data.metrics.yield;
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState(String(metric.value?.toFixed(2) ?? 5));
  const [days, setDays] = useState("365");
  const gain = [amount, rate, days].some((value) => value.trim() === "")
    ? null
    : illustrateYield(Number(amount), Number(rate), Number(days));
  const number = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">UNDERSTAND THE REWARDS</p>
        <h1>Yield, without the mystery.</h1>
        <p>
          Staking USDe gives you sUSDe, a share in the staking vault. As rewards
          arrive, each share can represent more USDe.
        </p>
      </div>
      <div className="two-column">
        <MetricCard
          label="sUSDe estimated annual yield"
          value={
            metric.value === null
              ? "Unavailable"
              : metric.value.toFixed(2) + "%"
          }
          detail="Annualized estimate · APY"
          explanation="The provider scales a recent reward distribution to a year and assumes weekly compounding. This is not your realized return."
          metric={metric}
        />
        <Panel
          title="Where can the rewards come from?"
          eyebrow="THE SHORT VERSION"
        >
          <ul className="simple-list">
            <li>
              <b>Hedging income.</b> Derivatives funding and price differences
              can generate income from hedging positions. This income can fall
              or turn negative.
            </li>
            <li>
              <b>Backing-asset income.</b> Eligible backing assets can earn
              staking or interest income.
            </li>
            <li>
              <b>Distribution decisions.</b> Protocol income and the rewards
              sent to sUSDe holders are different measurements.
            </li>
          </ul>
          <a
            href="https://docs.ethena.fi/resources/faq"
            className="text-link"
            target="_blank"
            rel="noreferrer"
          >
            Read Ethena’s explanation ↗
          </a>
        </Panel>
      </div>
      <HistoryPanel
        title="How has the estimated yield changed?"
        description="Historical provider estimates, each annualized from a recent reward distribution. This chart does not show a realized trailing APY."
        points={data.yieldHistory}
        metric={metric}
        range={range}
        kind="yield"
      />
      <div className="two-column">
        <Panel
          title="What might that mean for $1,000?"
          eyebrow="TRY AN ILLUSTRATION"
        >
          <p className="body-copy">
            Choose an amount, an assumed annual yield, and a holding period.
            This calculation assumes the same APY throughout and USDe staying at
            $1.
          </p>
          <div className="calculator-fields">
            <label>
              Amount in USDe
              <input
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label>
              Assumed APY (%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
            </label>
            <label>
              Days held
              <input
                type="number"
                min="0"
                max="3650"
                step="1"
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </label>
          </div>
          <div className="calculator-result" aria-live="polite">
            <span>Illustrative rewards at $1 per USDe</span>
            <strong>
              {gain === null ? "Enter valid values" : number.format(gain)}
            </strong>
          </div>
          <p className="small-copy">
            {metric.value === null
              ? "The initial 5% is a hypothetical input because observed yield is unavailable. "
              : "The starting rate is the provider’s estimate at page load. "}
            Future rewards vary. This excludes fees, taxes, cooldown time, price
            changes, and protocol losses. It is not a promised return.
          </p>
        </Panel>
        <Panel title="Before you stake or exit" eyebrow="THINGS TO UNDERSTAND">
          <ul className="simple-list">
            <li>
              USDe on its own does not automatically receive staking rewards.
            </li>
            <li>
              sUSDe shares are not equal to the same number of USDe tokens.
              Their assets-per-share exchange rate matters.
            </li>
            <li>
              Unstaking can have a cooldown. Selling sUSDe on an exchange is a
              different exit, at the available market price.
            </li>
            <li>
              Availability depends on the official application’s rules and your
              jurisdiction.
            </li>
          </ul>
          <p className="small-copy">
            A current cooldown contract read is not connected here. Check the
            official application before acting; older documentation may describe
            a past setting.
          </p>
          <a
            className="text-link"
            href="https://app.ethena.fi/"
            target="_blank"
            rel="noreferrer"
          >
            Check the official app’s current rules ↗
          </a>
        </Panel>
      </div>
      <Panel title="Realized returns and staking participation">
        <Unavailable title="Vault observations are not connected">
          Realized trailing yield requires dated assets-per-share observations.
          Staking participation requires underlying USDe assets divided by
          circulating supply. We do not replace those values with share counts
          or USD market valuations.
        </Unavailable>
      </Panel>
    </>
  );
}
