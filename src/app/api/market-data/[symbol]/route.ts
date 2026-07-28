import { NextResponse } from "next/server";
import { fetchYahooChart, YahooFinanceError, type YahooRange } from "@/lib/yahoo-finance";
import { buildLiveMarketData } from "@/lib/technicals";
import { stocks } from "@/lib/mock-data";
import { fetchSymbolMaster } from "@/lib/symbol-master";

export const dynamic = "force-dynamic";

const VALID_RANGES: YahooRange[] = ["1d", "1mo", "6mo", "1y", "5y"];

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get("range") ?? "1y") as YahooRange;

  // Allowlist against the full NSE symbol master (not just the watchlist) so
  // searched-but-not-hardcoded stocks can still get live data, while still
  // avoiding forwarding arbitrary strings to Yahoo.
  const isWatchlisted = stocks.some((s) => s.symbol === symbol);
  const known = isWatchlisted || (await fetchSymbolMaster().then(
    (entries) => entries.some((e) => e.symbol === symbol),
    () => false
  ));
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
