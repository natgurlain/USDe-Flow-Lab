"use client";
import type { DashboardSnapshot } from "@/lib/types";
import { dailyChanges, supplyDelta, type RangeKey } from "@/lib/metrics";
import { formatCompact, formatSignedMoney } from "@/lib/format";
import { HistoryPanel } from "./history-panel";
import { MetricCard, Panel, SourceLine, Unavailable } from "./primitives";
export default function TapeView({
  data,
  range,
}: {
  data: DashboardSnapshot;
  range: RangeKey;
}) {
  const latest = data.supplyHistory.at(-1);
  const changes = dailyChanges(data.supplyHistory);
  const covered = data.chains.reduce((sum, chain) => sum + chain.supply, 0);
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">THE ORIGINAL FLOW LAB, EXPLAINED</p>
        <h1>Follow the dollars.</h1>
        <p>
          Is the amount of USDe growing or shrinking? Start with supply. Then
          understand how dollars are created and redeemed.
        </p>
      </div>
      <div className="three-column">
        {[1, 7, 30].map((days) => {
          const delta = supplyDelta(data.supplyHistory, days);
          return (
            <MetricCard
              key={days}
              label={`Supply change · ${days === 1 ? "1 day" : days + " days"}`}
              value={delta === null ? "Unavailable" : formatSignedMoney(delta)}
              detail={`Window ends ${latest?.date ?? "when observations are available"}`}
              explanation="Difference between two daily observations, valued at the $1 target."
              metric={{
                ...data.metrics.supply,
                value: delta,
                status:
                  delta === null ? "unavailable" : data.metrics.supply.status,
                methodology: `Supply on the latest date minus supply exactly ${days} calendar days earlier.`,
              }}
            />
          );
        })}
      </div>
      <HistoryPanel
        title="USDe supply over time"
        description="The observed global supply, valued at the $1 target. Bridge balances are not added to this total."
        points={data.supplyHistory}
        metric={data.metrics.supply}
        range={range}
        kind="supply"
      />
      <HistoryPanel
        title="What changed each day?"
        description="Daily supply differences. A bar above zero means supply grew; below zero means it shrank. Gaps are left unfilled."
        points={changes}
        metric={{
          ...data.metrics.supply,
          methodology:
            "Differences between consecutive calendar-day supply observations. Missing days are excluded.",
        }}
        range={range}
        kind="change"
      />
      <Panel
        title="Three things that sound similar"
        eyebrow="BUT MEASURE DIFFERENT ACTIVITY"
      >
        <div className="explain-steps">
          <article>
            <span>01</span>
            <h3>USDe created</h3>
            <p>
              Approved counterparties provide backing assets and receive newly
              issued USDe. This is called minting.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>USDe redeemed</h3>
            <p>
              Approved counterparties return USDe for backing assets. These USDe
              tokens are removed from circulation.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>USDe traded</h3>
            <p>
              People buy and sell existing USDe on exchanges. Trading volume
              alone does not tell us how much USDe was created.
            </p>
          </article>
        </div>
        <a
          className="text-link"
          href="https://docs.ethena.fi/video-guides/how-to-buy-usde"
          target="_blank"
          rel="noreferrer"
        >
          Read Ethena’s mint and redemption explanation ↗
        </a>
      </Panel>
      <div className="two-column">
        <Panel
          title="USDe created and redeemed"
          description="Verified gross flow totals"
        >
          {data.flows ? (
            <>
              <p className="body-copy">
                Ethereum issuer only ·{" "}
                {data.flows.start.replace("T", " ").slice(0, 16)} to{" "}
                {data.flows.end.replace("T", " ").slice(0, 16)} UTC. This
                finalized window is independent of the chart period.
              </p>
              <p className="body-copy">
                <b>USDe created:</b> {formatCompact(data.metrics.minted.value!)}{" "}
                · <b>USDe redeemed:</b>{" "}
                {formatCompact(data.metrics.redeemed.value!)} ·{" "}
                <b>Net issuance:</b>{" "}
                {formatSignedMoney(
                  data.metrics.minted.value! - data.metrics.redeemed.value!,
                )}
              </p>
              <SourceLine metric={data.metrics.minted} expanded />
              <SourceLine metric={data.metrics.redeemed} />
              <details className="learn-detail">
                <summary>
                  Recent verified transactions ({data.flows.events.length}{" "}
                  events)
                </summary>
                <ul className="simple-list">
                  {data.flows.events.slice(0, 20).map((event) => (
                    <li key={`${event.transactionHash}:${event.logIndex}`}>
                      <a
                        className="text-link"
                        href={`https://etherscan.io/tx/${event.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {event.kind === "mint" ? "Created" : "Redeemed"}{" "}
                        {formatCompact(event.amount)} USDe · block{" "}
                        {event.blockNumber} ·{" "}
                        {event.transactionHash.slice(0, 10)}… ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
              <p className="small-copy">
                Only Mint/Redeem events from the official Ethereum issuer
                contract are counted. Transfers, bridging, other contracts, and
                secondary trading are excluded. This is a recent window, not
                complete historical or multi-network coverage.
              </p>
            </>
          ) : (
            <Unavailable
              title="Primary-market readings could not update"
              href="https://docs.ethena.fi/api-documentation/overview"
            >
              The adapter reads a bounded day of finalized Ethereum Mint/Redeem
              events. Its complete query must succeed before totals appear.
              Supply differences above are not gross creation or redemption.
            </Unavailable>
          )}
        </Panel>
        <Panel
          title="Where is USDe circulating?"
          description="Network samples aligned to the latest global supply date"
        >
          {data.chains.length ? (
            <>
              <div className="chain-list">
                {data.chains.map((chain) => (
                  <div className="chain-row" key={chain.chain}>
                    <div>
                      <span>{chain.chain}</span>
                      <b>{formatCompact(chain.supply)} USDe</b>
                    </div>
                    <div className="chain-track">
                      <span
                        style={{
                          width: `${covered > 0 ? (chain.supply / covered) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="small-copy">
                Shares are relative to the covered network subtotal (
                {formatCompact(covered)} USDe), which may differ from global
                supply because of provider bridge accounting and coverage.
              </p>
              <SourceLine metric={data.metrics.supply} />
            </>
          ) : (
            <Unavailable title="No aligned network observations">
              No verified network samples are available for the global
              observation date.
            </Unavailable>
          )}
        </Panel>
      </div>
      <Panel
        title="What can influence demand?"
        eyebrow="OPTIONAL ADVANCED CONTEXT"
      >
        <p className="body-copy">
          Yield, market price, hedging costs, and borrowing rates can affect
          incentives to hold or redeem USDe. They do not establish the cause of
          a supply move.
        </p>
        <details className="learn-detail">
          <summary>What happened to ForceScore?</summary>
          <p>
            The original Flow Lab combined standardized yield, funding,
            borrowing spread, peg and redemption-stress inputs into a
            descriptive index. Its inputs were simulated and its predictive
            value was not validated. It is not displayed as a current signal or
            a safety rating.
          </p>
          <code>
            0.30 × z(carry) + 0.25 × z(funding) + 0.25 × z(loop spread) + 0.15 ×
            z(peg less mint fee) − 0.05 × z(redemption stress)
          </code>
          <p>
            A future version needs verified inputs, documented units and a
            separate evaluation before numerical results are useful.
          </p>
        </details>
      </Panel>
    </>
  );
}
