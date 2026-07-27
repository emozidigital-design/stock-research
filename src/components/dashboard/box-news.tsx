"use client";

import { useMemo, useState } from "react";
import type { NewsTag, Stock } from "@/types/stock";
import { Panel } from "./panel";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";

const TAG_STYLES: Record<NewsTag, string> = {
  RESULTS: "bg-accent text-primary",
  CORP_ACTION: "bg-[#eee5fb] text-[#7C3AED]",
  COMPLIANCE: "bg-neg-dim text-neg",
  ANNOUNCEMENT: "bg-pos-dim text-pos",
  GOVT_POLICY: "bg-amber-dim text-[#B57500]",
  GLOBAL: "bg-[#e0f2fe] text-[#0369A1]",
  MARKET_TREND: "bg-[#f1f0fe] text-[#4338CA]",
  BROKER_CALL: "bg-[#fce7f3] text-[#BE185D]",
  INSIDER_BULK: "bg-[#fef4e0] text-[#92610A]",
};

const TAG_LABELS: Record<NewsTag, string> = {
  RESULTS: "Results",
  CORP_ACTION: "Corp Action",
  COMPLIANCE: "Compliance",
  ANNOUNCEMENT: "Announcement",
  GOVT_POLICY: "Govt Policy",
  GLOBAL: "Global",
  MARKET_TREND: "Market Trend",
  BROKER_CALL: "Broker Call",
  INSIDER_BULK: "Insider/Bulk",
};

const ALL_TAGS = Object.keys(TAG_LABELS) as NewsTag[];

export function BoxNews({ stock }: { stock: Stock }) {
  const [filter, setFilter] = useState<NewsTag | null>(null);
  const presentTags = useMemo(
    () => ALL_TAGS.filter((t) => stock.news.some((n) => n.tags.includes(t))),
    [stock.news]
  );
  const filtered = filter ? stock.news.filter((n) => n.tags.includes(filter)) : stock.news;

  return (
    <Panel title="News Feed" tag="Live" className="max-h-[360px] min-h-0 lg:max-h-none lg:flex-1" noBodyPad>
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-border px-2.5 py-1.5">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            "rounded-[2px] px-1.5 py-px text-[8.5px] font-bold uppercase tracking-wide",
            filter === null ? "bg-primary text-primary-foreground" : "bg-background text-text2 hover:bg-accent"
          )}
        >
          All
        </button>
        {presentTags.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "rounded-[2px] px-1.5 py-px text-[8.5px] font-bold uppercase tracking-wide",
              filter === t ? TAG_STYLES[t] : "bg-background text-text2 hover:bg-accent"
            )}
          >
            {TAG_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-2.5 py-1">
        {filtered.map((n) => (
          <div key={n.id} className="border-b border-[#F0F1F3] py-1.5 last:border-b-0">
            <div className="mb-[3px] flex items-center gap-1.5">
              {n.tags.map((t) => (
                <span
                  key={t}
                  className={cn(
                    "whitespace-nowrap rounded-[2px] px-1.5 py-px text-[8px] font-extrabold uppercase tracking-wide",
                    TAG_STYLES[t]
                  )}
                >
                  {TAG_LABELS[t]}
                </span>
              ))}
              <span className="ml-auto whitespace-nowrap text-[9px] text-text3">{fmtDateTime(n.date)}</span>
            </div>
            <div className="text-[10.5px] leading-snug">{n.headline}</div>
            <div className="mt-px text-[9px] text-text3">Source: {n.source}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
