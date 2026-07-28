import { NextResponse } from "next/server";
import { fetchYahooChart, YahooFinanceError } from "@/lib/yahoo-finance";
import { stocks } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export interface BatchQuote {
  symbol: string;
  cmp: number;
  changeAbs: number;
  changePct: number;
}

// Lightweight quote-only fetch for the whole watchlist (sidebar needs just
// price/%chg, not full technicals) — one round trip instead of N client polls.
export async function GET() {
  const results = await Promise.allSettled(
    stocks.map(async (s): Promise<BatchQuote> => {
      const { meta } = await fetchYahooChart(s.symbol, "1d");
      const changeAbs = meta.regularMarketPrice - meta.previousClose;
      return {
        symbol: s.symbol,
        cmp: meta.regularMarketPrice,
        changeAbs,
        changePct: (changeAbs / meta.previousClose) * 100,
      };
    })
  );

  const quotes: BatchQuote[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") quotes.push(r.value);
    else failed.push(stocks[i].symbol);
  });

  if (quotes.length === 0) {
    const firstErr = results[0].status === "rejected" ? results[0].reason : null;
    const message = firstErr instanceof YahooFinanceError ? firstErr.message : "Failed to fetch any quotes";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ quotes, failed }, { headers: { "Cache-Control": "no-store" } });
}
