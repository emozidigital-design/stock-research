import { NextResponse } from "next/server";
import { fetchYahooFundamentalsWithQuarters, type FundamentalsWithQuarters } from "@/lib/yahoo-fundamentals";
import { YahooFinanceError } from "@/lib/yahoo-finance";
import { stocks } from "@/lib/mock-data";
import { resolveBatchSymbols } from "@/lib/symbol-master";

export const dynamic = "force-dynamic";

export type FundamentalsQuote = FundamentalsWithQuarters;

// Fundamentals change rarely (not intraday) — polled at a much slower client
// interval than the price batch route, but the route itself is stateless per
// request, same as /api/market-data/batch.
export async function GET(request: Request) {
  const symbols = await resolveBatchSymbols(request, stocks.map((s) => s.symbol));
  const results = await Promise.allSettled(symbols.map((s) => fetchYahooFundamentalsWithQuarters(s)));

  const fundamentals: FundamentalsQuote[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") fundamentals.push(r.value);
    else failed.push(symbols[i]);
  });

  if (fundamentals.length === 0) {
    const firstErr = results[0].status === "rejected" ? results[0].reason : null;
    const message = firstErr instanceof YahooFinanceError ? firstErr.message : "Failed to fetch any fundamentals";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ fundamentals, failed }, { headers: { "Cache-Control": "no-store" } });
}
