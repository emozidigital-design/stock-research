import type { IndexQuote, Stock } from "@/types/stock";

export const indices: IndexQuote[] = [
  { name: "NIFTY 50", value: 24812.35, changeAbs: 142.6, changePct: 0.58 },
  { name: "SENSEX", value: 81467.92, changeAbs: 468.15, changePct: 0.58 },
  { name: "BANK NIFTY", value: 52904.1, changeAbs: -88.4, changePct: -0.17 },
  { name: "INDIA VIX", value: 13.28, changeAbs: -0.42, changePct: -3.06 },
];

const reliance: Stock = {
  symbol: "RELIANCE",
  name: "Reliance Industries Ltd",
  sector: "Energy",
  exchange: "NSE",
  cmp: 2946.15,
  changeAbs: 53.2,
  changePct: 1.84,
  volVs20d: 38,
  week52Low: 2220,
  week52High: 3105,
  mcapCr: 1994000,
  isFo: true,
  circuitState: "none",

  pe: 24.6,
  pb: 2.31,
  evEbitda: 12.4,
  divYield: 0.42,
  roe: 9.8,
  roce: 11.2,
  de: 0.38,
  epsTtm: 119.8,
  faceValue: 10,
  betaOneYr: 0.92,
  creditRating: "AAA/Stable",
  ceo: "M. Ambani",

  rsi14: 61.2,
  resistance: [3105, 3020, 2975],
  support: [2890, 2820],
  above20dma: true,
  above50dma: true,
  above200dma: false,

  quarters: [
    { label: "Q3'25", revenue: 244510, ebitda: 43760, pat: 18951, eps: 28.0 },
    { label: "Q4'25", revenue: 236900, ebitda: 40150, pat: 17265, eps: 25.5 },
    { label: "Q1'26", revenue: 241180, ebitda: 42880, pat: 18540, eps: 27.4 },
    { label: "Q2'26", revenue: 248660, ebitda: 45210, pat: 19878, eps: 29.4 },
  ],
  peers: [
    { symbol: "ONGC", pe: 8.2, pb: 1.1, evEbitda: 4.8, mcapCr: 340000 },
    { symbol: "BPCL", pe: 9.4, pb: 1.9, evEbitda: 5.6, mcapCr: 118000 },
    { symbol: "IOC", pe: 7.8, pb: 1.4, evEbitda: 5.1, mcapCr: 210000 },
    { symbol: "GAIL", pe: 11.6, pb: 1.7, evEbitda: 6.9, mcapCr: 128000 },
  ],

  oiChain: [
    { strike: 2800, callOi: 55, putOi: 38 },
    { strike: 2850, callOi: 70, putOi: 52 },
    { strike: 2900, callOi: 88, putOi: 65 },
    { strike: 2950, callOi: 60, putOi: 95 },
    { strike: 3000, callOi: 42, putOi: 78 },
    { strike: 3050, callOi: 30, putOi: 48 },
  ],
  pcr: 1.18,
  maxPain: 2900,
  ivPercentile: 42,

  ownershipTrend: [
    { label: "Q4'25", promoter: 50.3, fii: 20.7, dii: 14.0, retail: 15.0 },
    { label: "Q1'26", promoter: 50.3, fii: 21.3, dii: 14.3, retail: 14.1 },
    { label: "Q2'26", promoter: 50.3, fii: 22.1, dii: 14.6, retail: 13.0 },
  ],
  promoterPledge: 0.0,
  bulkDeals: [
    { date: "2026-07-22", party: "Nippon India MF", type: "Buy", quantity: 1250000, price: 2910 },
    { date: "2026-07-15", party: "SBI Life Insurance", type: "Buy", quantity: 820000, price: 2865 },
  ],

  corporateActions: [
    { type: "Dividend", detail: "₹9/share interim dividend", date: "2026-08-08", status: "upcoming" },
    { type: "Dividend", detail: "₹8/share final FY25", date: "2025-09-12", status: "past" },
  ],

  riskFlags: [
    { id: "r1", severity: "med", title: "Crude oil sensitivity", detail: "O2C margin exposed to Brent volatility above $85/bbl." },
    { id: "r2", severity: "low", title: "Capex cycle", detail: "Jio/Retail capex peak; FCF compression through FY27." },
    { id: "r3", severity: "high", title: "Below 200 DMA", detail: "Long-term trend caution, watch 2,890 support." },
  ],
  news: [
    { id: "n1", tags: ["RESULTS"], headline: "RIL Q2 FY26 PAT up 8.7% YoY to ₹19,878 Cr, beats street estimate of ₹18,900 Cr.", source: "BSE Filing", date: "2026-07-27T09:14:00+05:30", stocks: ["RELIANCE"] },
    { id: "n2", tags: ["BROKER_CALL"], headline: "Morgan Stanley raises target to ₹3,250, maintains Overweight post-Q2 print.", source: "Broker Research", date: "2026-07-27T08:52:00+05:30", stocks: ["RELIANCE"] },
    { id: "n3", tags: ["ANNOUNCEMENT"], headline: "Jio Platforms announces new AI data-centre capex plan worth ₹75,000 Cr in Gujarat.", source: "NSE Filing", date: "2026-07-26T17:30:00+05:30", stocks: ["RELIANCE"] },
    { id: "n4", tags: ["GLOBAL"], headline: "Brent crude slips to $78.4/bbl on OPEC+ supply outlook — positive for refining margins.", source: "Reuters", date: "2026-07-26T14:05:00+05:30", stocks: ["RELIANCE"] },
    { id: "n5", tags: ["CORP_ACTION"], headline: "Board approves ₹9/share interim dividend, record date 8 Aug 2026.", source: "BSE Filing", date: "2026-07-25T16:00:00+05:30", stocks: ["RELIANCE"] },
    { id: "n6", tags: ["MARKET_TREND"], headline: "Energy sector rotation continues as FIIs turn net buyers for 4th straight session.", source: "NSDL Data", date: "2026-07-25T10:20:00+05:30", stocks: ["RELIANCE"] },
    { id: "n7", tags: ["GOVT_POLICY"], headline: "Govt extends windfall tax exemption review on domestic crude — clarity expected by Aug.", source: "PIB", date: "2026-07-24T12:41:00+05:30", stocks: ["RELIANCE"] },
    { id: "n8", tags: ["COMPLIANCE"], headline: "SEBI disposes related-party transaction query re: Reliance Retail Ventures; no action.", source: "SEBI Order", date: "2026-07-23T15:10:00+05:30", stocks: ["RELIANCE"] },
    { id: "n9", tags: ["INSIDER_BULK"], headline: "Nippon India MF picks up 12.5L shares in bulk deal at ₹2,910.", source: "NSE Bulk Deals", date: "2026-07-22T15:45:00+05:30", stocks: ["RELIANCE"] },
  ],
  brokerCalls: [
    { brokerage: "Morgan Stanley", rating: "buy", target: 3250 },
    { brokerage: "Jefferies", rating: "buy", target: 3180 },
    { brokerage: "CLSA", rating: "hold", target: 3010 },
    { brokerage: "Nomura", rating: "buy", target: 3220 },
    { brokerage: "Kotak Inst.", rating: "hold", target: 2980 },
  ],

  verdict: "Bullish",
  verdictReason: "Price above 20D/50D DMA with RSI in bullish-neutral zone (61.2); PCR 1.18 signals put-writer support near 2,900; broker consensus 9 Buy / 0 Sell.",
  entry: 2950,
  stopLoss: 2885,
  target: 3080,
  verdictUpdatedAt: "2026-07-27T09:20:00+05:30",
};

