import type { DashboardSnapshot } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { SourceLine, Unavailable } from "./primitives";

const colors = [
  "#b9d2ff",
  "#8eafd8",
  "#c7bffa",
  "#7896bc",
  "#e0e7f3",
  "#9b94c9",
  "#6880a5",
  "#abb8d0",
];

export function BackingAllocation({ data }: { data: DashboardSnapshot }) {
  const composition = data.composition;
  const total =
    composition?.items.reduce((sum, item) => sum + item.value, 0) ?? 0;
  if (!composition || total <= 0)
    return (
      <Unavailable
        title="Current allocation could not update"
        href="https://app.ethena.fi/dashboards/transparency"
      >
        Aligned, dated issuer category observations are required. Missing
        categories are not estimated.
      </Unavailable>
    );
  return (
    <>
      <div className="allocation-bar" aria-hidden="true">
        {composition.items.map((item, index) => (
          <span
            key={item.name}
            style={{
              width: `${(item.value / total) * 100}%`,
              background: colors[index % colors.length],
            }}
          />
        ))}
      </div>
      <div className="allocation-table-wrap">
        <table className="allocation-table">
          <caption>
            Issuer backing categories · {composition.observedAt.slice(0, 10)}{" "}
            UTC
          </caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Value</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {composition.items.map((item, index) => (
              <tr key={item.name}>
                <th scope="row">
                  <span
                    className="allocation-dot"
                    aria-hidden="true"
                    style={{ background: colors[index % colors.length] }}
                  />
                  {item.name}
                </th>
                <td>{formatMoney(item.value)}</td>
                <td>{((item.value / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small-copy">
        Shares use the aligned category subtotal ({formatMoney(total)}). The
        date and scope may differ from the backing coverage report; these
        amounts are not added to that total. Category names are the issuer’s
        labels.
      </p>
      <SourceLine
        metric={{
          ...data.metrics.backing,
          value: total,
          status: composition.status,
          observedAt: composition.observedAt,
          fetchedAt: composition.fetchedAt,
          unit: "USD",
          methodology:
            "Latest timestamp present in every issuer backing category; each share is its category value divided by the category subtotal. The separate reserve report is not added.",
          coverage: "Issuer-reported backing categories",
          maxAgeHours: 24,
        }}
        expanded
      />
    </>
  );
}
