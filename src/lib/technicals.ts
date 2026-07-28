// Pure technicals computation from OHLCV history — no fetch/network code,
// independently testable from the Yahoo-fetching layer.
import type { OhlcvBar } from "./yahoo-finance";

export function computeSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(closes.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/** Wilder's smoothing RSI(14). Returns null if insufficient history. */
export function computeRSI14(closes: number[]): number | null {
  const period = 14;
  if (closes.length < period + 1) return null;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Fractal swing-point method: a bar is a swing high/low if it's the max/min
 * within a 7-bar centered window (3 bars each side). Resistance = 3 nearest
 * distinct swing highs above CMP (descending); support = 2 nearest distinct
 * swing lows below CMP (descending, so support[0] is nearest below CMP).
 * Pads with 52W-high/low and +/-3% fallbacks to guarantee lengths of 3/2,
 * matching Stock's existing shape.
 */
export function computeSupportResistance(bars: OhlcvBar[], cmp: number): { resistance: number[]; support: number[] } {
  const WINDOW = 3;
  const swingHighs: number[] = [];
  const swingLows: number[] = [];

  for (let i = WINDOW; i < bars.length - WINDOW; i++) {
    const windowSlice = bars.slice(i - WINDOW, i + WINDOW + 1);
    const isHigh = bars[i].high === Math.max(...windowSlice.map((b) => b.high));
    const isLow = bars[i].low === Math.min(...windowSlice.map((b) => b.low));
    if (isHigh) swingHighs.push(bars[i].high);
    if (isLow) swingLows.push(bars[i].low);
  }

  const uniqDesc = (arr: number[]) => [...new Set(arr)].sort((a, b) => b - a);
  const highsAboveCmp = uniqDesc(swingHighs).filter((h) => h > cmp);
  const nearestHighs = highsAboveCmp.slice(-3).reverse();
  const nearestLows = uniqDesc(swingLows)
    .filter((l) => l < cmp)
    .slice(0, 2);

  const week52High = Math.max(...bars.map((b) => b.high));
  const week52Low = Math.min(...bars.map((b) => b.low));

  const resistance = [...nearestHighs];
  while (resistance.length < 3) {
    const fallback = resistance.length === 0 ? week52High : resistance[resistance.length - 1] * 1.03;
    resistance.push(+fallback.toFixed(2));
  }
  const support = [...nearestLows];
  while (support.length < 2) {
    const fallback = support.length === 0 ? week52Low : support[support.length - 1] * 0.97;
    support.push(+fallback.toFixed(2));
  }

  return { resistance: resistance.slice(0, 3), support: support.slice(0, 2) };
}

export interface LiveMarketData {
  cmp: number;
  changeAbs: number;
  changePct: number;
  volVs20d: number;
  week52Low: number;
  week52High: number;
  rsi14: number;
  resistance: number[];
  support: number[];
  above20dma: boolean;
  above50dma: boolean;
  above200dma: boolean;
  asOf: string;
}

export function buildLiveMarketData(
  meta: {
    regularMarketPrice: number;
    previousClose: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  },
  bars: OhlcvBar[]
): LiveMarketData {
  const closes = bars.map((b) => b.close);
  const cmp = meta.regularMarketPrice;
  const changeAbs = cmp - meta.previousClose;
  const changePct = (changeAbs / meta.previousClose) * 100;

  const sma20 = computeSMA(closes, 20);
  const sma50 = computeSMA(closes, 50);
  const sma200 = computeSMA(closes, 200);
  const rsi14 = computeRSI14(closes) ?? 50;

  const last20Vols = bars.slice(-20).map((b) => b.volume);
  const avg20dVol = last20Vols.reduce((a, b) => a + b, 0) / (last20Vols.length || 1);
  const latestVol = bars.at(-1)?.volume ?? 0;
  const volVs20d = avg20dVol > 0 ? (latestVol / avg20dVol - 1) * 100 : 0;

  const { resistance, support } = computeSupportResistance(bars, cmp);

  return {
    cmp,
    changeAbs,
    changePct,
    volVs20d,
    week52Low: meta.fiftyTwoWeekLow,
    week52High: meta.fiftyTwoWeekHigh,
    rsi14,
    resistance,
    support,
    above20dma: sma20 != null ? cmp > sma20 : true,
    above50dma: sma50 != null ? cmp > sma50 : true,
    above200dma: sma200 != null ? cmp > sma200 : false,
    asOf: new Date().toISOString(),
  };
}
