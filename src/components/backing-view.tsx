import type { DashboardSnapshot } from "@/lib/types";
import { Panel, MetricCard, Unavailable } from "./primitives";
import { formatMoney } from "@/lib/format";
import { BackingAllocation } from "./backing-allocation";
const risks = [
  {
    title: "Funding and hedging",
    question: "What if hedging becomes expensive?",
    copy: "Funding income can drop or turn into a cost. Market volatility and changes in derivatives pricing can also make hedges harder to maintain.",
  },
  {
    title: "Custody",
    question: "What if assets cannot be accessed?",
    copy: "Backing assets rely on custody and settlement arrangements. Operational problems or a provider failure can delay access to assets.",
  },
  {
    title: "Exchange and counterparties",
    question: "What if a trading partner fails?",
    copy: "Hedging positions depend on exchanges and other counterparties. Their failure can disrupt hedges and settlement even when assets are held elsewhere.",
  },
  {
    title: "Liquidity and redemption",
    question: "What if many people want to exit together?",
    copy: "Markets can become less liquid, spreads can widen, and redemption can be interrupted. A reported backing ratio alone does not guarantee immediate access to one dollar.",
  },
  {
    title: "Smart contracts",
    question: "What if the software has a bug?",
    copy: "Contract vulnerabilities, integrations, or administrative controls can affect funds and operations. Audits reduce uncertainty but cannot eliminate every failure.",
  },
  {
    title: "Backing assets",
    question: "What if the assets behind USDe lose value?",
    copy: "Backing assets bring their own price, issuer, liquidity, and staking risks. Hedging and asset diversification do not remove every possible loss.",
  },
];
export default function BackingView({ data }: { data: DashboardSnapshot }) {
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">LOOK BEHIND THE DOLLAR</p>
        <h1>
          What backs it.
          <br />
          <span>What could go wrong.</span>
        </h1>
        <p>
          USDe uses backing assets and hedges designed to offset some
          market-price movements. Understanding the arrangements matters as much
          as the headline ratio.
        </p>
      </div>
      <Panel title="Read the latest issuer reports" eyebrow="DATED EVIDENCE">
        <a
          className="text-link"
          href="https://app.ethena.fi/dashboards/transparency"
          target="_blank"
          rel="noreferrer"
        >
          Official transparency dashboard and custodian attestations ↗
        </a>
        <p className="body-copy">
          Backing and reserves below are issuer-reported observations, not an
          independent audit or a promise of immediate redemption.
        </p>
        {data.backingReport && (
          <p className="small-copy">
            Reported assets: {formatMoney(data.backingReport.assets)} · Reserve:{" "}
            {formatMoney(data.backingReport.reserve)} · Matching reported USDe
            supply: {formatMoney(data.backingReport.supply)}. Reporting date:{" "}
            {data.backingReport.observedAt.replace("T", " ").slice(0, 16)} UTC.
            This denominator can differ from the daily supply provider.
          </p>
        )}
      </Panel>
      <div className="two-column">
        <MetricCard
          label="Reported backing coverage"
          value={
            data.metrics.backing.value === null
              ? "Unavailable"
              : data.metrics.backing.value.toFixed(2) + "%"
          }
          explanation="Issuer-reported backing assets plus the reserve fund, divided by issuer-reported USDe supply at the same timestamp. Reserve is included once."
          metric={data.metrics.backing}
        />
        <MetricCard
          label="Reported reserve fund"
          value={
            data.metrics.reserve.value === null
              ? "Unavailable"
              : formatMoney(data.metrics.reserve.value)
          }
          explanation="A buffer intended to help absorb periods of unfavorable protocol income. It is not a guarantee against losses."
          metric={data.metrics.reserve}
        />
      </div>
      <div className="two-column">
        <Panel title="What is behind USDe?" eyebrow="ASSETS PLUS HEDGES">
          <p className="body-copy">
            Ethena’s published terms describe crypto assets, eligible
            stablecoins, and offsetting derivatives positions. The mix changes
            over time; the latest allocation must come from dated reports.
          </p>
          <BackingAllocation data={data} />
          <a
            href="https://docs.ethena.fi/resources/usde-terms-and-conditions"
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Read the issuer’s description of backing ↗
          </a>
        </Panel>
        <Panel title="Where are assets held?" eyebrow="CUSTODY AND SETTLEMENT">
          <p className="body-copy">
            Ethena describes off-exchange settlement arrangements that allow
            assets to support hedging without being deposited directly into an
            exchange’s custody. These arrangements still depend on providers and
            settlement performance.
          </p>
          <Unavailable
            title="Current concentration is unavailable"
            href="https://app.ethena.fi/dashboards/transparency"
            label="View issuer reports and attestations"
          >
            We have not connected dated custodian balances or counterparty
            exposures, so no concentration percentages are estimated.
          </Unavailable>
          <a
            href="https://docs.ethena.fi/backing-custody-and-security/overview/off-exchange-settlement-in-detail"
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            How custody and settlement work ↗
          </a>
        </Panel>
      </div>
      <Panel
        title="The risks, in everyday language"
        eyebrow="NO SINGLE NUMBER TELLS THE WHOLE STORY"
      >
        <p className="body-copy">
          These are categories to understand, not a current safety rating.
          Missing exposure data means we cannot assess current severity.
        </p>
        <div className="risk-grid">
          {risks.map((risk, index) => (
            <details key={risk.title} className="risk-card">
              <summary>
                <span className="risk-number">0{index + 1}</span>
                <div>
                  <b>{risk.title}</b>
                  <small>{risk.question}</small>
                </div>
                <span className="plus">+</span>
              </summary>
              <p>{risk.copy}</p>
            </details>
          ))}
        </div>
        <a
          className="text-link"
          href="https://docs.ethena.fi/resources/general-risk-disclosures"
          target="_blank"
          rel="noreferrer"
        >
          Read the official risk disclosures ↗
        </a>
      </Panel>
      <div className="plain-summary">
        <span className="summary-icon">i</span>
        <div>
          <h3>Backing and easy access are different things</h3>
          <p>
            Even if reported assets cover the issued supply, custody,
            settlement, market liquidity, and redemption restrictions can still
            affect how people exit. A ratio is one observation, not a guarantee.
          </p>
        </div>
      </div>
    </>
  );
}
