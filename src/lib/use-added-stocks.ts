"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "watchlist:added";

export interface AddedStock {
  symbol: string;
  name: string;
}

function isAddedStockArray(value: unknown): value is AddedStock[] {
  return (
    Array.isArray(value) &&
    value.every((v) => v && typeof v === "object" && typeof (v as AddedStock).symbol === "string" && typeof (v as AddedStock).name === "string")
  );
}

/**
 * Persists user-added, non-watchlist symbols to localStorage. First
 * localStorage usage in this codebase — reads happen only inside useEffect
 * (never during render) to avoid a prerender/hydration mismatch, matching
 * dashboard.tsx's existing hydration-safety pattern for lastSync.
 */
export function useAddedStocks() {
  const [added, setAdded] = useState<AddedStock[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (isAddedStockArray(parsed)) setAdded(parsed);
    } catch {
      // localStorage unavailable, or contents corrupted/foreign — stay in-memory-only for this session
    }
  }, []);

  const persist = useCallback((next: AddedStock[]) => {
    setAdded(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore — in-memory state still updates even if persistence fails
    }
  }, []);

  const addStock = useCallback(
    (symbol: string, name: string) => {
      setAdded((prev) => {
        if (prev.some((a) => a.symbol === symbol)) return prev;
        const next = [...prev, { symbol, name }];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeStock = useCallback(
    (symbol: string) => {
      setAdded((prev) => {
        const next = prev.filter((a) => a.symbol !== symbol);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isAdded = useCallback((symbol: string) => added.some((a) => a.symbol === symbol), [added]);

  return { added, addStock, removeStock, isAdded };
}
