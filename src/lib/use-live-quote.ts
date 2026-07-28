"use client";

import { useEffect, useRef, useState } from "react";
import { isMarketOpen } from "./format";
import type { LiveMarketData } from "./technicals";
import type { OhlcvBar } from "./yahoo-finance";

const POLL_MS = 45_000;

export interface LiveQuoteState {
  live: LiveMarketData | null;
  bars: OhlcvBar[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
}

/** Chart tab labels -> Yahoo range params. */
export type ChartRangeKey = "1D" | "1M" | "6M" | "1Y" | "5Y";
export const RANGE_MAP: Record<ChartRangeKey, string> = {
  "1D": "1d",
  "1M": "1mo",
  "6M": "6mo",
  "1Y": "1y",
  "5Y": "5y",
};

/**
 * Polls /api/market-data/{symbol} — live wins, last-known-good is the fallback
 * (mirrors use-live-news.ts). Pass `enabled: false` to skip fetching entirely
 * (e.g. BoxChart's "1D" tab, which stays on placeholder data since a daily-bar
 * endpoint can't produce a useful intraday view — no point calling the route).
 */
export function useLiveQuote(symbol: string, chartRange: ChartRangeKey, enabled: boolean = true) {
  const [state, setState] = useState<LiveQuoteState>({
    live: null,
    bars: [],
    loading: true,
    error: null,
    lastFetchedAt: null,
  });
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let cancelled = false;
    const yahooRange = RANGE_MAP[chartRange];

    async function poll() {
      if (inFlight.current) return;
      if (document.visibilityState === "hidden") return;
      inFlight.current = true;
      try {
        const res = await fetch(`/api/market-data/${symbol}?range=${yahooRange}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setState({ live: json.live, bars: json.bars, loading: false, error: null, lastFetchedAt: new Date() });
      } catch (err) {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : String(err) }));
      } finally {
        inFlight.current = false;
      }
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    poll();

    const interval = setInterval(() => {
      if (!isMarketOpen()) return;
      poll();
    }, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [symbol, chartRange, enabled]);

  return state;
}
