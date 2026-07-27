import { AlertTriangle } from "lucide-react";
import type { Stock } from "@/types/stock";
import { fmtCr, fmtNum, fmtPct, fmtSigned } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StockHeader({ stock }: { stock: Stock }) {
  const frozen = stock.circuitState !== "none";
  const pos = stock.changePct >= 0;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[4px] border border-border bg-card px-2.5 py-[7px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:flex-nowrap lg:justify-between">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h1 className="text-[16px] font-extrabold tracking-tight">{stock.symbol}</h1>
        <span className="truncate text-[10.5px] font-medium text-text2">
          {stock.name} · {stock.exchange}:{stock.symbol} · {stock.sector}
        </span>
      </div>

      {frozen ? (
        <div className="flex items-center gap-1.5 rounded-[3px] bg-amber-dim px-2 py-1 text-amber">
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span className="text-[11px] font-bold uppercase tracking-wide">
            {stock.circuitState === "upper" ? "Upper Circuit — Frozen" : "Lower Circuit — Frozen"}
          </span>
        </div>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="tnum text-[18px] font-extrabold">₹{fmtNum(stock.cmp)}</span>
          <span
            className={cn(
              "tnum rounded-[3px] px-1.5 py-px text-[12px] font-bold",
              pos ? "bg-pos-dim text-pos" : "bg-neg-dim text-neg"
            )}
          >
            {fmtSigned(stock.changeAbs)} ({fmtPct(stock.changePct)})
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wide text-text3">52W Range</div>
          <div className="tnum text-[11px] font-bold">
            {fmtNum(stock.week52Low, 0)} – {fmtNum(stock.week52High, 0)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wide text-text3">Vol vs 20D</div>
          <div className={cn("tnum text-[11px] font-bold", stock.volVs20d >= 0 ? "text-pos" : "text-neg")}>
            {fmtPct(stock.volVs20d, true)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wide text-text3">Mkt Cap</div>
          <div className="tnum text-[11px] font-bold">{fmtCr(stock.mcapCr)}</div>
        </div>
      </div>
    </div>
  );
}
