"use client";

import { useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { fmtInt } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BoxFo({ stock }: { stock: Stock }) {
  const [expanded, setExpanded] = useState(false);

  if (!stock.isFo) {
    return (
      <Panel title="F&O · Options Chain Summary">
        <div className="flex h-full items-center justify-center text-center text-[10.5px] text-text3">
          Not F&O-eligible
        </div>
      </Panel>
    );
  }

  const maxOi = Math.max(...stock.oiChain.flatMap((p) => [p.callOi, p.putOi]), 1);

  return (
    <>
      <Panel title="F&O · Options Chain Summary" tag="EOD" onExpand={() => setExpanded(true)}>
        <div className="flex h-full flex-col gap-1">
          <div className="flex justify-center gap-2.5 text-[9px] text-text2">
            <span className="flex items-center gap-[3px]">
              <i className="inline-block h-[7px] w-[7px] rounded-[1px] bg-neg/75" />
              Call OI
            </span>
            <span className="flex items-center gap-[3px]">
              <i className="inline-block h-[7px] w-[7px] rounded-[1px] bg-pos/75" />
              Put OI
            </span>
          </div>
          <div className="flex flex-1 items-end gap-[2px] pt-1">
            {stock.oiChain.map((p) => (
              <div key={p.strike} title={`Strike ${p.strike}`} className="flex h-full flex-1 items-end gap-px">
                <div
                  className="flex-1 rounded-t-[1px] bg-neg/75"
                  style={{ height: `${(p.callOi / maxOi) * 100}%` }}
                />
                <div
                  className="flex-1 rounded-t-[1px] bg-pos/75"
                  style={{ height: `${(p.putOi / maxOi) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <FoStat label="PCR" value={stock.pcr.toFixed(2)} />
            <FoStat label="Max Pain" value={fmtInt(stock.maxPain)} />
            <FoStat label="IV Pctile" value={`${stock.ivPercentile}%`} />
          </div>
        </div>
      </Panel>

      <TableModal
        open={expanded}
        onOpenChange={setExpanded}
        title="F&O · Options Chain Summary"
        subtitle={`${stock.symbol} · ${stock.name}`}
        tag="EOD"
      >
        <div className="mb-4 grid grid-cols-3 gap-px overflow-hidden rounded-[3px] border border-border bg-border">
          <ModalStat label="PCR" value={stock.pcr.toFixed(2)} highlight={stock.pcr >= 1 ? "pos" : "neg"} />
          <ModalStat label="Max Pain" value={`₹${fmtInt(stock.maxPain)}`} />
          <ModalStat label="IV Percentile" value={`${stock.ivPercentile}%`} highlight={stock.ivPercentile >= 60 ? "amber" : undefined} />
        </div>

        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-text2">Strike-wise Open Interest</span>
          <div className="flex gap-3 text-[9px] text-text2">
            <span className="flex items-center gap-1">
              <i className="inline-block h-[7px] w-[7px] rounded-[1px] bg-neg/75" /> Call OI
            </span>
            <span className="flex items-center gap-1">
              <i className="inline-block h-[7px] w-[7px] rounded-[1px] bg-pos/75" /> Put OI
            </span>
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-border py-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Strike</th>
              <th className="border-b border-border py-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">Call OI</th>
              <th className="border-b border-border py-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">Put OI</th>
              <th className="border-b border-border py-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">Strike PCR</th>
              <th className="border-b border-border py-1 pl-3 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">OI Distribution</th>
            </tr>
          </thead>
          <tbody>
            {stock.oiChain.map((p) => {
              const strikePcr = p.callOi > 0 ? p.putOi / p.callOi : 0;
              const isMaxPain = p.strike === stock.maxPain;
              return (
                <tr key={p.strike} className={isMaxPain ? "bg-amber-dim" : undefined}>
                  <td className="tnum border-b border-[#F0F1F3] py-[5px] text-[10.5px] font-bold">
                    {fmtInt(p.strike)}
                    {isMaxPain && <span className="ml-1 text-[8px] font-bold uppercase text-[#B57500]">Max Pain</span>}
                  </td>
                  <td className="tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px]">{p.callOi}</td>
                  <td className="tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px]">{p.putOi}</td>
                  <td
                    className={cn(
                      "tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px] font-bold",
                      strikePcr >= 1 ? "text-pos" : "text-neg"
                    )}
                  >
                    {strikePcr.toFixed(2)}
                  </td>
                  <td className="border-b border-[#F0F1F3] py-[5px] pl-3">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-[2px] bg-background">
                      <div
                        className="bg-neg/75"
                        style={{ width: `${(p.callOi / (p.callOi + p.putOi)) * 100}%` }}
                      />
                      <div
                        className="bg-pos/75"
                        style={{ width: `${(p.putOi / (p.callOi + p.putOi)) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableModal>
    </>
  );
}

function FoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-[3px] border border-border bg-background px-1.5 py-1 text-center">
      <div className="text-[8px] uppercase tracking-wide text-text3">{label}</div>
      <div className="tnum text-[12px] font-extrabold">{value}</div>
    </div>
  );
}

function ModalStat({ label, value, highlight }: { label: string; value: string; highlight?: "pos" | "neg" | "amber" }) {
  return (
    <div className="bg-card px-2.5 py-2 text-center">
      <div className="mb-0.5 text-[9px] uppercase tracking-wide text-text2">{label}</div>
      <div
        className={cn(
          "tnum text-[16px] font-extrabold",
          highlight === "pos" && "text-pos",
          highlight === "neg" && "text-neg",
          highlight === "amber" && "text-[#B57500]"
        )}
      >
        {value}
      </div>
    </div>
  );
}