const hdfcbank: Stock = {
  symbol: "HDFCBANK",
  name: "HDFC Bank Ltd",
  sector: "Banking",
  exchange: "NSE",
  cmp: 1687.4,
  changeAbs: 10.4,
  changePct: 0.62,
  volVs20d: 12,
  week52Low: 1380,
  week52High: 1795,
  mcapCr: 1284000,
  isFo: true,
  circuitState: "none",

  pe: 19.8,
  pb: 2.9,
  evEbitda: 0,
  divYield: 1.1,
  roe: 16.4,
  roce: 8.9,
  de: 0.0,
  epsTtm: 85.2,
  faceValue: 1,
  betaOneYr: 0.85,
  creditRating: "AAA/Stable",
  ceo: "S. Jagdishan",

  rsi14: 54.8,
  resistance: [1795, 1750, 1712],
  support: [1660, 1615],
  above20dma: true,
  above50dma: true,
  above200dma: true,

  quarters: [
    { label: "Q3'25", revenue: 84210, ebitda: 0, pat: 16820, eps: 22.1 },
    { label: "Q4'25", revenue: 85960, ebitda: 0, pat: 17110, eps: 22.5 },
    { label: "Q1'26", revenue: 87340, ebitda: 0, pat: 17890, eps: 23.5 },
    { label: "Q2'26", revenue: 89120, ebitda: 0, pat: 18420, eps: 24.2 },
  ],
  peers: [
    { symbol: "ICICIBANK", pe: 18.2, pb: 3.1, evEbitda: 0, mcapCr: 875000 },
    { symbol: "KOTAKBANK", pe: 21.4, pb: 2.6, evEbitda: 0, mcapCr: 365000 },
    { symbol: "AXISBANK", pe: 14.6, pb: 2.2, evEbitda: 0, mcapCr: 352000 },
    { symbol: "SBIN", pe: 10.8, pb: 1.6, evEbitda: 0, mcapCr: 742000 },
  ],

  oiChain: [
    { strike: 1620, callOi: 40, putOi: 62 },
    { strike: 1650, callOi: 58, putOi: 71 },
    { strike: 1680, callOi: 82, putOi: 68 },
    { strike: 1710, callOi: 75, putOi: 44 },
    { strike: 1740, callOi: 52, putOi: 30 },
    { strike: 1770, callOi: 36, putOi: 18 },
  ],
  pcr: 0.94,
  maxPain: 1680,
  ivPercentile: 28,

  ownershipTrend: [
    { label: "Q4'25", promoter: 0, fii: 47.8, dii: 32.1, retail: 20.1 },
    { label: "Q1'26", promoter: 0, fii: 48.4, dii: 32.6, retail: 19.0 },
    { label: "Q2'26", promoter: 0, fii: 48.9, dii: 33.0, retail: 18.1 },
  ],
  promoterPledge: 0,
  bulkDeals: [],

  corporateActions: [
    { type: "Dividend", detail: "₹22/share final FY26", date: "2026-08-20", status: "upcoming" },
  ],

  riskFlags: [
    { id: "r1", severity: "low", title: "NIM compression", detail: "Net interest margin under mild pressure from deposit repricing." },
    { id: "r2", severity: "low", title: "Merger integration", detail: "HDFC Ltd merger integration costs tapering, minor drag remains." },
  ],
  news: [
    { id: "n1", tags: ["RESULTS"], headline: "HDFC Bank Q2 FY26 net profit up 6.2% YoY to ₹18,420 Cr.", source: "BSE Filing", date: "2026-07-26T18:00:00+05:30", stocks: ["HDFCBANK"] },
    { id: "n2", tags: ["BROKER_CALL"], headline: "Nomura maintains Buy, target ₹1,820 on steady asset quality.", source: "Broker Research", date: "2026-07-26T11:20:00+05:30", stocks: ["HDFCBANK"] },
  ],
  brokerCalls: [
    { brokerage: "Nomura", rating: "buy", target: 1820 },
    { brokerage: "Morgan Stanley", rating: "buy", target: 1790 },
    { brokerage: "CLSA", rating: "hold", target: 1720 },
  ],

  verdict: "Bullish",
  verdictReason: "Above all major DMAs; RSI neutral at 54.8; steady deposit growth and stable asset quality support consensus Buy.",
  entry: 1690,
  stopLoss: 1650,
  target: 1780,
  verdictUpdatedAt: "2026-07-27T09:05:00+05:30",
};

