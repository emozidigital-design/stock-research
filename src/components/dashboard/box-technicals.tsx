"use client";

import { useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";

export function BoxTechnicals({ stock }: { stock: Stock }) {
  const [expanded, setExpanded] = useState(false);
  const rsiColor = stock.rsi14 >= 70 ? "#D93025" : stock.rsi14 <= 30 ? "#D93025" : "#0F9D58";
  const rsiZone = stock.rsi14 >= 70 ? "Overbought" : stock.rsi14 <= 30 ? "Oversold" : "Neutral";

  return (
    <>
      <Panel title="Technicals" onExpand={() => setExpanded(true)}>
        <div className="flex h-full gap-2">
          <RsiGauge value={stock.rsi14} color={rsiColor} />
          <div className="flex flex-1 flex-col justify-center gap-[3px]">
            {stock.resistance.slice().reverse().map((r, i) => (
              <SrRow key={`res-${i}`} label={`Resistance ${stock.resistance.length - i}`} value={r} color="var(--neg)" />
            ))}
            {stock.support.map((s, i) => (
              <SrRow key={`sup-${i}`} label={`Support ${i + 1}`} value={s} color="var(--pos)" />
            ))}
            <div className="mt-1 flex flex-wrap gap-1">
              <DmaChip label="20D" above={stock.above20dma} />
              <DmaChip label="50D" above={stock.above50dma} />
              <DmaChip label="200D" above={stock.above200dma} />
            </div>
          </div>
        </div>
      </Panel>

      <TableModal open={expanded} onOpenChange={setExpanded} title="Technicals" subtitle={`${stock.symbol} · ${stock.name}`}>
        <div className="mb-5 flex items-center gap-6">
          <RsiGauge value={stock.rsi14} color={rsiColor} large />
          <div className="flex-1">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-text2">Momentum Read</div>
            <div className="text-[11px] leading-relaxed text-text2">
              RSI(14) at <b className="tnum text-foreground">{stock.rsi14.toFixed(1)}</b> — zone:{" "}
              <b style={{ color: rsiColor }}>{rsiZone}</b>. 52W range: {fmtInt(stock.week52Low)} – {fmtInt(stock.week52High)}, CMP is{" "}
              <b className="tnum">{(((stock.cmp - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100).toFixed(0)}%</b> through the
              52-week band.
            </div>
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text2">Support & Resistance</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-border py-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Level</th>
                <th className="border-b border-border py-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">Price</th>
                <th className="border-b border-border py-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">Distance from CMP</th>
              </tr>
            </thead>
            <tbody>
              {stock.resistance.slice().reverse().map((r, i) => (
                <SrModalRow key={`res-${i}`} label={`Resistance ${stock.resistance.length - i}`} value={r} cmp={stock.cmp} color="text-neg" />
              ))}
              <SrModalRow label="CMP" value={stock.cmp} cmp={stock.cmp} color="text-primary" isCmp />
              {stock.support.map((s, i) => (
                <SrModalRow key={`sup-${i}`} label={`Support ${i + 1}`} value={s} cmp={stock.cmp} color="text-pos" />
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text2">Moving Average Position</div>
          <div className="flex gap-2">
            <DmaChip label="20D" above={stock.above20dma} large />
            <DmaChip label="50D" above={stock.above50dma} large />
            <DmaChip label="200D" above={stock.above200dma} large />
          </div>
        </div>
      </TableModal>
    </>
  );
}

function RsiGauge({ value, color, large = false }: { value: number; color: string; large?: boolean }) {
  const arcLen = 100;
  const dash = Math.max(2, Math.min(100, value));
  const size = large ? 120 : 72;
  const height = large ? 66 : 40;

  return (
    <div className={cn("flex shrink-0 flex-col items-center justify-center gap-1", large ? "w-[130px]" : "w-[78px]")}>
      <svg width={size} height={height} viewBox="0 0 72 40">
        <path d="M4,38 A32,32 0 0,1 68,38" fill="none" stroke="#E2E5E9" strokeWidth={6} strokeLinecap="round" />
        <path
          d="M4,38 A32,32 0 0,1 68,38"
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          pathLength={arcLen}
          strokeDasharray={`${dash} ${arcLen}`}
        />
      </svg>
      <div className={cn("tnum -mt-0.5 font-extrabold", large ? "text-[24px]" : "text-[15px]")}>{value.toFixed(1)}</div>
      <div className="text-[8.5px] uppercase tracking-wide text-text3">RSI (14)</div>
    </div>
  );
}

function SrRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-px text-[10px]">
      <span className="font-semibold text-text2">{label}</span>
      <span className="tnum font-bold" style={{ color }}>
        {fmtInt(value)}
      </span>
    </div>
  );
}

function SrModalRow({
  label,
  value,
  cmp,
  color,
  isCmp = false,
}: {
  label: string;
  value: number;
  cmp: number;
  color: string;
  isCmp?: boolean;
}) {
  const dist = ((value - cmp) / cmp) * 100;
  return (
    <tr className={isCmp ? "bg-accent" : undefined}>
      <td className={cn("border-b border-[#F0F1F3] py-[5px] text-[10.5px] font-semibold", isCmp && "font-bold")}>{label}</td>
      <td className={cn("tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px] font-bold", color)}>{fmtInt(value)}</td>
      <td className="tnum border-b border-[#F0F1F3] py-[5px] text-right text-[10.5px] text-text2">
        {isCmp ? "—" : `${dist >= 0 ? "+" : ""}${dist.toFixed(1)}%`}
      </td>
    </tr>
  );
}

function DmaChip({ label, above, large = false }: { label: string; above: boolean; large?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-[2px] font-bold",
        large ? "px-3 py-1.5 text-[11px]" : "px-1.5 py-[2px] text-[8.5px]",
        above ? "bg-pos-dim text-pos" : "bg-neg-dim text-neg"
      )}
    >
      {above ? "Above" : "Below"} {label} MA
    </span>
  );
}
