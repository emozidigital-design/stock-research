"use client";

import { useEffect, useState } from "react";
import { getStock, stocks } from "@/lib/mock-data";
import { buildBareStock } from "@/lib/bare-stock";
import { useAddedStocks } from "@/lib/use-added-stocks";
import { useLiveQuote } from "@/lib/use-live-quote";
import { useLiveFundamentals, useLiveSymbolFundamentals, mergeFundamentals } from "@/lib/use-live-fundamentals";
import { cn } from "@/lib/utils";
import type { Stock } from "@/types/stock";
import { TopStrip } from "./top-strip";
import { WatchlistSidebar } from "./watchlist-sidebar";
import { StockHeader } from "./stock-header";
import { DetailGrid } from "./detail-grid";
import { RightSidebar } from "./right-sidebar";

const MOBILE_TABS = [
  ["watchlist", "Watchlist"],
  ["overview", "Overview"],
  ["insights", "Insights"],
] as const;

type MobileTab = (typeof MOBILE_TABS)[number][0];

export function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  // Only set when the selection comes from search results outside the
  // watchlist — there's no mock row to source a display name from otherwise.
  const [searchedName, setSearchedName] = useState<string | null>(null);
  // Seeded client-side only — computing this during render would produce a
  // different value on the prerendered pass vs. hydration, triggering a mismatch.
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("overview");
  const { added, addStock, removeStock, isAdded } = useAddedStocks();
  const addedSymbols = added.map((a) => a.symbol);

  const isStaticWatchlist = stocks.some((s) => s.symbol === selectedSymbol);
  const inWatchlist = isStaticWatchlist || isAdded(selectedSymbol);
  const addedEntry = added.find((a) => a.symbol === selectedSymbol);
  const baseStock = isStaticWatchlist
    ? getStock(selectedSymbol)
    : buildBareStock(selectedSymbol, addedEntry?.name ?? searchedName ?? selectedSymbol);

  function selectFromWatchlist(symbol: string) {
    setSearchedName(null);
    setSelectedSymbol(symbol);
  }

  function selectFromSearch(symbol: string, name: string) {
    setSearchedName(name);
    setSelectedSymbol(symbol);
  }

  // Removing the stock currently being viewed would otherwise leave the
  // detail view frozen on a symbol that's no longer polled — fall back to
  // the first watchlist stock instead.
  function handleRemoveStock(symbol: string) {
    removeStock(symbol);
    if (symbol === selectedSymbol) selectFromWatchlist(stocks[0].symbol);
  }

  // Fixed "1M" range for the header/technicals overlay — independent from
  // BoxChart's own range-following poll of the same route (see box-chart.tsx).
  const { live, error, lastFetchedAt } = useLiveQuote(selectedSymbol, "1M");
  // Watchlist-like stocks (static + added) share the batch polls, which now
  // include added symbols via ?symbols=; a symbol only being previewed from
  // search (not yet added) falls back to the single-symbol route instead.
  const watchlistFundamentals = useLiveFundamentals(addedSymbols);
  const searchedFundamentals = useLiveSymbolFundamentals(selectedSymbol, !inWatchlist);
  const liveFundamentalsForSymbol = inWatchlist ? watchlistFundamentals.get(selectedSymbol) : searchedFundamentals ?? undefined;
  const priceStock: Stock = live ? { ...baseStock, ...live } : baseStock;
  const stock: Stock = mergeFundamentals(priceStock, liveFundamentalsForSymbol);
  const isStale = error !== null;

  useEffect(() => {
    if (lastFetchedAt) setLastSync(lastFetchedAt);
    else setLastSync((prev) => prev ?? new Date());
  }, [lastFetchedAt]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopStrip
        onSelect={selectFromWatchlist}
        onSelectSearch={selectFromSearch}
        lastSync={lastSync}
        isStale={isStale}
        isAdded={isAdded}
        onAddStock={addStock}
      />

      {/* Mobile/tablet section switcher — the 3-pane layout only fits on large screens */}
      <div className="flex shrink-0 gap-1 border-b border-border bg-card px-1.5 py-1.5 lg:hidden">
        {MOBILE_TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMobileTab(key)}
            className={cn(
              "flex-1 rounded-[3px] border px-2 py-1.5 text-[11px] font-semibold",
              mobileTab === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-text2 hover:bg-accent"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 p-1.5 lg:grid-cols-[19%_51%_30%] lg:overflow-hidden xl:grid-cols-[22%_48%_30%]">
        <div className={cn("min-h-0", mobileTab === "watchlist" ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>
          <WatchlistSidebar
            selectedSymbol={selectedSymbol}
            onSelect={selectFromWatchlist}
            added={added}
            onRemoveStock={handleRemoveStock}
          />
        </div>

        <div
          className={cn(
            "min-h-0 flex-col gap-1.5",
            mobileTab === "overview" ? "flex" : "hidden lg:flex",
            "lg:overflow-hidden"
          )}
        >
          <StockHeader stock={stock} />
          <DetailGrid stock={stock} />
        </div>

        <div className={cn("min-h-0", mobileTab === "insights" ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>
          <RightSidebar stock={stock} />
        </div>
      </div>
    </div>
  );
}