const infy: Stock = {
  symbol: "INFY",
  name: "Infosys Ltd",
  sector: "IT Services",
  exchange: "NSE",
  cmp: 1512.75,
  changeAbs: -18.5,
  changePct: -1.21,
  volVs20d: -8,
  week52Low: 1290,
  week52High: 1720,
  mcapCr: 627000,
  isFo: true,
  circuitState: "none",

  pe: 22.1,
  pb: 7.8,
  evEbitda: 15.6,
  divYield: 2.9,
  roe: 31.2,
  roce: 38.5,
  de: 0.05,
  epsTtm: 68.4,
  faceValue: 5,
  betaOneYr: 0.78,
  creditRating: "AAA/Stable",
  ceo: "S. Parekh",

  rsi14: 38.4,
  resistance: [1610, 1575, 1548],
  support: [1480, 1440],
  above20dma: false,
  above50dma: false,
  above200dma: true,

  quarters: [
    { label: "Q3'25", revenue: 40986, ebitda: 9820, pat: 6870, eps: 16.6 },
    { label: "Q4'25", revenue: 41600, ebitda: 9910, pat: 6970, eps: 16.8 },
    { label: "Q1'26", revenue: 42150, ebitda: 10040, pat: 7050, eps: 17.0 },
    { label: "Q2'26", revenue: 41890, ebitda: 9760, pat: 6810, eps: 16.4 },
  ],
  peers: [
    { symbol: "TCS", pe: 24.8, pb: 12.1, evEbitda: 17.2, mcapCr: 1391000 },
    { symbol: "WIPRO", pe: 19.4, pb: 3.4, evEbitda: 11.6, mcapCr: 258000 },
    { symbol: "HCLTECH", pe: 21.6, pb: 6.2, evEbitda: 14.8, mcapCr: 452000 },
    { symbol: "TECHM", pe: 26.3, pb: 4.1, evEbitda: 13.5, mcapCr: 138000 },
  ],

  oiChain: [
    { strike: 1440, callOi: 30, putOi: 68 },
    { strike: 1470, callOi: 45, putOi: 74 },
    { strike: 1500, callOi: 62, putOi: 90 },
    { strike: 1530, callOi: 88, putOi: 55 },
    { strike: 1560, callOi: 70, putOi: 34 },
    { strike: 1590, callOi: 48, putOi: 20 },
  ],
  pcr: 1.02,
  maxPain: 1510,
  ivPercentile: 55,

  ownershipTrend: [
    { label: "Q4'25", promoter: 13.0, fii: 33.8, dii: 34.6, retail: 18.6 },
    { label: "Q1'26", promoter: 13.0, fii: 32.9, dii: 35.4, retail: 18.7 },
    { label: "Q2'26", promoter: 13.0, fii: 32.1, dii: 36.0, retail: 18.9 },
  ],
  promoterPledge: 0,
  bulkDeals: [],

  corporateActions: [
    { type: "Buyback", detail: "₹18,000 Cr buyback at ₹1,850/share", date: "2025-11-04", status: "past" },
  ],

  riskFlags: [
    { id: "r1", severity: "high", title: "Guidance cut risk", detail: "Discretionary IT spend weakness in US/Europe clients; FY guidance under watch." },
    { id: "r2", severity: "med", title: "Below 20D/50D DMA", detail: "Short-term downtrend; RSI 38.4 approaching oversold." },
  ],
  news: [
    { id: "n1", tags: ["RESULTS"], headline: "Infosys Q2 FY26 PAT dips 2.9% QoQ on weaker BFSI vertical growth.", source: "BSE Filing", date: "2026-07-24T18:10:00+05:30", stocks: ["INFY"] },
    { id: "n2", tags: ["BROKER_CALL"], headline: "CLSA downgrades to Hold, cuts target to ₹1,560 citing demand softness.", source: "Broker Research", date: "2026-07-25T09:40:00+05:30", stocks: ["INFY"] },
    { id: "n3", tags: ["GLOBAL"], headline: "US tech spending survey shows continued caution into H2 CY26.", source: "Bloomberg", date: "2026-07-23T20:00:00+05:30", stocks: ["INFY"] },
  ],
  brokerCalls: [
    { brokerage: "CLSA", rating: "hold", target: 1560 },
    { brokerage: "Jefferies", rating: "hold", target: 1590 },
    { brokerage: "Nomura", rating: "sell", target: 1440 },
  ],

  verdict: "Bearish",
  verdictReason: "Below 20D/50D DMA with RSI at 38.4 nearing oversold; weak BFSI vertical growth and one broker downgrade this week.",
  entry: 1480,
  stopLoss: 1520,
  target: 1400,
  verdictUpdatedAt: "2026-07-27T08:45:00+05:30",
};

