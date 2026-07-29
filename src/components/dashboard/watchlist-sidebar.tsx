"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { stocks } from "@/lib/mock-data";
import { buildBareStock } from "@/lib/bare-stock";
import type { AddedStock } from "@/lib/use-added-stocks";
import { fmtNum, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { computeRiskFlags, computeVerdict } from "@/lib/risk-verdict-engine";
import { useLiveWatchlist } from "@/lib/use-live-watchlist";
import { useLiveFundamentals, mergeFundamentals } from "@/lib/use-live-fundamentals";
import type { Stock, Verdict } from "@/types/stock";

type FilterKey = "all" | "fo" | "flagged";

export function WatchlistSidebar({
  selectedSymbol,
  onSelect,
  added,
  onRemoveStock,
}: {
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  added: AddedStock[];
  onRemoveStock: (symbol: string) => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortDesc, setSortDesc] = useState(true);
  const addedSymbols = useMemo(() => added.map((a) => a.symbol), [added]);
  const liveQuotes = useLiveWatchlist(addedSymbols);
  const liveFundamentals = useLiveFundamentals(addedSymbols);

  // Static watchlist rows + user-added rows (via buildBareStock, same base
  // used for search previews) share one live-merge pipeline — the merge
  // logic only cares that quotes/fundamentals are keyed by symbol, not where
  // the base Stock came from. Live price/%chg and fundamentals win per
  // symbol/field; mock/bare stays the fallback until the first poll lands.
  const liveStocks = useMemo<Stock[]>(() => {
    const base = [...stocks, ...added.map((a) => buildBareStock(a.symbol, a.name))];
    return base.map((s) => {
      const live = liveQuotes.get(s.symbol);
      const withPrice = live ? { ...s, cmp: live.cmp, changeAbs: live.changeAbs, changePct: live.changePct } : s;
      return mergeFundamentals(withPrice, liveFundamentals.get(s.symbol));
    });
  }, [added, liveQuotes, liveFundamentals]);

  const riskBySymbol = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const s of liveStocks) map.set(s.symbol, computeRiskFlags(s).some((r) => r.severity !== "low"));
    return map;
  }, [liveStocks]);

  const verdictBySymbol = useMemo(() => {
    const map = new Map<string, Verdict>();
    for (const s of liveStocks) map.set(s.symbol, computeVerdict(s).verdict);
    return map;
  }, [liveStocks]);

  const filtered = useMemo(() => {
    let list = liveStocks;
    if (filter === "fo") list = list.filter((s) => s.isFo);
    if (filter === "flagged") list = list.filter((s) => riskBySymbol.get(s.symbol) || s.news.length > 0);
    return [...list].sort((a, b) => (sortDesc ? b.changePct - a.changePct : a.changePct - b.changePct));
  }, [liveStocks, filter, sortDesc, riskBySymbol]);

  return (
    <div className="flex flex-col overflow-hidden rounded-[4px] border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-panel-head px-2.5 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-text2">
          Watchlist <b className="text-foreground">· {stocks.length + added.length}</b>
        </span>
        <span className="rounded-[2px] bg-accent px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-primary">
          F&O
        </span>
      </div>

      <div className="flex shrink-0 gap-1 border-b border-border bg-panel-head px-2 py-1.5">
        {(
          [
            ["all", "All"],
            ["fo", "F&O"],
            ["flagged", "Flagged"],
          ] as [FilterKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-[3px] border px-1.5 py-[3px] text-[9.5px] font-semibold",
              filter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-text2 hover:bg-accent"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((s) => {
          const hasNews = s.news.length > 0;
          const hasRisk = riskBySymbol.get(s.symbol) ?? false;
          const verdict = verdictBySymbol.get(s.symbol) ?? "Neutral";
          const active = s.symbol === selectedSymbol;
          const isAddedRow = addedSymbols.includes(s.symbol);
          return (
            <div key={s.symbol} className="flex">
              <span
                className={cn(
                  "w-[3px] shrink-0",
                  verdict === "Bullish" ? "bg-pos" : verdict === "Bearish" ? "bg-neg" : "bg-amber"
                )}
                title={`Verdict: ${verdict}`}
              />
              <div className="flex-1">
                <div
                  onClick={() => onSelect(s.symbol)}
                  className={cn(
                    "grid cursor-pointer grid-cols-[1fr_auto_auto_auto] items-center gap-1.5 border-b border-border px-2 py-1.5",
                    active ? "bg-accent" : "hover:bg-background"
                  )}
                >
                  <div className="flex flex-col gap-px">
                    <span className="text-[11.5px] font-bold">{s.symbol}</span>
                    <span className="text-[9px] font-medium text-text3">{s.sector}</span>
                  </div>
                  <span className="tnum text-right text-[11.5px] font-semibold">{fmtNum(s.cmp)}</span>
                  <span
                    className={cn(
                      "tnum min-w-[56px] rounded-[3px] px-[5px] py-px text-center text-[10px] font-bold",
                      s.changePct >= 0 ? "bg-pos-dim text-pos" : "bg-neg-dim text-neg"
                    )}
                  >
                    {fmtPct(s.changePct)}
                  </span>
                  {isAddedRow && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStock(s.symbol);
                      }}
                      title="Remove from watchlist"
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] text-text3 hover:bg-neg-dim hover:text-neg"
                    >
                      <X className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                {(hasNews || s.isFo || hasRisk) && (
                  <div className="flex gap-[3px] px-2 pb-1">
                    {hasNews && <span className="h-[5px] w-[5px] rounded-full bg-primary" title="News" />}
                    {hasRisk && <span className="h-[5px] w-[5px] rounded-full bg-neg" title="Risk flag" />}
                    {s.isFo && <span className="h-[5px] w-[5px] rounded-full bg-amber" title="F&O active" />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-panel-head px-2 py-1.5 text-[9.5px] text-text3">
        <button onClick={() => setSortDesc((v) => !v)} className="hover:text-foreground">
          Sorted: % Chg {sortDesc ? "▾" : "▴"}
        </button>
        <span>Search to add a symbol</span>
      </div>
    </div>
  );
}
