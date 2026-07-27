"use client";

import { useMemo, useState } from "react";
import { stocks } from "@/lib/mock-data";
import { fmtNum, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "fo" | "flagged";

export function WatchlistSidebar({
  selectedSymbol,
  onSelect,
}: {
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    let list = stocks;
    if (filter === "fo") list = list.filter((s) => s.isFo);
    if (filter === "flagged") list = list.filter((s) => s.riskFlags.some((r) => r.severity !== "low") || s.news.length > 0);
    return [...list].sort((a, b) => (sortDesc ? b.changePct - a.changePct : a.changePct - b.changePct));
  }, [filter, sortDesc]);

  return (
    <div className="flex flex-col overflow-hidden rounded-[4px] border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-panel-head px-2.5 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-text2">
          Watchlist <b className="text-foreground">· {stocks.length}</b>
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
          const hasRisk = s.riskFlags.some((r) => r.severity !== "low");
          const active = s.symbol === selectedSymbol;
          return (
            <div key={s.symbol}>
              <div
                onClick={() => onSelect(s.symbol)}
                className={cn(
                  "grid cursor-pointer grid-cols-[1fr_auto_auto] items-center gap-1.5 border-b border-border px-2 py-1.5",
                  active ? "border-l-2 border-l-primary bg-accent pl-[7px]" : "hover:bg-background"
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
              </div>
              {(hasNews || s.isFo || hasRisk) && (
                <div className="flex gap-[3px] px-2 pb-1">
                  {hasNews && <span className="h-[5px] w-[5px] rounded-full bg-primary" title="News" />}
                  {hasRisk && <span className="h-[5px] w-[5px] rounded-full bg-neg" title="Risk flag" />}
                  {s.isFo && <span className="h-[5px] w-[5px] rounded-full bg-amber" title="F&O active" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-panel-head px-2 py-1.5 text-[9.5px] text-text3">
        <button onClick={() => setSortDesc((v) => !v)} className="hover:text-foreground">
          Sorted: % Chg {sortDesc ? "▾" : "▴"}
        </button>
        <span className="cursor-pointer hover:text-foreground">+ Add symbol</span>
      </div>
    </div>
  );
}
