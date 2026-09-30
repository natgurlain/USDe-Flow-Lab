import { Panel } from "./primitives";
import { TokenGuide } from "./overview-view";
const lessons = [
  {
    q: "What is Ethena?",
    a: "Ethena is a protocol behind USDe, a synthetic dollar designed to track the US dollar. It combines backing assets with financial hedges rather than relying only on cash held in a bank.",
    url: "https://docs.ethena.fi/",
  },
  {
    q: "Why does USDe aim to stay at $1?",
    a: "Eligible counterparties can create and redeem USDe using backing assets. These mechanisms can help bring market prices toward the dollar target, but fees, market conditions, and operational restrictions matter. The market price can still move away from $1.",
    url: "https://docs.ethena.fi/video-guides/how-to-buy-usde",
  },
  {
    q: "How are USDe and sUSDe different?",
    a: "USDe is the dollar token. Staking USDe gives you sUSDe shares. Rewards can raise the USDe value represented by each share. Holding ordinary USDe alone does not automatically earn those staking rewards.",
    url: "https://docs.ethena.fi/video-guides/how-to-stake-usde",
  },
  {
    q: "Where does yield come from?",
    a: "Protocol income can include hedging-related income and rewards or interest on eligible backing assets. Some income is distributed to the staking vault. The rate varies with market conditions and distribution decisions.",
    url: "https://docs.ethena.fi/resources/faq",
  },
  {
    q: "How do people exit?",
    a: "People can sell tokens on secondary markets at the available price. Eligible sUSDe holders can use the unstaking process, which may include a cooldown. Direct USDe minting and redemption is restricted to approved counterparties. Check current official rules and availability.",
    url: "https://docs.ethena.fi/video-guides/how-to-buy-usde",
  },
  {
    q: "What does ENA do?",
    a: "ENA is Ethena’s governance token, with its own market price and governance arrangements. It is different from USDe and sUSDe. Holding ENA does not make you a shareholder or automatically entitle you to protocol revenue.",
    url: "https://gov.ethenafoundation.com/",
  },
  {
    q: "What could go wrong?",
    a: "Hedging costs, backing assets, custodians, trading counterparties, contracts, and market liquidity can all affect the system. USDe’s dollar target and sUSDe’s yield do not eliminate the possibility of losses.",
    url: "https://docs.ethena.fi/resources/general-risk-disclosures",
  },
];
export default function LearnView() {
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">START WITH THE BASICS</p>
        <h1>
          You don’t need to be
          <br />a crypto expert.
        </h1>
        <p>
          A few simple ideas make the dashboard much easier to read. Open any
          question below for a short explanation and its official source.
        </p>
      </div>
      <TokenGuide />
      <Panel title="Seven questions, clear answers" eyebrow="A QUICK GUIDE">
        <div className="lesson-list">
          {lessons.map((lesson, index) => (
            <details key={lesson.q} className="learn-detail" open={index === 0}>
              <summary>
                <span className="lesson-number">0{index + 1}</span>
                {lesson.q}
                <span className="plus">+</span>
              </summary>
              <p>{lesson.a}</p>
              <a
                href={lesson.url}
                className="text-link"
                target="_blank"
                rel="noreferrer"
              >
                Read the official source ↗
              </a>
            </details>
          ))}
        </div>
      </Panel>
      <Panel title="A small glossary" eyebrow="WORDS YOU’LL SEE HERE">
        <dl className="glossary">
          {[
            ["Peg", "The target price—in USDe’s case, one dollar."],
            ["Mint", "Create new USDe through the approved issuance process."],
            [
              "Redeem",
              "Return USDe through the approved process in exchange for backing assets.",
            ],
            ["Staking", "Deposit USDe into a vault and receive sUSDe shares."],
            [
              "APY",
              "An annual yield figure including an assumed compounding convention.",
            ],
            ["APR", "An annual rate before compounding; it differs from APY."],
            [
              "Hedge",
              "A position intended to offset some risk from another position.",
            ],
            [
              "Reserve",
              "A financial buffer; it is not the same as a guarantee.",
            ],
            [
              "Cooldown",
              "A waiting period that may apply between requesting an unstake and withdrawing.",
            ],
            [
              "Attestation",
              "A report about specified assets or balances at a particular time, within a stated scope.",
            ],
          ].map(([term, definition]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </>
  );
}