const adanient: Stock = {
  symbol: "ADANIENT",
  name: "Adani Enterprises Ltd",
  sector: "Diversified",
  exchange: "NSE",
  cmp: 2984.6,
  changeAbs: -72.8,
  changePct: -2.38,
  volVs20d: 64,
  week52Low: 2210,
  week52High: 3450,
  mcapCr: 344000,
  isFo: true,
  circuitState: "none",

  pe: 68.4,
  pb: 5.9,
  evEbitda: 22.8,
  divYield: 0.05,
  roe: 8.9,
  roce: 10.1,
  de: 1.42,
  epsTtm: 43.6,
  faceValue: 1,
  betaOneYr: 1.68,
  creditRating: "AA/Stable",
  ceo: "G. Adani",

  rsi14: 31.6,
  resistance: [3200, 3100, 3050],
  support: [2900, 2800],
  above20dma: false,
  above50dma: false,
  above200dma: false,

  quarters: [
    { label: "Q3'25", revenue: 26100, ebitda: 3980, pat: 1120, eps: 9.7 },
    { label: "Q4'25", revenue: 27450, ebitda: 4210, pat: 1340, eps: 11.6 },
    { label: "Q1'26", revenue: 25980, ebitda: 3860, pat: 980, eps: 8.5 },
    { label: "Q2'26", revenue: 24800, ebitda: 3540, pat: 860, eps: 7.4 },
  ],
  peers: [
    { symbol: "ADANIPORTS", pe: 28.4, pb: 4.8, evEbitda: 16.2, mcapCr: 462000 },
    { symbol: "ADANIPOWER", pe: 15.6, pb: 4.1, evEbitda: 9.8, mcapCr: 231000 },
  ],

  oiChain: [
    { strike: 2850, callOi: 48, putOi: 82 },
    { strike: 2900, callOi: 62, putOi: 90 },
    { strike: 2950, callOi: 80, putOi: 68 },
    { strike: 3000, callOi: 95, putOi: 50 },
    { strike: 3050, callOi: 70, putOi: 32 },
    { strike: 3100, callOi: 44, putOi: 20 },
  ],
  pcr: 0.78,
  maxPain: 2950,
  ivPercentile: 71,

  ownershipTrend: [
    { label: "Q4'25", promoter: 74.1, fii: 12.4, dii: 6.8, retail: 6.7 },
    { label: "Q1'26", promoter: 72.8, fii: 13.0, dii: 7.2, retail: 7.0 },
    { label: "Q2'26", promoter: 72.6, fii: 13.1, dii: 7.6, retail: 6.7 },
  ],
  promoterPledge: 2.1,
  bulkDeals: [
    { date: "2026-07-21", party: "Life Insurance Corp", type: "Sell", quantity: 340000, price: 3040 },
  ],

  corporateActions: [],

  riskFlags: [
    { id: "r1", severity: "high", title: "High leverage", detail: "D/E at 1.42x, well above sector average; refinancing risk on rate moves." },
    { id: "r2", severity: "med", title: "Promoter pledge", detail: "2.1% of promoter holding pledged — monitor for changes." },
    { id: "r3", severity: "high", title: "Below all DMAs", detail: "Downtrend confirmed; RSI 31.6 near oversold, high F&O volatility." },
  ],
  news: [
    { id: "n1", tags: ["COMPLIANCE"], headline: "SEBI seeks clarification on related-party disclosures for FY26 Q1.", source: "SEBI Notice", date: "2026-07-26T16:30:00+05:30", stocks: ["ADANIENT"] },
    { id: "n2", tags: ["INSIDER_BULK"], headline: "LIC sells 3.4L shares in bulk deal at ₹3,040 — 4th consecutive session of institutional selling.", source: "NSE Bulk Deals", date: "2026-07-21T15:40:00+05:30", stocks: ["ADANIENT"] },
    { id: "n3", tags: ["MARKET_TREND"], headline: "Adani group stocks under pressure amid broader infra sector de-rating.", source: "Moneycontrol", date: "2026-07-25T13:15:00+05:30", stocks: ["ADANIENT"] },
  ],
  brokerCalls: [
    { brokerage: "Kotak Inst.", rating: "hold", target: 3050 },
    { brokerage: "CLSA", rating: "sell", target: 2700 },
  ],

  verdict: "Bearish",
  verdictReason: "Below all major DMAs with RSI 31.6 near oversold; high leverage (D/E 1.42x) and continued institutional selling pressure.",
  entry: 2850,
  stopLoss: 2960,
  target: 2650,
  verdictUpdatedAt: "2026-07-27T09:10:00+05:30",
};

