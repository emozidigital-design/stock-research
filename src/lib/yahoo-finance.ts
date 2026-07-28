// Server-only fetch/parse for Yahoo Finance's unofficial chart endpoint.
// No API key needed; NSE symbols resolve via a ".NS" suffix. This endpoint is
// undocumented and could change without notice — an accepted tradeoff for a
// free, keyless data source (see architecture-phasewise.md's vendor gap notes).

export type YahooRange = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "10y" | "ytd" | "max";
export type YahooInterval = "1m" | "5m" | "15m" | "30m" | "60m" | "1d" | "1wk" | "1mo";

export interface YahooQuoteMeta {
  symbol: string;
  currency: string;
  exchangeName: string;
  regularMarketPrice: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  regularMarketVolume: number;
}

export interface OhlcvBar {
  t: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YahooChartData {
  meta: YahooQuoteMeta;
  bars: OhlcvBar[]; // ascending by time, null-OHLC days filtered out
}

export class YahooFinanceError extends Error {
  constructor(
    message: string,
    public readonly kind: "network" | "not_found" | "malformed" | "empty"
  ) {
    super(message);
  }
}

function toYahooSymbol(symbol: string): string {
  return /\.(NS|BO)$/i.test(symbol) ? symbol : `${symbol}.NS`;
}

export async function fetchYahooChart(
  symbol: string,
  range: YahooRange,
  interval: YahooInterval = "1d"
): Promise<YahooChartData> {
  const ySymbol = toYahooSymbol(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?interval=${interval}&range=${range}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
  } catch (err) {
    throw new YahooFinanceError(`Network error fetching ${ySymbol}: ${err}`, "network");
  }

  if (res.status === 404) throw new YahooFinanceError(`Symbol not found: ${ySymbol}`, "not_found");
  if (!res.ok) throw new YahooFinanceError(`Yahoo returned ${res.status} for ${ySymbol}`, "malformed");

  const json = await res.json().catch(() => null);
  const result = json?.chart?.result?.[0];
  if (!result?.meta) throw new YahooFinanceError(`Malformed response for ${ySymbol}`, "malformed");

  const meta = result.meta;
  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const opens: (number | null)[] = quote.open ?? [];
  const highs: (number | null)[] = quote.high ?? [];
  const lows: (number | null)[] = quote.low ?? [];
  const closes: (number | null)[] = quote.close ?? [];
  const volumes: (number | null)[] = quote.volume ?? [];

  const bars: OhlcvBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] == null || opens[i] == null || highs[i] == null || lows[i] == null) continue;
    bars.push({
      t: timestamps[i],
      open: opens[i]!,
      high: highs[i]!,
      low: lows[i]!,
      close: closes[i]!,
      volume: volumes[i] ?? 0,
    });
  }
  if (bars.length === 0) throw new YahooFinanceError(`No usable bars for ${ySymbol}`, "empty");

  return {
    meta: {
      symbol: meta.symbol,
      currency: meta.currency,
      exchangeName: meta.exchangeName,
      regularMarketPrice: meta.regularMarketPrice,
      previousClose: meta.previousClose ?? meta.chartPreviousClose,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      regularMarketVolume: meta.regularMarketVolume,
    },
    bars,
  };
}
