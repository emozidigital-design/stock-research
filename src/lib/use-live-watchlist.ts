"use client";

import { useEffect, useRef, useState } from "react";
import { isMarketOpen } from "./format";
import type { BatchQuote } from "@/app/api/market-data/batch/route";

const POLL_MS = 45_000;

/**
 * Polls /api/market-data/batch for the whole watchlist (price/%chg only —
 * mirrors use-live-quote.ts's "live wins, last-known-good is the fallback"
 * pattern, keyed by symbol instead of a single stock). Pass extraSymbols for
 * user-added (non-hardcoded) stocks to include in the same batch/poll.
 */
export function useLiveWatchlist(extraSymbols: string[] = []) {
  const [quotes, setQuotes] = useState<Map<string, BatchQuote>>(new Map());
  const inFlight = useRef(false);
  const extraKey = extraSymbols.join(",");

  useEffect(() => {
    let cancelled = false;
    const query = extraKey ? `?symbols=${encodeURIComponent(extraKey)}` : "";

    async function poll() {
      if (inFlight.current) return;
      if (document.visibilityState === "hidden") return;
      inFlight.current = true;
      try {
        const res = await fetch(`/api/market-data/batch${query}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const next = new Map<string, BatchQuote>();
        for (const q of json.quotes as BatchQuote[]) next.set(q.symbol, q);
        setQuotes(next);
      } catch {
        // keep last-known-good quotes on failure
      } finally {
        inFlight.current = false;
      }
    }

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
  }, [extraKey]);

  return quotes;
}
