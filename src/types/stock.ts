// Data shapes mirror PRD §3.1–3.3 field requirements so mock data
// can be swapped for real API responses without touching UI code.

export type NewsTag =
  | "RESULTS"
  | "CORP_ACTION"
  | "COMPLIANCE"
  | "ANNOUNCEMENT"
  | "GOVT_POLICY"
  | "GLOBAL"
  | "MARKET_TREND"
  | "BROKER_CALL"
  | "INSIDER_BULK";

export interface NewsItem {
  id: string;
  tags: NewsTag[];
  headline: string;
  source: string;
  date: string; // ISO
  stocks: string[];
}

export type RiskSeverity = "high" | "med" | "low";

export interface RiskFlag {
  id: string;
  severity: RiskSeverity;
  title: string;
  detail: string;
}

/** Note: PRD §3.2's risk matrix also wants probability/impact — computed by the rule engine (see risk-verdict-engine.ts), not stored on the mock Stock type. */

export type BrokerRating = "buy" | "hold" | "sell";

export interface BrokerCall {
  brokerage: string;
  rating: BrokerRating;
  target: number;
}

export interface QuarterlyFinancial {
  label: string; // e.g. "Q2'26"
  revenue: number;
  ebitda: number;
  pat: number;
  eps: number;
}

export interface PeerComp {
  symbol: string;
  pe: number;
  pb: number;
  evEbitda: number;
  mcapCr: number;
}

export interface OwnershipQuarter {
  label: string;
  promoter: number;
  fii: number;
  dii: number;
  retail: number;
}

export interface BulkDeal {
  date: string;
  party: string;
  type: "Buy" | "Sell";
  quantity: number;
  price: number;
}

export interface CorporateAction {
  type: "Dividend" | "Split" | "Bonus" | "Buyback";
  detail: string;
  date: string;
  status: "upcoming" | "past";
}

export type CircuitState = "none" | "upper" | "lower";

export interface OiPoint {
  strike: number;
  callOi: number;
  putOi: number;
}

export type Verdict = "Bullish" | "Neutral" | "Bearish";

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  exchange: "NSE" | "BSE";
  cmp: number;
  changeAbs: number;
  changePct: number;
  volVs20d: number; // % vs 20D avg
  week52Low: number;
  week52High: number;
  mcapCr: number;
  isFo: boolean;
  circuitState: CircuitState;

  // Snapshot / ratios
  pe: number;
  pb: number;
  evEbitda: number;
  divYield: number;
  roe: number;
  roce: number;
  de: number;
  epsTtm: number;
  faceValue: number;
  betaOneYr: number;
  creditRating: string;
  ceo: string;

  // Technicals
  rsi14: number;
  resistance: number[]; // 3, descending from highest
  support: number[]; // 2
  above20dma: boolean;
  above50dma: boolean;
  above200dma: boolean;

  // Fundamentals
  quarters: QuarterlyFinancial[];
  peers: PeerComp[];

  // F&O
  oiChain: OiPoint[];
  pcr: number;
  maxPain: number;
  ivPercentile: number;

  // Ownership
  ownershipTrend: OwnershipQuarter[];
  promoterPledge: number;
  bulkDeals: BulkDeal[];

  // Corporate actions
  corporateActions: CorporateAction[];

  // Right rail
  riskFlags: RiskFlag[];
  news: NewsItem[];
  brokerCalls: BrokerCall[];

  // Verdict
  verdict: Verdict;
  verdictReason: string;
  entry: number;
  stopLoss: number;
  target: number;
  verdictUpdatedAt: string;
}

export interface IndexQuote {
  name: string;
  value: number;
  changeAbs: number;
  changePct: number;
}
