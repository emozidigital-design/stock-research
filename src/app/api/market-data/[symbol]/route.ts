import { NextResponse } from "next/server";
import { fetchYahooChart, YahooFinanceError, type YahooRange } from "@/lib/yahoo-finance";
import { buildLiveMarketData } from "@/lib/technicals";
import { stocks } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const VALID_RANGES: YahooRange[] = ["1d", "1mo", "6mo", "1y", "5y"];

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get("range") ?? "1y") as YahooRange;

  // No symbol-master/search index exists yet (top-strip.tsx's search is scoped
  // to the same fixed list), so allowlisting against it avoids forwarding
  // arbitrary strings to Yahoo.
  const known = stocks.some((s) => s.symbol === symbol);
  if (!known) {
    return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 404 });
  }
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: `Invalid range: ${range}` }, { status: 400 });
  }

  try {
    const { meta, bars } = await fetchYahooChart(symbol, range);
    const live = buildLiveMarketData(meta, bars);
    return NextResponse.json({ symbol, range, live, bars, meta }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof YahooFinanceError) {
      const status = err.kind === "not_found" ? 404 : err.kind === "empty" ? 204 : 502;
      return NextResponse.json({ error: err.message, kind: err.kind }, { status });
    }
    return NextResponse.json({ error: "Unexpected error fetching market data" }, { status: 500 });
  }
}
