// Server-only fetch/parse for Yahoo Finance's quoteSummary endpoint — unlike
// the chart endpoint (yahoo-finance.ts), this one requires a cookie+crumb
// handshake. No API key involved; still free/keyless, just an extra request
// flow. Undocumented/unofficial, same accepted risk as yahoo-finance.ts.
import type { BrokerCall, BrokerRating, QuarterlyFinancial } from "@/types/stock";
import { YahooFinanceError } from "./yahoo-finance";

const CRUMB_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedCrumb: { crumb: string; cookieHeader: string; fetchedAt: number } | null = null;

async function getYahooCrumb(): Promise<{ crumb: string; cookieHeader: string }> {
  if (cachedCrumb && Date.now() - cachedCrumb.fetchedAt < CRUMB_TTL_MS) {
    return cachedCrumb;
  }

  let cookieRes: Response;
  try {
    cookieRes = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "manual",
    });
  } catch (err) {
    throw new YahooFinanceError(`Network error fetching Yahoo session cookie: ${err}`, "network");
  }

  const setCookies = cookieRes.headers.getSetCookie();
  const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
  if (!cookieHeader) throw new YahooFinanceError("No session cookie returned by Yahoo", "malformed");

  let crumbRes: Response;
  try {
    crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader },
    });
  } catch (err) {
    throw new YahooFinanceError(`Network error fetching Yahoo crumb: ${err}`, "network");
  }
  const crumb = await crumbRes.text();
  if (!crumb || crumb.includes("Invalid Crumb")) throw new YahooFinanceError("Failed to obtain Yahoo crumb", "malformed");

  cachedCrumb = { crumb, cookieHeader, fetchedAt: Date.now() };
  return cachedCrumb;
}

export interface YahooFundamentals {
  pe: number | null;
  pb: number | null;
  evEbitda: number | null;
  divYield: number | null;
  roe: number | null;
  de: number | null;
  epsTtm: number | null;
  betaOneYr: number | null;
  mcapCr: number | null;
  brokerCalls: BrokerCall[];
}

interface YahooRaw {
  raw?: number;
}

function num(v: YahooRaw | undefined): number | null {
  return typeof v?.raw === "number" ? v.raw : null;
}

export async function fetchYahooFundamentals(symbol: string): Promise<YahooFundamentals> {
  const { crumb, cookieHeader } = await getYahooCrumb();
  const modules = "financialData,defaultKeyStatistics,summaryDetail,recommendationTrend";
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}.NS?modules=${modules}&crumb=${crumb}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    throw new YahooFinanceError(`Network error fetching fundamentals for ${symbol}: ${err}`, "network");
  }

  if (res.status === 404) throw new YahooFinanceError(`Symbol not found: ${symbol}`, "not_found");
  if (!res.ok) throw new YahooFinanceError(`Yahoo returned ${res.status} for ${symbol}`, "malformed");

  const json = await res.json().catch(() => null);
  const result = json?.quoteSummary?.result?.[0];
  if (!result) throw new YahooFinanceError(`Malformed quoteSummary response for ${symbol}`, "malformed");

  const financialData = result.financialData ?? {};
  const keyStats = result.defaultKeyStatistics ?? {};
  const summary = result.summaryDetail ?? {};
  const trend = result.recommendationTrend?.trend?.[0];

  const rawDe = num(financialData.debtToEquity);
  const rawDivYield = num(summary.dividendYield);
  const rawMcap = num(summary.marketCap);

  const targetMean = num(financialData.targetMeanPrice);
  const brokerCalls = trend ? buildBrokerCallsFromTrend(trend, targetMean) : [];

  return {
    pe: num(summary.trailingPE),
    pb: num(keyStats.priceToBook),
    evEbitda: num(keyStats.enterpriseToEbitda),
    divYield: rawDivYield != null ? rawDivYield * 100 : null,
    roe: num(financialData.returnOnEquity) != null ? num(financialData.returnOnEquity)! * 100 : null,
    de: rawDe != null ? rawDe / 100 : null,
    epsTtm: num(keyStats.trailingEps),
    betaOneYr: num(keyStats.beta) ?? num(keyStats.beta3Year),
    mcapCr: rawMcap != null ? rawMcap / 1e7 : null,
    brokerCalls,
  };
}

