import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";

export function BoxTechnicals({ stock }: { stock: Stock }) {
  const rsiColor = stock.rsi14 >= 70 ? "#D93025" : stock.rsi14 <= 30 ? "#D93025" : "#0F9D58";
  const arcLen = 100;
  const dash = Math.max(2, Math.min(100, stock.rsi14));

  return (
    <Panel title="Technicals">
      <div className="flex h-full gap-2">
        <div className="flex w-[78px] shrink-0 flex-col items-center justify-center gap-1">
          <svg width="72" height="40" viewBox="0 0 72 40">
            <path d="M4,38 A32,32 0 0,1 68,38" fill="none" stroke="#E2E5E9" strokeWidth={6} strokeLinecap="round" />
            <path
              d="M4,38 A32,32 0 0,1 68,38"
              fill="none"
              stroke={rsiColor}
              strokeWidth={6}
              strokeLinecap="round"
              pathLength={arcLen}
              strokeDasharray={`${dash} ${arcLen}`}
            />
          </svg>
          <div className="tnum -mt-0.5 text-[15px] font-extrabold">{stock.rsi14.toFixed(1)}</div>
          <div className="text-[8.5px] uppercase tracking-wide text-text3">RSI (14)</div>
        </div>

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

function DmaChip({ label, above }: { label: string; above: boolean }) {
  return (
    <span
      className={cn(
        "rounded-[2px] px-1.5 py-[2px] text-[8.5px] font-bold",
        above ? "bg-pos-dim text-pos" : "bg-neg-dim text-neg"
      )}
    >
      {above ? "Above" : "Below"} {label}
    </span>
  );
}
