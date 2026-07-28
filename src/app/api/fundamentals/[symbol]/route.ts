import { NextResponse } from "next/server";
import { fetchYahooFundamentalsWithQuarters } from "@/lib/yahoo-fundamentals";
import { YahooFinanceError } from "@/lib/yahoo-finance";
import { stocks } from "@/lib/mock-data";
import { fetchSymbolMaster } from "@/lib/symbol-master";

export const dynamic = "force-dynamic";

// Single-symbol counterpart to /api/fundamentals/batch — used for stocks
// selected via search that aren't in the fixed watchlist (the batch route
// only ever loops over the watchlist array).
export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const isWatchlisted = stocks.some((s) => s.symbol === symbol);
  const known = isWatchlisted || (await fetchSymbolMaster().then(
    (entries) => entries.some((e) => e.symbol === symbol),
    () => false
  ));
  if (!known) {
    return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 404 });
  }

  try {
    const fundamentals = await fetchYahooFundamentalsWithQuarters(symbol);
    return NextResponse.json({ fundamentals }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof YahooFinanceError) {
      const status = err.kind === "not_found" ? 404 : err.kind === "empty" ? 204 : 502;
      return NextResponse.json({ error: err.message, kind: err.kind }, { status });
    }
    return NextResponse.json({ error: "Unexpected error fetching fundamentals" }, { status: 500 });
  }
}
