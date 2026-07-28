"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { indices, stocks } from "@/lib/mock-data";
import { fmtNum, fmtPct, fmtSigned, fmtTimeIST, isMarketOpen } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Stock } from "@/types/stock";

export function TopStrip({
  onSelect,
  lastSync,
  isStale = false,
}: {
  onSelect: (symbol: string) => void;
  lastSync: Date | null;
  isStale?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const marketOpen = lastSync !== null && isMarketOpen(lastSync);

  const results = useMemo<Stock[]>(() => {
    if (!query.trim()) return [];
    const q = query.trim().toUpperCase();
    return stocks.filter((s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)).slice(0, 8);
  }, [query]);

  const inWatchlist = (symbol: string) => stocks.some((s) => s.symbol === symbol);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!searchOpen) return;
    inputRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) closeSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [searchOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <header className="flex h-auto min-h-[46px] flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border bg-card px-2.5 py-1.5 lg:h-[46px] lg:grid lg:grid-cols-[auto_1fr_auto] lg:flex-nowrap lg:gap-4 lg:py-0">
        {/* Left: brand + market status */}
        <div className="flex items-center gap-2 whitespace-nowrap sm:gap-2.5 lg:shrink-0">
          <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[4px] bg-primary text-[11px] font-extrabold tracking-tight text-primary-foreground">
            NS
          </div>
          <div className="text-[13px] font-bold tracking-tight">
            NSE<span className="text-primary">/</span>TERMINAL
          </div>
          <div
            className={cn(
              "hidden items-center gap-[5px] rounded-[3px] border px-2 py-[3px] pl-1.5 text-[10.5px] font-semibold uppercase tracking-wide xs:flex",
              marketOpen
                ? "border-[#cdeed9] bg-pos-dim text-pos"
                : "border-[#f6d0cc] bg-neg-dim text-neg"
            )}
          >
            <span
              className={cn(
                "h-[6px] w-[6px] rounded-full",
                marketOpen ? "animate-pulse bg-pos" : "bg-neg"
              )}
              style={{ boxShadow: `0 0 0 2px var(--${marketOpen ? "pos" : "neg"}-dim)` }}
            />
            {marketOpen ? "Market Open" : "Market Closed"}
          </div>
        </div>

        {/* Center: index ticker — text/gaps tighten in the 1024–1279px crunch zone, full size from xl up, scroll as last resort */}
        <div className="order-3 flex w-full min-w-0 items-center gap-5 overflow-x-auto pb-0.5 sm:gap-7 lg:order-none lg:w-full lg:justify-between lg:gap-2 lg:pb-0 xl:justify-center xl:gap-7">
          {indices.map((idx, i) => (
            <div key={idx.name} className="flex shrink-0 items-center gap-5 sm:gap-7 lg:gap-2 xl:gap-7">
              {i > 0 && <div className="h-[18px] w-px bg-border" />}
              <div className="flex items-baseline gap-1.5 sm:gap-2 lg:gap-1 xl:gap-2">
                <span className="text-[11.5px] font-bold text-text2 lg:text-[10px] xl:text-[11.5px]">{idx.name}</span>
                <span className="tnum text-[13px] font-bold tracking-tight sm:text-[14px] lg:text-[12px] xl:text-[14px]">{fmtNum(idx.value)}</span>
                <span
                  className={cn(
                    "tnum rounded-[3px] px-[5px] py-px text-[11px] font-semibold lg:px-1 lg:text-[9.5px] xl:px-[5px] xl:text-[11px]",
                    idx.changePct >= 0 ? "bg-pos-dim text-pos" : "bg-neg-dim text-neg"
                  )}
                >
                  {fmtSigned(idx.changeAbs)} ({fmtPct(idx.changePct)})
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: sync time + search icon, grouped as one grid item */}
        <div className="order-2 ml-auto flex shrink-0 items-center gap-2.5 lg:order-none lg:ml-0">
          <div className="hidden whitespace-nowrap text-right text-[10.5px] leading-tight text-text2 xs:block">
            {lastSync ? (
              <>
                <span className="inline-flex items-center gap-1">
                  Last sync <b className="font-semibold text-foreground">{fmtTimeIST(lastSync.toISOString())} IST</b>
                  {isStale && (
                    <span
                      className="h-[6px] w-[6px] rounded-full bg-amber"
                      title="Live data fetch failed — showing last-known values"
                    />
                  )}
                </span>
                <br />
                {lastSync.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                {isStale && <span className="text-amber"> · stale</span>}
              </>
            ) : (
              <>
                Last sync <b className="font-semibold text-foreground">—</b>
                <br />
                &nbsp;
              </>
            )}
          </div>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search NSE / BSE symbol"
            className={cn(
              "order-1 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[3px] border transition-colors xs:order-none",
              searchOpen
                ? "border-primary bg-accent text-primary"
                : "border-border bg-background text-text2 hover:border-primary hover:text-primary"
            )}
          >
            {searchOpen ? <X className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Search className="h-3.5 w-3.5" strokeWidth={2.5} />}
          </button>
        </div>
      </header>

      {/* Dropdown search panel, full-width below the nav bar */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-full z-30 border-b border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-text3" strokeWidth={2.5} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search NSE / BSE symbol or company name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border-none bg-transparent font-sans text-[13px] text-foreground outline-none placeholder:text-text3"
            />
            <span className="rounded-[2px] border border-border px-1 font-mono text-[9.5px] text-text3">Esc</span>
          </div>

          {query.trim() && (
            <div className="max-h-[320px] overflow-y-auto p-1.5">
              {results.length === 0 ? (
                <div className="px-2 py-3 text-center text-[10.5px] text-text3">No matches for &quot;{query}&quot;</div>
              ) : (
                <>
                  {results.map((s) => (
                    <div
                      key={s.symbol}
                      onClick={() => {
                        onSelect(s.symbol);
                        closeSearch();
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-[3px] px-2 py-[7px] text-[11px] hover:bg-accent"
                    >
                      <span>
                        <b className="font-bold">{s.symbol}</b> <span className="text-text3">{s.name}</span>
                      </span>
                      <span className="rounded-[2px] border border-border px-1 text-[8px] font-bold text-text3">
                        {s.exchange}
                      </span>
                    </div>
                  ))}
                  {!inWatchlist(results[0]?.symbol) && (
                    <div className="mt-1 border-t border-border px-2 pt-1.5 text-[9px] text-text3">
                      Full NSE/BSE universe search
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
