// Builds a minimal-but-valid Stock for a symbol with no hand-authored mock
// row (i.e. anything outside the 18-stock watchlist in mock-data.ts). Every
// field is a safe, honest default — never undefined, since risk-verdict-engine.ts
// calls array methods (filter/reduce) directly with no null-guard and would
// throw a TypeError on an undefined array. Live price/fundamentals/quarters
// merge on top of this the same way they do for watchlist stocks.
import type { Stock } from "@/types/stock";

export function buildBareStock(symbol: string, name: string): Stock {
  return {
    symbol,
    name,
    sector: "—",
    exchange: "NSE",
    cmp: 0,
    changeAbs: 0,
    changePct: 0,
    volVs20d: 0,
    week52Low: 0,
    week52High: 0,
    mcapCr: 0,
    isFo: false,
    circuitState: "none",

    pe: 0,
    pb: 0,
    evEbitda: 0,
    divYield: 0,
    roe: 0,
    roce: 0,
    de: 0,
    epsTtm: 0,
    faceValue: 0,
    betaOneYr: 0,
    creditRating: "—",
    ceo: "—",

    rsi14: 50,
    resistance: [],
    support: [],
    above20dma: false,
    above50dma: false,
    above200dma: false,

    quarters: [],
    peers: [],

    oiChain: [],
    pcr: 0,
    maxPain: 0,
    ivPercentile: 0,

    ownershipTrend: [],
    promoterPledge: 0,
    bulkDeals: [],

    corporateActions: [],

    riskFlags: [],
    news: [],
    brokerCalls: [],

    verdict: "Neutral",
    verdictReason: "Insufficient data — this symbol is outside the tracked watchlist.",
    entry: 0,
    stopLoss: 0,
    target: 0,
    verdictUpdatedAt: new Date(0).toISOString(),
  };
}
