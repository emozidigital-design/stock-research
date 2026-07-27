"use client";

import { useMemo, useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { cn } from "@/lib/utils";
import { fmtNum } from "@/lib/format";

const RANGES = ["1D", "1M", "6M", "1Y", "5Y"] as const;
type Candle = { up: boolean; hi: number; lo: number; open: number; close: number };

// Deterministic pseudo-random candles seeded from the stock symbol so each
// stock renders a distinct, stable chart shape without a real price feed.
function seededCandles(symbol: string, count: number): Candle[] {
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed = (seed * 31 + symbol.charCodeAt(i)) % 100000;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const candles: Candle[] = [];
  let level = 60;
  for (let i = 0; i < count; i++) {
    const drift = (rand() - 0.42) * 14;
    const open = level;
    const close = Math.max(8, Math.min(100, level + drift));
    const hi = Math.max(open, close) + rand() * 6;
    const lo = Math.min(open, close) - rand() * 6;
    candles.push({ up: close >= open, hi, lo, open, close });
    level = close;
  }
  return candles;
}

function smooth(values: number[], alpha: number): number[] {
  const out: number[] = [];
  let prev = values[0];
  for (const v of values) {
    prev = alpha * v + (1 - alpha) * prev;
    out.push(prev);
  }
  return out;
}

export function BoxChart({ stock }: { stock: Stock }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>("1M");
  const [expanded, setExpanded] = useState(false);
  const candles = useMemo(() => seededCandles(`${stock.symbol}-${range}`, 30), [stock.symbol, range]);

  return (
    <>
      <Panel title="Price Chart · Daily" tag="EMA 20/50" tagClassName="bg-amber-dim text-[#B57500]" onExpand={() => setExpanded(true)} noBodyPad>
        <div className="flex h-full min-h-0 flex-col px-1.5 pt-1">
          <RangeTabs range={range} onChange={setRange} />
          <div className="relative min-h-[120px] flex-1">
            <CandleChart candles={candles} />
          </div>
        </div>
      </Panel>

      <TableModal open={expanded} onOpenChange={setExpanded} title="Price Chart · Daily" subtitle={`${stock.symbol} · ${stock.name}`} tag="EMA 20/50">
        <RangeTabs range={range} onChange={setRange} large />
        <div className="relative mt-2 h-[280px]">
          <CandleChart candles={candles} />
        </div>
        <OhlcSummary candles={candles} cmp={stock.cmp} />
      </TableModal>
    </>
  );
}

function RangeTabs({
  range,
  onChange,
  large = false,
}: {
  range: (typeof RANGES)[number];
  onChange: (r: (typeof RANGES)[number]) => void;
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

function CandleChart({ candles }: { candles: Candle[] }) {
  const w = 400;
  const h = 130;
  const step = w / candles.length;
  const scaleY = (v: number) => h - (v / 100) * h;
  const ema20 = useMemo(() => smooth(candles.map((c) => c.close), 0.15), [candles]);
  const ema50 = useMemo(() => smooth(candles.map((c) => c.close), 0.08), [candles]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      {[0.15, 0.38, 0.62, 0.85].map((f) => (
        <line key={f} x1={0} y1={h * f} x2={w} y2={h * f} stroke="#F0F1F3" strokeWidth={1} />
      ))}
      <polyline
        points={ema20.map((v, i) => `${i * step + step / 2},${scaleY(v)}`).join(" ")}
        fill="none"
        stroke="#1A56DB"
        strokeWidth={1.2}
        opacity={0.55}
      />
      <polyline
        points={ema50.map((v, i) => `${i * step + step / 2},${scaleY(v)}`).join(" ")}
        fill="none"
        stroke="#F2A600"
        strokeWidth={1.2}
        opacity={0.55}
      />
      {candles.map((c, i) => {
        const x = i * step + step / 2;
        const bw = Math.max(2, step * 0.55);
        const color = c.up ? "#0F9D58" : "#D93025";
        const bodyTop = scaleY(Math.max(c.open, c.close));
        const bodyBot = scaleY(Math.min(c.open, c.close));
        return (
          <g key={i}>
            <line x1={x} y1={scaleY(c.hi)} x2={x} y2={scaleY(c.lo)} stroke={color} strokeWidth={1} />
            <rect x={x - bw / 2} y={bodyTop} width={bw} height={Math.max(1, bodyBot - bodyTop)} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

function OhlcSummary({ candles, cmp }: { candles: Candle[]; cmp: number }) {
  // Candle values are on an abstract 0-100 scale; rescale to the stock's actual CMP band for a realistic OHLC read.
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.hi);
  const lows = candles.map((c) => c.lo);
  const scaleMax = Math.max(...highs);
  const scaleMin = Math.min(...lows);
  const scaleRange = scaleMax - scaleMin || 1;
  const toPrice = (v: number) => cmp * (0.85 + ((v - scaleMin) / scaleRange) * 0.3);

  const periodHigh = toPrice(Math.max(...highs));
  const periodLow = toPrice(Math.min(...lows));
  const open = toPrice(candles[0].open);
  const close = toPrice(closes.at(-1)!);
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
