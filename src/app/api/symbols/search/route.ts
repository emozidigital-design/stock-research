import { NextResponse } from "next/server";
import { searchSymbols } from "@/lib/symbol-master";
import { YahooFinanceError } from "@/lib/yahoo-finance";

export const dynamic = "force-dynamic";

// Search happens server-side so the client never downloads the full ~2,400-row
// NSE symbol list — mirrors the "don't ship the whole payload" pattern already
// used by the batch market-data/fundamentals routes.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const results = await searchSymbols(q, 20);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof YahooFinanceError ? err.message : "Failed to search symbols";
    return NextResponse.json({ results: [], error: message }, { status: 200 });
  }
}
