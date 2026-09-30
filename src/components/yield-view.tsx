"use client";
import { useState } from "react";
import type { DashboardSnapshot } from "@/lib/types";
import { illustrateYield, type RangeKey } from "@/lib/metrics";
import { HistoryPanel } from "./history-panel";
import { MetricCard, Panel } from "./primitives";
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
      <div className="three-column">
        {(["realized7d", "realized30d"] as const).map((key) => (
          <MetricCard
            key={key}
            label={`Realized trailing ${key === "realized7d" ? "7" : "30"}-day yield`}
            value={
              data.metrics[key].value === null
                ? "Unavailable"
                : data.metrics[key].value!.toFixed(2) + "%"
            }
            detail="Annualized · APY"
            explanation="What the vault exchange rate actually delivered over this window, expressed as an annual rate. Future returns vary."
            metric={data.metrics[key]}
          />
        ))}
        <MetricCard
          label="Current unstaking cooldown"
          value={
            data.metrics.cooldown.value === null
              ? "Unavailable"
              : `${(data.metrics.cooldown.value / 86400).toLocaleString("en", { maximumFractionDigits: 2 })} days`
          }
          explanation="The latest observed contract setting. It can change; verify it in the official app before exiting."
          metric={data.metrics.cooldown}
        />
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
          title={
            gain === null
              ? "Try a yield illustration"
              : `What might that mean for ${number.format(Number(amount))}?`
          }
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
                max="1000000000"
                step="any"
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
                step="any"
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
          {gain === null && (
            <p className="small-copy" role="alert">
              Use an amount from 0 to 1 billion USDe, APY from 0 to 100%, and 0
              to 3,650 whole days.
            </p>
          )}
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
            The cooldown above is read from a finalized Ethereum block. Check
            the official application before acting: the setting can change, and
            eligibility and market liquidity also affect your exit.
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
      <div className="two-column">
        <MetricCard
          label="USDe held in the staking vault"
          value={
            data.metrics.vaultAssets.value === null
              ? "Unavailable"
              : number.format(data.metrics.vaultAssets.value)
          }
          detail="USDe valued at its $1 target"
          explanation="Underlying assets, rather than the number or market price of sUSDe shares. Excludes the cooldown silo and unvested rewards."
          metric={data.metrics.vaultAssets}
        />
        <MetricCard
          label="Share of issued USDe in the vault"
          value={
            data.metrics.stakingShare.value === null
              ? "Unavailable"
              : data.metrics.stakingShare.value.toFixed(2) + "%"
          }
          explanation="Vault assets divided by canonical USDe supply, read at the same block. Bridge-locked USDe remains in this denominator."
          metric={data.metrics.stakingShare}
        />
      </div>
    </>
  );
}
