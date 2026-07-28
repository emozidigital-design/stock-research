"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { clientDb } from "./firebase-client";
import type { NewsItem } from "@/types/stock";

/** Live Firestore subscription for a symbol's news, replacing the mock `stock.news` array once the pipeline is populated. */
export function useLiveNews(symbol: string) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(clientDb, "news"),
      where("stockSymbols", "array-contains", symbol),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: NewsItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            tags: data.tags ?? [],
            headline: data.headline,
            source: data.source,
            date: data.date,
            stocks: data.stockSymbols ?? [],
          };
        });
        setNews(items);
        setLoading(false);
      },
      (error) => {
        console.error(`useLiveNews(${symbol}) query failed:`, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [symbol]);

  return { news, loading };
}
