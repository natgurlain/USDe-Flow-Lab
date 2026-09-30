import { CircleDollarSign, Layers, Vote } from "lucide-react";
export function TokenGuide() {
  return (
    <div className="token-guide">
      {[
        {
          name: "USDe",
          category: "The dollar",
          icon: CircleDollarSign,
          copy: "A synthetic dollar designed to track $1. Holding it alone does not automatically earn staking rewards.",
        },
        {
          name: "sUSDe",
          category: "The staked dollar",
          icon: Layers,
          copy: "Stake USDe to receive sUSDe. Protocol rewards can increase the USDe value of each share. Yield varies.",
        },
        {
          name: "ENA",
          category: "The governance token",
          icon: Vote,
          copy: "A token for Ethena governance. Its market price can move independently of USDe; holding it is not company ownership.",
        },
      ].map(({ name, category, icon: Icon, copy }) => (
        <article key={name} className="token-card">
          <div className="token-top">
            <Icon size={22} strokeWidth={1.5} />
            <span>{category}</span>
          </div>
          <h3>{name}</h3>
          <p>{copy}</p>
        </article>
      ))}
    </div>
  );
}
