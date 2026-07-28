import { NextResponse } from "next/server";
import { fetchYahooFundamentals, fetchYahooQuarters, type YahooFundamentals } from "@/lib/yahoo-fundamentals";
import { YahooFinanceError } from "@/lib/yahoo-finance";
import { stocks } from "@/lib/mock-data";
import type { QuarterlyFinancial } from "@/types/stock";

export const dynamic = "force-dynamic";

export interface FundamentalsQuote extends YahooFundamentals {
  symbol: string;
  quarters: QuarterlyFinancial[];
}

// Fundamentals change rarely (not intraday) — polled at a much slower client
// interval than the price batch route, but the route itself is stateless per
// request, same as /api/market-data/batch.
export async function GET() {
  const results = await Promise.allSettled(
    stocks.map(async (s): Promise<FundamentalsQuote> => {
      const [fundamentals, quarters] = await Promise.all([
        fetchYahooFundamentals(s.symbol),
        // Isolated from the ratios fetch — a quarters failure shouldn't
        // discard otherwise-successful ratio data for the same symbol.
        fetchYahooQuarters(s.symbol).catch(() => [] as QuarterlyFinancial[]),
      ]);
      return { symbol: s.symbol, ...fundamentals, quarters };
    })
  );

  const fundamentals: FundamentalsQuote[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") fundamentals.push(r.value);
    else failed.push(stocks[i].symbol);
  });

  if (fundamentals.length === 0) {
    const firstErr = results[0].status === "rejected" ? results[0].reason : null;
    const message = firstErr instanceof YahooFinanceError ? firstErr.message : "Failed to fetch any fundamentals";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ fundamentals, failed }, { headers: { "Cache-Control": "no-store" } });
}
