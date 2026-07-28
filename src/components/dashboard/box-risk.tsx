"use client";

import { useMemo, useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { cn } from "@/lib/utils";
import { computeRiskFlags } from "@/lib/risk-verdict-engine";

export function BoxRisk({ stock }: { stock: Stock }) {
  const [expanded, setExpanded] = useState(false);
  const riskFlags = useMemo(() => computeRiskFlags(stock), [stock]);
  const activeCount = riskFlags.filter((r) => r.severity !== "low").length;
  const counts = { high: 0, med: 0, low: 0 };
  for (const r of riskFlags) counts[r.severity]++;

  return (
    <>
      <Panel
        title="Risk & Alert Flags"
        tag={`${activeCount} Active`}
        tagClassName={cn(activeCount > 0 ? "bg-neg-dim text-neg" : "bg-pos-dim text-pos")}
        className="shrink-0 lg:max-h-[20%]"
        onExpand={() => setExpanded(true)}
      >
        {riskFlags.map((r) => (
          <div key={r.id} className="flex items-start gap-1.5 border-b border-[#F0F1F3] py-1.5 last:border-b-0">
            <span
              className={cn(
                "mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full",
                r.severity === "high" ? "bg-neg" : r.severity === "med" ? "bg-amber" : "bg-pos"
              )}
            />
            <span className="text-[10.5px] leading-snug">
              <b className="font-bold">{r.title}</b> — {r.detail}
            </span>
          </div>
        ))}
      </Panel>

      <TableModal open={expanded} onOpenChange={setExpanded} title="Risk & Alert Flags" subtitle={`${stock.symbol} · ${stock.name}`}>
        <div className="mb-4 grid grid-cols-3 gap-px overflow-hidden rounded-[3px] border border-border bg-border">
          <SeverityStat label="High" value={counts.high} color="text-neg" />
          <SeverityStat label="Medium" value={counts.med} color="text-[#B57500]" />
          <SeverityStat label="Low" value={counts.low} color="text-pos" />
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-16 border-b border-border py-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Severity</th>
              <th className="border-b border-border py-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Risk</th>
              <th className="w-14 border-b border-border py-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Probability</th>
              <th className="w-14 border-b border-border py-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Impact</th>
            </tr>
          </thead>
          <tbody>
            {riskFlags.map((r) => (
              <tr key={r.id}>
                <td className="border-b border-[#F0F1F3] py-2 align-top">
                  <span
                    className={cn(
                      "inline-block rounded-[2px] px-1.5 py-px text-[8.5px] font-extrabold uppercase",
                      r.severity === "high" && "bg-neg-dim text-neg",
                      r.severity === "med" && "bg-amber-dim text-[#B57500]",
                      r.severity === "low" && "bg-pos-dim text-pos"
                    )}
                  >
                    {r.severity}
                  </span>
                </td>
                <td className="border-b border-[#F0F1F3] py-2 text-[11px] leading-snug">
                  <b className="font-bold">{r.title}</b>
                  <div className="mt-0.5 text-text2">{r.detail}</div>
                </td>
                <td className="border-b border-[#F0F1F3] py-2 align-top text-[10px] capitalize text-text2">{r.probability}</td>
                <td className="border-b border-[#F0F1F3] py-2 align-top text-[10px] capitalize text-text2">{r.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 text-[9px] text-text3">
          Rule-based: pledge %, leverage (D/E), DMA position, RSI, broker sell pressure, peer valuation premium, and COMPLIANCE-tagged news each contribute a flag. No AI-generated risk claims.
        </div>
      </TableModal>
    </>
  );
}

function SeverityStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card px-2.5 py-2 text-center">
      <div className="mb-0.5 text-[9px] uppercase tracking-wide text-text2">{label}</div>
      <div className={cn("tnum text-[18px] font-extrabold", color)}>{value}</div>
    </div>
  );
}