/** Remaining watchlist rows — lighter detail, still enough to drive every panel without gaps. */
function stub(
  symbol: string,
  name: string,
  sector: string,
  cmp: number,
  changePct: number,
  isFo: boolean,
  verdict: Stock["verdict"] = "Neutral"
): Stock {
  const changeAbs = +((cmp * changePct) / 100).toFixed(2);
  const rsi = 45 + Math.round((changePct + 2) * 6);
  return {
    symbol,
    name,
    sector,
    exchange: "NSE",
    cmp,
    changeAbs,
    changePct,
    volVs20d: Math.round(changePct * 9),
    week52Low: +(cmp * 0.78).toFixed(2),
    week52High: +(cmp * 1.18).toFixed(2),
    mcapCr: Math.round(cmp * 3400),
    isFo,
    circuitState: "none",

    pe: 18 + Math.abs(changePct) * 2,
    pb: 2.4,
    evEbitda: 11.5,
    divYield: 1.1,
    roe: 14.2,
    roce: 15.8,
    de: 0.4,
    epsTtm: +(cmp / 22).toFixed(1),
    faceValue: 1,
    betaOneYr: 0.9,
    creditRating: "AA+/Stable",
    ceo: "—",

    rsi14: Math.max(20, Math.min(80, rsi)),
    resistance: [+(cmp * 1.05).toFixed(0), +(cmp * 1.03).toFixed(0), +(cmp * 1.015).toFixed(0)],
    support: [+(cmp * 0.97).toFixed(0), +(cmp * 0.94).toFixed(0)],
    above20dma: changePct >= 0,
    above50dma: changePct >= -0.5,
    above200dma: changePct >= -1,

    quarters: [
      { label: "Q3'25", revenue: Math.round(cmp * 12), ebitda: Math.round(cmp * 2.4), pat: Math.round(cmp * 1.1), eps: +(cmp / 90).toFixed(1) },
      { label: "Q4'25", revenue: Math.round(cmp * 12.4), ebitda: Math.round(cmp * 2.5), pat: Math.round(cmp * 1.15), eps: +(cmp / 88).toFixed(1) },
      { label: "Q1'26", revenue: Math.round(cmp * 12.8), ebitda: Math.round(cmp * 2.6), pat: Math.round(cmp * 1.2), eps: +(cmp / 86).toFixed(1) },
      { label: "Q2'26", revenue: Math.round(cmp * 13.2), ebitda: Math.round(cmp * 2.7), pat: Math.round(cmp * 1.25), eps: +(cmp / 84).toFixed(1) },
    ],
    peers: [],

    oiChain: isFo
      ? [0.95, 0.97, 0.99, 1.01, 1.03, 1.05].map((m, i) => ({
          strike: Math.round((cmp * m) / 10) * 10,
          callOi: 40 + i * 8,
          putOi: 80 - i * 9,
        }))
      : [],
    pcr: 1.0,
    maxPain: Math.round(cmp / 10) * 10,
    ivPercentile: 40,

    ownershipTrend: [
      { label: "Q4'25", promoter: 45, fii: 22, dii: 18, retail: 15 },
      { label: "Q1'26", promoter: 45, fii: 22.5, dii: 18.3, retail: 14.2 },
      { label: "Q2'26", promoter: 45, fii: 23, dii: 18.6, retail: 13.4 },
    ],
    promoterPledge: 0,
    bulkDeals: [],
    corporateActions: [],

    riskFlags: [
      { id: "r1", severity: changePct < -1 ? "high" : "low", title: changePct < -1 ? "Downtrend" : "Stable trend", detail: `${symbol} trading ${changePct >= 0 ? "above" : "below"} short-term averages.` },
    ],
    news: [
      { id: `${symbol}-n1`, tags: ["MARKET_TREND"], headline: `${name} moves ${changePct >= 0 ? "higher" : "lower"} in line with sector trend.`, source: "Market Desk", date: "2026-07-27T09:00:00+05:30", stocks: [symbol] },
    ],
    brokerCalls: [
      { brokerage: "Kotak Inst.", rating: verdict === "Bearish" ? "hold" : "buy", target: +(cmp * 1.08).toFixed(0) },
    ],

    verdict,
    verdictReason: `Rule-based read on DMA position, RSI (${Math.max(20, Math.min(80, rsi))}), and volume trend.`,
    entry: +(cmp * 0.995).toFixed(0),
    stopLoss: +(cmp * 0.97).toFixed(0),
    target: +(cmp * 1.04).toFixed(0),
    verdictUpdatedAt: "2026-07-27T09:00:00+05:30",
  };
}

