"use client";

import { useState } from "react";
import { getStock } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
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
  const [lastSync] = useState(() => new Date());
  const [mobileTab, setMobileTab] = useState<MobileTab>("overview");
  const stock = getStock(selectedSymbol);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopStrip onSelect={setSelectedSymbol} lastSync={lastSync} />

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
          <WatchlistSidebar selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
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
