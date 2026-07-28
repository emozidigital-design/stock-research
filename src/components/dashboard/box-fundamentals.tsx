"use client";

import { useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { fmtInt } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BoxFundamentals({ stock }: { stock: Stock }) {
  const [expanded, setExpanded] = useState(false);

  if (stock.quarters.length === 0) {
    return (
      <Panel title="Fundamentals · Last 4Q">
        <div className="flex h-full items-center justify-center text-center text-[10.5px] text-text3">
          No quarterly data available.
        </div>
      </Panel>
    );
  }

  const pats = stock.quarters.map((q) => q.pat);
  const minPat = Math.min(...pats);
  const maxPat = Math.max(...pats);
  const range = maxPat - minPat || 1;

  return (
    <>
      <Panel title="Fundamentals · Last 4Q" onExpand={() => setExpanded(true)}>
        <div className="mb-1.5 flex h-9 items-end gap-[3px]">
          {stock.quarters.map((q) => {
            // Scaled to the quarter-over-quarter range (not zero-based) so
            // modest QoQ swings stay visually readable at this bar height.
            const heightPct = 25 + ((q.pat - minPat) / range) * 75;
            return (
              <div
                key={q.label}
                title={`${q.label}: PAT ₹${fmtInt(q.pat)} Cr`}
                className={`flex-1 rounded-t-[1px] ${q.pat >= 0 ? "bg-primary/85" : "bg-neg"}`}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>
        <FundTable stock={stock} />
      </Panel>

      <TableModal
        open={expanded}
        onOpenChange={setExpanded}
        title="Fundamentals · Quarterly Trend"
        subtitle={`${stock.symbol} · ${stock.name}`}
      >
        <div className="mb-4 flex h-24 gap-2">
          {stock.quarters.map((q) => {
            const heightPct = 20 + ((q.pat - minPat) / range) * 80;
            return (
              <div key={q.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div
                  title={`${q.label}: PAT ₹${fmtInt(q.pat)} Cr`}
                  className={cn("w-full rounded-t-[2px]", q.pat >= 0 ? "bg-primary/85" : "bg-neg")}
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-[9px] font-semibold text-text3">{q.label}</span>
              </div>
            );
          })}
        </div>
        <FundTable stock={stock} withGrowth />
      </TableModal>
    </>
  );
}

function FundTable({ stock, withGrowth = false }: { stock: Stock; withGrowth?: boolean }) {
  const hasEbitda = stock.quarters[0].ebitda > 0;
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="border-b border-border py-[2px] pr-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">
            ₹ Cr
          </th>
          {stock.quarters.map((q) => (
            <th
              key={q.label}
              className="border-b border-border py-[2px] pl-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3"
            >
              {q.label}
            </th>
          ))}
          {withGrowth && (
            <th className="border-b border-border py-[2px] pl-2 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">
              QoQ (latest)
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        <FundRow
          label="Revenue"
          values={stock.quarters.map((q) => fmtInt(q.revenue))}
          growth={withGrowth ? qoq(stock.quarters.map((q) => q.revenue)) : undefined}
        />
        {hasEbitda && (
          <FundRow
            label="EBITDA"
            values={stock.quarters.map((q) => fmtInt(q.ebitda))}
            growth={withGrowth ? qoq(stock.quarters.map((q) => q.ebitda)) : undefined}
          />
        )}
        <FundRow
          label="PAT"
          values={stock.quarters.map((q) => fmtInt(q.pat))}
          growth={withGrowth ? qoq(stock.quarters.map((q) => q.pat)) : undefined}
        />
        <FundRow
          label="EPS (₹)"
          values={stock.quarters.map((q) => q.eps.toFixed(1))}
          growth={withGrowth ? qoq(stock.quarters.map((q) => q.eps)) : undefined}
          last
        />
      </tbody>
    </table>
  );
}

function qoq(values: number[]): number | null {
  const a = values.at(-2);
  const b = values.at(-1);
  if (a === undefined || b === undefined || a === 0) return null;
  return ((b - a) / Math.abs(a)) * 100;
}

function FundRow({
  label,
  values,
  growth,
  last = false,
}: {
  label: string;
  values: string[];
  growth?: number | null;
  last?: boolean;
}) {
  return (
    <tr>
      <td className={`py-[3px] pr-1 text-[10.5px] font-semibold text-text2 ${last ? "" : "border-b border-[#F0F1F3]"}`}>
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`tnum py-[3px] pl-1 text-right text-[10.5px] font-semibold ${last ? "" : "border-b border-[#F0F1F3]"}`}
        >
          {v}
        </td>
      ))}
      {growth !== undefined && (
        <td
          className={cn(
            "tnum py-[3px] pl-2 text-right text-[10.5px] font-bold",
            last ? "" : "border-b border-[#F0F1F3]",
            growth === null ? "text-text3" : growth >= 0 ? "text-pos" : "text-neg"
          )}
        >
          {growth === null ? "—" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
        </td>
      )}
    </tr>
  );
}
