"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type Time,
  type MouseEventParams,
} from "lightweight-charts";
import { Minus, TrendingUp, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

export type Candle = { up: boolean; hi: number; lo: number; open: number; close: number; t: number };

type DrawTool = "none" | "trendline" | "hline";

interface TrendLine {
  series: ISeriesApi<"Line">;
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

export function InteractiveChart({ candles, loading = false }: { candles: Candle[]; loading?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const [tool, setTool] = useState<DrawTool>("none");
  const toolRef = useRef<DrawTool>("none");
  const pendingPointRef = useRef<{ time: Time; price: number } | null>(null);
  const trendLinesRef = useRef<TrendLine[]>([]);
  const hLinesRef = useRef<IPriceLine[]>([]);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  // Chart + series setup — created once per mount, torn down on unmount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { color: "transparent" },
        textColor: "#6B7280",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#F0F1F3" },
        horzLines: { color: "#F0F1F3" },
      },
      rightPriceScale: { borderColor: "#E5E7EB" },
      timeScale: { borderColor: "#E5E7EB", timeVisible: false },
      crosshair: { mode: 0 },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#0F9D58",
      downColor: "#D93025",
      borderUpColor: "#0F9D58",
      borderDownColor: "#D93025",
      wickUpColor: "#0F9D58",
      wickDownColor: "#D93025",
    });
    const ema20Series = chart.addSeries(LineSeries, {
      color: "#1A56DB",
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    const ema50Series = chart.addSeries(LineSeries, {
      color: "#F2A600",
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chart.subscribeClick((param: MouseEventParams) => {
      const activeTool = toolRef.current;
      if (activeTool === "none" || !param.time || param.point == null) return;
      const price = candleSeries.coordinateToPrice(param.point.y);
      if (price == null) return;

      if (activeTool === "hline") {
        const line = candleSeries.createPriceLine({
          price,
          color: "#7C3AED",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: price.toFixed(2),
        });
        hLinesRef.current.push(line);
        return;
      }

      if (activeTool === "trendline") {
        const pending = pendingPointRef.current;
        if (!pending) {
          pendingPointRef.current = { time: param.time, price };
          return;
        }
        const lineSeries = chart.addSeries(LineSeries, {
          color: "#7C3AED",
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const points = [pending, { time: param.time, price }].sort((a, b) => (a.time as number) - (b.time as number));
        lineSeries.setData(points);
        trendLinesRef.current.push({ series: lineSeries });
        pendingPointRef.current = null;
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      ema20SeriesRef.current = null;
      ema50SeriesRef.current = null;
      trendLinesRef.current = [];
      hLinesRef.current = [];
    };
  }, []);

  // Data updates — separate effect so re-renders on new candles don't recreate the chart.
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const ema20Series = ema20SeriesRef.current;
    const ema50Series = ema50SeriesRef.current;
    if (!candleSeries || !ema20Series || !ema50Series || candles.length === 0) return;

    const bars = candles.map((c) => ({
      time: c.t as Time,
      open: c.open,
      high: c.hi,
      low: c.lo,
      close: c.close,
    }));
    candleSeries.setData(bars);

    const closes = candles.map((c) => c.close);
    const ema20 = smooth(closes, 0.15);
    const ema50 = smooth(closes, 0.08);
    ema20Series.setData(candles.map((c, i) => ({ time: c.t as Time, value: ema20[i] })));
    ema50Series.setData(candles.map((c, i) => ({ time: c.t as Time, value: ema50[i] })));

    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  const clearDrawings = () => {
    const candleSeries = candleSeriesRef.current;
    if (candleSeries) {
      for (const line of hLinesRef.current) candleSeries.removePriceLine(line);
    }
    for (const t of trendLinesRef.current) chartRef.current?.removeSeries(t.series);
    hLinesRef.current = [];
    trendLinesRef.current = [];
    pendingPointRef.current = null;
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 pb-1">
        <ToolButton
          active={tool === "trendline"}
          onClick={() => setTool((t) => (t === "trendline" ? "none" : "trendline"))}
          title="Draw trendline (click two points)"
        >
          <TrendingUp className="h-3 w-3" strokeWidth={2.25} />
        </ToolButton>
        <ToolButton
          active={tool === "hline"}
          onClick={() => setTool((t) => (t === "hline" ? "none" : "hline"))}
          title="Draw horizontal line (click a price)"
        >
          <Minus className="h-3 w-3" strokeWidth={2.25} />
        </ToolButton>
        <ToolButton active={false} onClick={clearDrawings} title="Clear drawings">
          <Eraser className="h-3 w-3" strokeWidth={2.25} />
        </ToolButton>
        {tool !== "none" && (
          <span className="text-[9px] text-text3">
            {tool === "trendline" ? "Click two points to draw a trendline" : "Click a price to draw a horizontal line"}
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className={cn("relative min-h-[100px] flex-1", loading && "opacity-60")}
      />
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-[3px] border",
        active ? "border-primary bg-accent text-primary" : "border-border text-text2 hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
