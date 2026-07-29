"use client";

import { useEffect, useRef, useState } from "react";
import type { FundamentalsQuote } from "@/app/api/fundamentals/batch/route";
import type { Stock } from "@/types/stock";

const POLL_MS = 6 * 60 * 60 * 1000; // fundamentals don't move intraday — 6h poll vs. price's 45s

/**
 * Polls /api/fundamentals/batch for the whole watchlist. Mirrors
 * use-live-watchlist.ts's map-keyed, last-known-good-on-failure pattern, but
 * with no isMarketOpen() gate — fundamentals are meaningful even when the
 * market's closed, so it polls on its own timer regardless of market hours.
 * Pass extraSymbols for user-added (non-hardcoded) stocks to include.
 */
export function useLiveFundamentals(extraSymbols: string[] = []) {
  const [fundamentals, setFundamentals] = useState<Map<string, FundamentalsQuote>>(new Map());
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
        const res = await fetch(`/api/fundamentals/batch${query}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const next = new Map<string, FundamentalsQuote>();
        for (const f of json.fundamentals as FundamentalsQuote[]) next.set(f.symbol, f);
        setFundamentals(next);
      } catch {
        // keep last-known-good fundamentals on failure
      } finally {
        inFlight.current = false;
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);

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

  return fundamentals;
}

/**
 * Single-symbol counterpart to useLiveFundamentals, for stocks selected via
 * search that aren't in the watchlist (the batch route/hook only ever covers
 * the watchlist array). Pass `enabled: false` to skip fetching entirely.
 */
export function useLiveSymbolFundamentals(symbol: string, enabled: boolean) {
  const [fundamentals, setFundamentals] = useState<FundamentalsQuote | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setFundamentals(null);
      return;
    }
    let cancelled = false;

    async function poll() {
      if (inFlight.current) return;
      if (document.visibilityState === "hidden") return;
      inFlight.current = true;
      try {
        const res = await fetch(`/api/fundamentals/${symbol}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setFundamentals(json.fundamentals as FundamentalsQuote);
      } catch {
        // keep last-known-good fundamentals on failure
      } finally {
        inFlight.current = false;
      }
    }

    setFundamentals(null);
    poll();
    const interval = setInterval(poll, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [symbol, enabled]);

  return fundamentals;
}

/**
 * Merges a fundamentals quote onto a base Stock, field by field — a partial
 * Yahoo response (e.g. a null ROE) must never overwrite a good mock value
 * with null/NaN, so each field only applies when the live value is present.
 */
export function mergeFundamentals(base: Stock, live: FundamentalsQuote | undefined): Stock {
  if (!live) return base;
  return {
    ...base,
    pe: live.pe ?? base.pe,
    pb: live.pb ?? base.pb,
    evEbitda: live.evEbitda ?? base.evEbitda,
    divYield: live.divYield ?? base.divYield,
    roe: live.roe ?? base.roe,
    de: live.de ?? base.de,
    epsTtm: live.epsTtm ?? base.epsTtm,
    betaOneYr: live.betaOneYr ?? base.betaOneYr,
    mcapCr: live.mcapCr ?? base.mcapCr,
    brokerCalls: live.brokerCalls.length > 0 ? live.brokerCalls : base.brokerCalls,
    quarters: live.quarters.length > 0 ? live.quarters : base.quarters,
  };
}
