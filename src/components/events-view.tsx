"use client";

import { CalendarDays, CircleAlert, Info } from "lucide-react";
import { SupplyChart } from "@/components/charts";
import { DataBadge, Panel } from "@/components/primitives";
import { formatDate } from "@/lib/format";
import type { DashboardSnapshot } from "@/lib/types";

const kindLabels: Record<string, string> = {
  market: "Market shock",
  redemption: "Redemption window",
  maturity: "PT maturity",
  fee: "Fee schedule",
  collateral: "Collateral",
};

export default function EventsView({ data }: { data: DashboardSnapshot }) {
  const events = [...data.events].sort((left, right) => left.date.localeCompare(right.date));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">EVENT LAYER</div>
          <h1>Events around the tape</h1>
          <p>Event markers add context to supply moves; they do not establish causation.</p>
        </div>
        <DataBadge status="simulated" label="LABELS NEED VERIFICATION" />
      </div>

      <Panel title="Supply with event markers" eyebrow="ALL AVAILABLE HISTORY">
        <div className="panel-source-line">
          <span>Dashed markers show event windows from the illustrative archive.</span>
          <span className="panel-meta">Tap or focus an event below for the two-sentence note.</span>
        </div>
        <SupplyChart
          data={data.supplyPoints}
          events={data.events}
          range="all"
          showStaking={data.sources.supply.status !== "live"}
        />
        <div className="chart-legend">
          <span><i className="legend-line supply-line" />Circulating supply</span>
          {data.sources.supply.status !== "live" && <span><i className="legend-line mint-line" />sUSDe supply · estimated overlay</span>}
          <span><i className="legend-line event-line" />Event marker</span>
        </div>
      </Panel>

      <Panel title="Event register" eyebrow="TIMING + CONTEXT">
        <div className="event-list">
          {events.map((event) => (
            <details className="event-row" key={event.id}>
              <summary>
                <span className={"event-icon " + event.kind}>
                  {event.verification === "source-required" ? <CircleAlert size={15} /> : <CalendarDays size={15} />}
                </span>
                <span className="event-date">{formatDate(event.date)}{event.endDate ? " – " + formatDate(event.endDate) : ""}</span>
                <span className="event-title">{event.title}</span>
                <span className="event-type">{kindLabels[event.kind]}</span>
                <span className={"verification-tag " + event.verification}>
                  {event.verification === "source-required" ? "Source required" : "Illustrative"}
                </span>
                <span className="event-chevron">+</span>
              </summary>
              <p>{event.summary}</p>
            </details>
          ))}
        </div>
      </Panel>

      <div className="event-disclaimer">
        <Info size={15} />
        <p>
          The Oct 2025 liquidation and Apr 2026 rsETH/PT labels follow the supplied research brief.
          Mock data does not verify the event, its exact window, or its effect on USDe redemptions.
        </p>
      </div>
    </>
  );
}
