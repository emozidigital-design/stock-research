"use client";

import { useMemo, useState } from "react";
import type { NewsItem, NewsTag, Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import { useLiveNews } from "@/lib/use-live-news";

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
  const [expandedFilter, setExpandedFilter] = useState<NewsTag | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { news: liveNews, loading } = useLiveNews(stock.symbol);
  // Live Firestore news wins once the pipeline has populated this symbol; mock data covers the gap until then.
  const news = !loading && liveNews.length > 0 ? liveNews : stock.news;
  const presentTags = useMemo(
    () => ALL_TAGS.filter((t) => news.some((n) => n.tags.includes(t))),
    [news]
  );
  const filtered = filter ? news.filter((n) => n.tags.includes(filter)) : news;
  const expandedFiltered = expandedFilter ? news.filter((n) => n.tags.includes(expandedFilter)) : news;

  return (
    <>
      <Panel title="News Feed" tag="Live" className="max-h-[360px] min-h-0 lg:max-h-none lg:flex-1" onExpand={() => setExpanded(true)} noBodyPad>
        <TagFilters tags={presentTags} active={filter} onChange={setFilter} />
        <div className="flex-1 overflow-y-auto px-2.5 py-1">
          {filtered.map((n) => (
            <NewsRow key={n.id} item={n} />
          ))}
        </div>
      </Panel>

      <TableModal
        open={expanded}
        onOpenChange={setExpanded}
        title="News Feed"
        subtitle={`${stock.symbol} · ${stock.name}`}
        tag="Live"
      >
        <TagFilters tags={presentTags} active={expandedFilter} onChange={setExpandedFilter} modal />
        <div className="mt-2">
          {expandedFiltered.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-text3">No news items match this filter.</div>
          ) : (
            expandedFiltered.map((n) => <NewsRow key={n.id} item={n} large />)
          )}
        </div>
      </TableModal>
    </>
  );
}

function TagFilters({
  tags,
  active,
  onChange,
  modal = false,
}: {
  tags: NewsTag[];
  active: NewsTag | null;
  onChange: (t: NewsTag | null) => void;
  modal?: boolean;
}) {
  return (
    <div className={cn("flex shrink-0 flex-wrap gap-1", modal ? "pb-2" : "border-b border-border px-2.5 py-1.5")}>
      <button
        onClick={() => onChange(null)}
        className={cn(
          "rounded-[2px] font-bold uppercase tracking-wide",
          modal ? "px-2 py-1 text-[9.5px]" : "px-1.5 py-px text-[8.5px]",
          active === null ? "bg-primary text-primary-foreground" : "bg-background text-text2 hover:bg-accent"
        )}
      >
        All
      </button>
      {tags.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            "rounded-[2px] font-bold uppercase tracking-wide",
            modal ? "px-2 py-1 text-[9.5px]" : "px-1.5 py-px text-[8.5px]",
            active === t ? TAG_STYLES[t] : "bg-background text-text2 hover:bg-accent"
          )}
        >
          {TAG_LABELS[t]}
        </button>
      ))}
    </div>
  );
}

function NewsRow({ item, large = false }: { item: NewsItem; large?: boolean }) {
  return (
    <div className={cn("border-b border-[#F0F1F3] last:border-b-0", large ? "py-3" : "py-1.5")}>
      <div className={cn("flex items-center gap-1.5", large ? "mb-1.5" : "mb-[3px]")}>
        {item.tags.map((t) => (
          <span
            key={t}
            className={cn(
              "whitespace-nowrap rounded-[2px] font-extrabold uppercase tracking-wide",
              large ? "px-2 py-0.5 text-[9px]" : "px-1.5 py-px text-[8px]",
              TAG_STYLES[t]
            )}
          >
            {TAG_LABELS[t]}
          </span>
        ))}
        <span className={cn("ml-auto whitespace-nowrap text-text3", large ? "text-[10px]" : "text-[9px]")}>
          {fmtDateTime(item.date)}
        </span>
      </div>
      <div className={cn("leading-snug", large ? "text-[13px]" : "text-[10.5px]")}>{item.headline}</div>
      <div className={cn("mt-px text-text3", large ? "text-[10px]" : "text-[9px]")}>Source: {item.source}</div>
    </div>
  );
}
