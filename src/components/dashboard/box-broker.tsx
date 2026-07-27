"use client";

import { useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";

export function BoxBroker({ stock }: { stock: Stock }) {
  const [expanded, setExpanded] = useState(false);
  const counts = { buy: 0, hold: 0, sell: 0 };
  for (const c of stock.brokerCalls) counts[c.rating]++;
  const avgTarget = stock.brokerCalls.length
    ? Math.round(stock.brokerCalls.reduce((s, c) => s + c.target, 0) / stock.brokerCalls.length)
    : 0;
  const avgUpside = avgTarget ? ((avgTarget - stock.cmp) / stock.cmp) * 100 : 0;

  return (
    <>
      <Panel title="Broker Consensus" className="shrink-0 lg:max-h-[19%]" onExpand={() => setExpanded(true)} noBodyPad>
        {stock.brokerCalls.length === 0 ? (
          <div className="flex h-16 items-center justify-center text-[10.5px] text-text3">No broker coverage.</div>
        ) : (
          <>
            <BrokerTable stock={stock} compact />
            <ConsensusStrip counts={counts} avgTarget={avgTarget} avgUpside={avgUpside} count={stock.brokerCalls.length} />
          </>
        )}
      </Panel>

      <TableModal
        open={expanded}
        onOpenChange={setExpanded}
        title="Broker Consensus"
        subtitle={`${stock.symbol} · ${stock.name} · CMP ₹${fmtInt(stock.cmp)}`}
      >
        <div className="mb-4 grid grid-cols-3 gap-px overflow-hidden rounded-[3px] border border-border bg-border">
          <ModalStat label="Buy" value={String(counts.buy)} color="text-pos" />
          <ModalStat label="Hold" value={String(counts.hold)} color="text-[#B57500]" />
          <ModalStat label="Sell" value={String(counts.sell)} color="text-neg" />
        </div>
        <BrokerTable stock={stock} />
        <div className="mt-3 flex items-center justify-between rounded-[3px] border border-border bg-background px-3 py-2 text-[11px]">
          <span>
            Consensus ({stock.brokerCalls.length} analysts): <b>{counts.buy} Buy · {counts.hold} Hold · {counts.sell} Sell</b>
          </span>
          <span>
            Avg Target <b className={cn("tnum", avgUpside >= 0 ? "text-pos" : "text-neg")}>₹{fmtInt(avgTarget)}</b>{" "}
            <span className={cn("tnum", avgUpside >= 0 ? "text-pos" : "text-neg")}>
              ({avgUpside >= 0 ? "+" : ""}
              {avgUpside.toFixed(1)}%)
            </span>
          </span>
        </div>
      </TableModal>
    </>
  );
}

function BrokerTable({ stock, compact = false }: { stock: Stock; compact?: boolean }) {
  return (
    <table className="w-full border-collapse px-2.5">
      <thead>
        <tr>
          <th
            className={cn(
              "border-b border-border py-1 pl-2.5 text-left font-bold uppercase tracking-wide text-text3",
              compact ? "text-[8.5px]" : "text-[9px]"
            )}
          >
            Brokerage
          </th>
          <th className={cn("border-b border-border py-1 text-left font-bold uppercase tracking-wide text-text3", compact ? "text-[8.5px]" : "text-[9px]")}>
            Rating
          </th>
          <th
            className={cn(
              "border-b border-border py-1 pr-2.5 text-right font-bold uppercase tracking-wide text-text3",
              compact ? "text-[8.5px]" : "text-[9px]"
            )}
          >
            Target
          </th>
          {!compact && (
            <th className="border-b border-border py-1 pr-2.5 text-right text-[9px] font-bold uppercase tracking-wide text-text3">
              Upside
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {stock.brokerCalls.map((c) => {
          const upside = ((c.target - stock.cmp) / stock.cmp) * 100;
          return (
            <tr key={c.brokerage}>
              <td className={cn("border-b border-[#F0F1F3] pl-2.5", compact ? "py-[3.5px] text-[10px]" : "py-[6px] text-[11px] font-medium")}>
                {c.brokerage}
              </td>
              <td className={cn("border-b border-[#F0F1F3]", compact ? "py-[3.5px] text-[10px]" : "py-[6px] text-[11px]")}>
                <span
                  className={cn(
                    "rounded-[2px] px-1.5 py-px font-extrabold uppercase",
                    compact ? "text-[8.5px]" : "text-[9px]",
                    c.rating === "buy" && "bg-pos-dim text-pos",
                    c.rating === "hold" && "bg-amber-dim text-[#B57500]",
                    c.rating === "sell" && "bg-neg-dim text-neg"
                  )}
                >
                  {c.rating}
                </span>
              </td>
              <td className={cn("tnum border-b border-[#F0F1F3] pr-2.5 text-right font-semibold", compact ? "py-[3.5px] text-[10px]" : "py-[6px] text-[11px]")}>
                {fmtInt(c.target)}
              </td>
              {!compact && (
                <td
                  className={cn(
                    "tnum border-b border-[#F0F1F3] py-[6px] pr-2.5 text-right text-[11px] font-bold",
                    upside >= 0 ? "text-pos" : "text-neg"
                  )}
                >
                  {upside >= 0 ? "+" : ""}
                  {upside.toFixed(1)}%
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ConsensusStrip({
  counts,
  avgTarget,
  avgUpside,
  count,
}: {
  counts: { buy: number; hold: number; sell: number };
  avgTarget: number;
  avgUpside: number;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border bg-background px-2.5 py-1.5 text-[10px]">
      <span>
        Consensus ({count} analysts):{" "}
        <b>
          {counts.buy} Buy · {counts.hold} Hold · {counts.sell} Sell
        </b>
      </span>
      <span>
        Avg TP <b className={cn("tnum", avgUpside >= 0 ? "text-pos" : "text-neg")}>₹{fmtInt(avgTarget)}</b>
      </span>
    </div>
  );
}

function ModalStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-card px-2.5 py-2 text-center">
      <div className="mb-0.5 text-[9px] uppercase tracking-wide text-text2">{label}</div>
      <div className={cn("tnum text-[18px] font-extrabold", color)}>{value}</div>
    </div>
  );
}