export const stocks: Stock[] = [
  reliance,
  hdfcbank,
  { ...stub("TCS", "Tata Consultancy Services Ltd", "IT Services", 3841.2, -0.94, true, "Neutral"), circuitState: "none" },
  infy,
  stub("ICICIBANK", "ICICI Bank Ltd", "Banking", 1254.9, 0.38, true, "Bullish"),
  stub("BHARTIARTL", "Bharti Airtel Ltd", "Telecom", 1689.05, 2.15, true, "Bullish"),
  stub("TATASTEEL", "Tata Steel Ltd", "Metals", 168.35, -0.55, true, "Neutral"),
  adanient,
  stub("SBIN", "State Bank of India", "Banking", 832.15, 1.02, true, "Bullish"),
  stub("MARUTI", "Maruti Suzuki India Ltd", "Auto", 12845.0, 0.71, true, "Neutral"),
  stub("SUNPHARMA", "Sun Pharmaceutical Industries Ltd", "Pharma", 1798.3, -0.28, false, "Neutral"),
  stub("LT", "Larsen & Toubro Ltd", "Infra/Capex", 3612.85, 1.45, true, "Bullish"),
  stub("ITC", "ITC Ltd", "FMCG", 468.9, -0.12, true, "Neutral"),
  stub("AXISBANK", "Axis Bank Ltd", "Banking", 1142.55, 0.89, true, "Bullish"),
];

export function getStock(symbol: string): Stock {
  return stocks.find((s) => s.symbol === symbol) ?? stocks[0];
}
