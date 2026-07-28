"use client";

import { useMemo, useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { InteractiveChart, type Candle } from "./interactive-chart";
import { cn } from "@/lib/utils";
import { fmtNum } from "@/lib/format";
import { useLiveQuote, type ChartRangeKey } from "@/lib/use-live-quote";
import type { OhlcvBar } from "@/lib/yahoo-finance";

const RANGES: ChartRangeKey[] = ["1D", "1M", "6M", "1Y", "5Y"];

// Deterministic pseudo-random candles seeded from the stock symbol — used as
// a fallback when real data isn't available yet (cold-start fetch failure,
// or the "1D" tab, which intentionally stays on placeholder data since a
// daily-bar endpoint can't produce a useful intraday view).
function seededCandles(symbol: string, count: number): Candle[] {
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed = (seed * 31 + symbol.charCodeAt(i)) % 100000;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const candles: Candle[] = [];
  let level = 60;
  const nowSec = Math.floor(Date.now() / 1000);
  const dayInSec = 86400;
  for (let i = 0; i < count; i++) {
    const drift = (rand() - 0.42) * 14;
    const open = level;
    const close = Math.max(8, Math.min(100, level + drift));
    const hi = Math.max(open, close) + rand() * 6;
    const lo = Math.min(open, close) - rand() * 6;
    candles.push({ up: close >= open, hi, lo, open, close, t: nowSec - (count - i) * dayInSec });
    level = close;
  }
  return candles;
}

function barsToCandles(bars: OhlcvBar[]): Candle[] {
  return bars.map((b) => ({ up: b.close >= b.open, hi: b.high, lo: b.low, open: b.open, close: b.close, t: b.t }));
}

export function BoxChart({ stock }: { stock: Stock }) {
  const [range, setRange] = useState<ChartRangeKey>("1M");
  const [expanded, setExpanded] = useState(false);
  const isPlaceholderRange = range === "1D";

  // Real OHLCV for 1M/6M/1Y/5Y; "1D" intentionally stays on placeholder data
  // since a daily-bar endpoint can't produce a useful intraday candle view —
  // disabled so no network call fires for that tab.
  const { bars, loading } = useLiveQuote(stock.symbol, range, !isPlaceholderRange);
  const fallback = useMemo(() => seededCandles(`${stock.symbol}-${range}`, 30), [stock.symbol, range]);

  const candles = useMemo(() => {
    if (isPlaceholderRange) return fallback;
    if (bars.length > 0) return barsToCandles(bars);
    return fallback; // cold-start: no successful fetch yet for this symbol/range
  }, [isPlaceholderRange, bars, fallback]);

  return (
    <>
      <Panel title="Price Chart · Daily" tag="EMA 20/50" tagClassName="bg-amber-dim text-[#B57500]" onExpand={() => setExpanded(true)} noBodyPad>
        <div className="flex h-full min-h-0 flex-col px-1.5 pt-1">
          <RangeTabs range={range} onChange={setRange} />
          {isPlaceholderRange && (
            <div className="px-1 pb-1 text-[9px] text-text3">Intraday view — placeholder data</div>
          )}
          <div className="relative min-h-[120px] flex-1">
            <InteractiveChart candles={candles} loading={!isPlaceholderRange && loading && bars.length === 0} />
          </div>
        </div>
      </Panel>

      <TableModal open={expanded} onOpenChange={setExpanded} title="Price Chart · Daily" subtitle={`${stock.symbol} · ${stock.name}`} tag="EMA 20/50">
        <RangeTabs range={range} onChange={setRange} large />
        {isPlaceholderRange && (
          <div className="pb-1 pt-1 text-[9.5px] text-text3">Intraday view — placeholder data (real-time 1D not yet wired)</div>
        )}
        <div className="relative mt-2 h-[280px]">
          <InteractiveChart candles={candles} loading={!isPlaceholderRange && loading && bars.length === 0} />
        </div>
        <OhlcSummary candles={candles} />
      </TableModal>
    </>
  );
}

function RangeTabs({
  range,
  onChange,
  large = false,
}: {
  range: ChartRangeKey;
  onChange: (r: ChartRangeKey) => void;
  large?: boolean;
}) {
  return (
    <div className={cn("flex gap-1 px-1 pb-1 pt-px sm:gap-[3px]", large && "px-0")}>
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "min-w-[30px] rounded-[2px] px-2 py-1 text-[10px] font-bold sm:min-w-0 sm:px-1.5 sm:py-[2px] sm:text-[9px]",
            large && "min-w-[40px] px-3 py-1.5 text-[11px]",
            range === r ? "bg-primary text-primary-foreground" : "text-text2 hover:bg-accent"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function OhlcSummary({ candles }: { candles: Candle[] }) {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.hi);
  const lows = candles.map((c) => c.lo);

  const periodHigh = Math.max(...highs);
  const periodLow = Math.min(...lows);
  const open = candles[0].open;
  const close = closes.at(-1)!;
  const upDays = candles.filter((c) => c.up).length;

  return (
    <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-border bg-border sm:grid-cols-5">
      <OhlcStat label="Open" value={fmtNum(open, 0)} />
      <OhlcStat label="Period High" value={fmtNum(periodHigh, 0)} color="text-pos" />
      <OhlcStat label="Period Low" value={fmtNum(periodLow, 0)} color="text-neg" />
      <OhlcStat label="Close" value={fmtNum(close, 0)} />
      <OhlcStat label="Up / Down Days" value={`${upDays} / ${candles.length - upDays}`} />
    </div>
  );
}

function OhlcStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-card px-2.5 py-2 text-center">
      <div className="mb-0.5 text-[9px] uppercase tracking-wide text-text2">{label}</div>
      <div className={cn("tnum text-[13px] font-extrabold", color)}>{value}</div>
    </div>
  );
}