/** "3Q2025" -> "Q3'25", matching mock-data.ts's existing label convention. */
function formatQuarterLabel(calendarQuarter: string): string {
  const match = /^(\d)Q(\d{4})$/.exec(calendarQuarter);
  if (!match) return calendarQuarter;
  const [, q, year] = match;
  return `Q${q}'${year.slice(2)}`;
}

/**
 * EBITDA is uniformly zero/undefined in Yahoo's quarterly income statement
 * for NSE tickers (confirmed across 5 sectors) — ships as 0, which
 * box-fundamentals.tsx's existing hasEbitda gate already hides cleanly.
 */
export async function fetchYahooQuarters(symbol: string): Promise<QuarterlyFinancial[]> {
  const { crumb, cookieHeader } = await getYahooCrumb();
  const modules = "incomeStatementHistoryQuarterly,earnings";
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}.NS?modules=${modules}&crumb=${crumb}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    throw new YahooFinanceError(`Network error fetching quarters for ${symbol}: ${err}`, "network");
  }

  if (res.status === 404) throw new YahooFinanceError(`Symbol not found: ${symbol}`, "not_found");
  if (!res.ok) throw new YahooFinanceError(`Yahoo returned ${res.status} for ${symbol}`, "malformed");

  const json = await res.json().catch(() => null);
  const result = json?.quoteSummary?.result?.[0];
  const statements = result?.incomeStatementHistoryQuarterly?.incomeStatementHistory;
  if (!Array.isArray(statements) || statements.length === 0) {
    throw new YahooFinanceError(`No quarterly income statements for ${symbol}`, "empty");
  }

  const epsByDate = new Map<string, number>();
  const quarterlyEarnings = result?.earnings?.earningsChart?.quarterly ?? [];
  for (const e of quarterlyEarnings) {
    const dateKey = e.periodEndDate?.fmt;
    const eps = num(e.actual);
    if (dateKey && eps != null) epsByDate.set(dateKey, eps);
  }

  const quarters: QuarterlyFinancial[] = statements
    .map((stmt: { endDate?: { fmt?: string }; totalRevenue?: YahooRaw; netIncome?: YahooRaw }) => {
      const dateKey = stmt.endDate?.fmt;
      const revenueRaw = num(stmt.totalRevenue);
      const netIncomeRaw = num(stmt.netIncome);
      if (!dateKey || revenueRaw == null || netIncomeRaw == null) return null;

      const [year, month, day] = dateKey.split("-").map(Number);
      const quarterOfYear = Math.ceil(month / 3);
      const calendarQuarter = `${quarterOfYear}Q${year}`;

      return {
        label: formatQuarterLabel(calendarQuarter),
        revenue: revenueRaw / 1e7,
        ebitda: 0,
        pat: netIncomeRaw / 1e7,
        eps: epsByDate.get(dateKey) ?? 0,
        _sortKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      };
    })
    .filter((q: (QuarterlyFinancial & { _sortKey: string }) | null): q is QuarterlyFinancial & { _sortKey: string } => q !== null)
    .sort((a, b) => a._sortKey.localeCompare(b._sortKey)) // oldest-to-newest, matching mock's array order
    .map(({ _sortKey, ...q }) => q);

  if (quarters.length === 0) throw new YahooFinanceError(`No usable quarters for ${symbol}`, "empty");
  return quarters;
}

interface RecommendationTrendBucket {
  strongBuy?: number;
  buy?: number;
  hold?: number;
  sell?: number;
  strongSell?: number;
}

/** Synthesizes a BrokerCall[]-shaped array from Yahoo's aggregate recommendation counts — no per-brokerage identity is available for free, so each bucket becomes one row (e.g. "30 Analysts" for combined buy+strongBuy). */
export function buildBrokerCallsFromTrend(trend: RecommendationTrendBucket, targetMean: number | null): BrokerCall[] {
  const buy = (trend.strongBuy ?? 0) + (trend.buy ?? 0);
  const hold = trend.hold ?? 0;
  const sell = (trend.sell ?? 0) + (trend.strongSell ?? 0);
  const target = targetMean ?? 0;

  const buckets: { rating: BrokerRating; count: number }[] = [
    { rating: "buy", count: buy },
    { rating: "hold", count: hold },
    { rating: "sell", count: sell },
  ];

  return buckets
    .filter((b) => b.count > 0)
    .map((b) => ({
      brokerage: `${b.count} Analyst${b.count === 1 ? "" : "s"}`,
      rating: b.rating,
      target,
    }));
}
