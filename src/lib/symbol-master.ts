// Server-only fetch/parse for NSE's public equity list — a free, unprotected
// static CSV archive (unlike the option-chain API, which sits behind Akamai
// bot-management and isn't viable for free access). Refreshed rarely: new
// listings/delistings are infrequent, so a long in-memory cache is enough.
import { YahooFinanceError } from "./yahoo-finance";

const SYMBOL_MASTER_URL = "https://archives.nseindia.com/content/equities/EQUITY_L.csv";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SymbolMasterEntry {
  symbol: string;
  name: string;
  isin: string;
}

let cachedSymbols: { entries: SymbolMasterEntry[]; fetchedAt: number } | null = null;

function parseCsv(text: string): SymbolMasterEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const entries: SymbolMasterEntry[] = [];
  // Skip header row; columns are SYMBOL,NAME OF COMPANY,SERIES,DATE OF LISTING,
  // PAID UP VALUE,MARKET LOT,ISIN NUMBER,FACE VALUE — flat, no embedded commas.
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 7) continue;
    const symbol = cols[0].trim();
    const name = cols[1].trim();
    const isin = cols[6].trim();
    if (!symbol || !name) continue;
    entries.push({ symbol, name, isin });
  }
  return entries;
}

export async function fetchSymbolMaster(): Promise<SymbolMasterEntry[]> {
  if (cachedSymbols && Date.now() - cachedSymbols.fetchedAt < CACHE_TTL_MS) {
    return cachedSymbols.entries;
  }

  let res: Response;
  try {
    res = await fetch(SYMBOL_MASTER_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
  } catch (err) {
    throw new YahooFinanceError(`Network error fetching NSE symbol master: ${err}`, "network");
  }
  if (!res.ok) throw new YahooFinanceError(`NSE symbol master returned ${res.status}`, "malformed");

  const text = await res.text();
  const entries = parseCsv(text);
  if (entries.length === 0) throw new YahooFinanceError("NSE symbol master parsed to zero entries", "empty");

  cachedSymbols = { entries, fetchedAt: Date.now() };
  return entries;
}

export async function searchSymbols(query: string, limit = 20): Promise<SymbolMasterEntry[]> {
  const entries = await fetchSymbolMaster();
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const matches: SymbolMasterEntry[] = [];
  for (const e of entries) {
    if (e.symbol.startsWith(q) || e.name.toUpperCase().includes(q)) {
      matches.push(e);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}

/**
 * Filters a candidate symbol list down to ones that actually exist on NSE —
 * drops garbage rather than erroring, since callers pass user/localStorage-
 * sourced symbols. If the NSE master fetch itself fails (network blip, rate
 * limit), candidates pass through unvalidated rather than being dropped —
 * otherwise a transient NSE outage would silently stop live polling for every
 * added stock on every batch route poll until the fetch recovers.
 */
export async function validateSymbols(candidates: string[]): Promise<string[]> {
  if (candidates.length === 0) return [];
  const entries = await fetchSymbolMaster().catch(() => null);
  if (entries === null) return candidates;
  const known = new Set(entries.map((e) => e.symbol));
  return candidates.filter((s) => known.has(s));
}

/**
 * Resolves the full symbol list for a batch route: the fixed watchlist plus
 * validated extra symbols from a `?symbols=` query param. Shared by
 * market-data/batch and fundamentals/batch so the parsing/validation logic
 * can't drift between them.
 */
export async function resolveBatchSymbols(request: Request, staticSymbols: string[]): Promise<string[]> {
  const { searchParams } = new URL(request.url);
  const extraRaw = (searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const staticSet = new Set(staticSymbols);
  const extra = await validateSymbols(extraRaw.filter((s) => !staticSet.has(s)));
  return [...staticSymbols, ...extra];
}
