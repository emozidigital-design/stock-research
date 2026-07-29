"use client";

import { useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { cn } from "@/lib/utils";
import { fmtDateShort, fmtInt } from "@/lib/format";

const TABS = ["Shareholding", "Bulk/Block"] as const;

export function BoxOwnership({ stock }: { stock: Stock }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Shareholding");
  const [expanded, setExpanded] = useState(false);
  const latest = stock.ownershipTrend.at(-1);

  if (!latest) {
    return (
      <Panel title="Ownership & Corporate Actions">
        <div className="flex h-full items-center justify-center text-center text-[10.5px] text-text3">
          No ownership data available.
        </div>
      </Panel>
    );
  }

  const prev = stock.ownershipTrend.at(-3) ?? latest;
  const fiiDelta = +(latest.fii - prev.fii).toFixed(1);
  const diiDelta = +(latest.dii - prev.dii).toFixed(1);

  return (
    <>
      <Panel
        title={
          <div className="flex gap-2.5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  setTab(t);
                }}
                className={cn(
                  "uppercase tracking-wide",
                  tab === t ? "text-primary" : "text-text2 hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        }
        onExpand={() => setExpanded(true)}
      >
        {tab === "Shareholding" ? (
          <div className="flex h-full flex-col justify-center gap-2">
            <OwnershipBar q={latest} />
            <Legend />
            <div className="text-center text-[9px] text-text3">
              Promoter pledge: <b className="tnum text-foreground">{stock.promoterPledge.toFixed(1)}%</b> · FII 3Q trend:{" "}
              <DeltaBadge value={fiiDelta} /> · DII: <DeltaBadge value={diiDelta} />
            </div>
          </div>
        ) : stock.bulkDeals.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[10.5px] text-text3">
            No bulk/block deals in the last 30 days.
          </div>
        ) : (
          <BulkDealsTable stock={stock} />
        )}
      </Panel>

      <TableModal
        open={expanded}
        onOpenChange={setExpanded}
        title="Ownership · Shareholding & Bulk Deals"
        subtitle={`${stock.symbol} · ${stock.name}`}
      >
        <div className="mb-5">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text2">Current Split</div>
          <div className="mb-2">
            <OwnershipBar q={latest} large />
          </div>
          <Legend />
        </div>

        <div className="mb-5">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text2">3-Quarter Trend</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-border py-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Quarter</th>
                <th className="border-b border-border py-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">Promoter</th>
                <th className="border-b border-border py-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">FII</th>
                <th className="border-b border-border py-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">DII</th>
                <th className="border-b border-border py-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">Retail/Other</th>
              </tr>
            </thead>
            <tbody>
              {stock.ownershipTrend.map((q) => (
                <tr key={q.label}>
                  <td className="border-b border-[#F0F1F3] py-[5px] text-[10.5px] font-semibold text-text2">{q.label}</td>
                  <td className="tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px] font-bold">{q.promoter.toFixed(1)}%</td>
                  <td className="tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px] font-bold">{q.fii.toFixed(1)}%</td>
                  <td className="tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px] font-bold">{q.dii.toFixed(1)}%</td>
                  <td className="tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px] font-bold">{q.retail.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex gap-4 text-[10px] text-text2">
            <span>
              Promoter Pledge: <b className="tnum text-foreground">{stock.promoterPledge.toFixed(1)}%</b>
            </span>
            <span>
              FII 3Q trend: <DeltaBadge value={fiiDelta} />
            </span>
            <span>
              DII 3Q trend: <DeltaBadge value={diiDelta} />
            </span>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text2">Bulk / Block Deals</div>
          {stock.bulkDeals.length === 0 ? (
            <div className="py-3 text-center text-[10.5px] text-text3">No bulk/block deals in the last 30 days.</div>
          ) : (
            <BulkDealsTable stock={stock} />
          )}
        </div>
      </TableModal>
    </>
  );
}

function OwnershipBar({ q, large = false }: { q: Stock["ownershipTrend"][number]; large?: boolean }) {
  return (
    <div className={cn("flex overflow-hidden rounded-[2px] border border-border", large ? "h-7" : "h-[22px]")}>
      <Seg pct={q.promoter} color="#1A56DB" />
      <Seg pct={q.fii} color="#0F9D58" />
      <Seg pct={q.dii} color="#F2A600" />
      <Seg pct={q.retail} color="#9AA1AC" />
    </div>
  );
}

function BulkDealsTable({ stock }: { stock: Stock }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="border-b border-border pb-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Date</th>
          <th className="border-b border-border pb-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Party</th>
          <th className="border-b border-border pb-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Type</th>
          <th className="border-b border-border pb-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">Qty</th>
          <th className="border-b border-border pb-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">Price</th>
        </tr>
      </thead>
      <tbody>
        {stock.bulkDeals.map((d, i) => (
          <tr key={i}>
            <td className="border-b border-[#F0F1F3] py-[5px] text-[10.5px] text-text2">{fmtDateShort(d.date)}</td>
            <td className="border-b border-[#F0F1F3] py-[5px] text-[10.5px] font-semibold">{d.party}</td>
            <td className={cn("border-b border-[#F0F1F3] py-[5px] text-[10.5px] font-bold", d.type === "Buy" ? "text-pos" : "text-neg")}>
              {d.type}
            </td>
            <td className="tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px]">{fmtInt(d.quantity)}</td>
            <td className="tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px]">{fmtInt(d.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Seg({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      className="tnum flex items-center justify-center text-[9px] font-extrabold text-white"
      style={{ width: `${pct}%`, backgroundColor: color }}
    >
      {pct >= 6 ? `${pct.toFixed(1)}%` : ""}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1">
      <LegendItem color="#1A56DB" label="Promoter" />
      <LegendItem color="#0F9D58" label="FII" />
      <LegendItem color="#F2A600" label="DII" />
      <LegendItem color="#9AA1AC" label="Retail/Other" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[9.5px]">
      <i className="inline-block h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function DeltaBadge({ value }: { value: number }) {
  return (
    <b className={value >= 0 ? "text-pos" : "text-neg"}>
      {value >= 0 ? "▲" : "▼"} {value >= 0 ? "+" : ""}
      {value}pp
    </b>
  );
}
