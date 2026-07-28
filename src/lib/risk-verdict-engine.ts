// Rule-based risk flags + verdict, computed from a Stock's existing fields —
// no LLM, no fabricated claims (PRD §3.2: verdict "must trace to underlying data").
import type { RiskFlag, RiskSeverity, Stock, Verdict } from "@/types/stock";

export type RiskProbability = "high" | "med" | "low";
export type RiskImpact = "high" | "med" | "low";

export interface ComputedRiskFlag extends RiskFlag {
  probability: RiskProbability;
  impact: RiskImpact;
}

export interface ComputedVerdict {
  verdict: Verdict;
  reason: string;
  entry: number;
  stopLoss: number;
  target: number;
}

function flag(
  id: string,
  severity: RiskSeverity,
  probability: RiskProbability,
  impact: RiskImpact,
  title: string,
  detail: string
): ComputedRiskFlag {
  return { id, severity, probability, impact, title, detail };
}

/** Rule thresholds are intentionally simple/explainable — every flag must cite the field that triggered it. */
export function computeRiskFlags(stock: Stock): ComputedRiskFlag[] {
  const flags: ComputedRiskFlag[] = [];

  if (stock.promoterPledge >= 10) {
    flags.push(
      flag("pledge", "high", "high", "high", "High promoter pledge", `${stock.promoterPledge.toFixed(1)}% of promoter holding is pledged.`)
    );
  } else if (stock.promoterPledge > 0) {
    flags.push(
      flag("pledge", "med", "med", "med", "Promoter pledge present", `${stock.promoterPledge.toFixed(1)}% of promoter holding is pledged — monitor for increases.`)
    );
  }

  if (stock.de >= 1.5) {
    flags.push(flag("leverage", "high", "high", "high", "High leverage", `Debt/Equity at ${stock.de.toFixed(2)}x — elevated balance-sheet risk.`));
  } else if (stock.de >= 1.0) {
    flags.push(flag("leverage", "med", "med", "med", "Elevated leverage", `Debt/Equity at ${stock.de.toFixed(2)}x — above comfortable range.`));
  }

  if (!stock.above200dma) {
    const supportNote = stock.support[0] != null ? `watch ${stock.support[0]} support` : "no support level available";
    flags.push(flag("trend200", "high", "high", "med", "Below 200 DMA", `Long-term trend caution — ${supportNote}.`));
  }
  if (stock.rsi14 >= 70) {
    flags.push(flag("rsi-overbought", "med", "med", "med", "RSI overbought", `RSI(14) at ${stock.rsi14.toFixed(1)} — pullback risk near-term.`));
  } else if (stock.rsi14 <= 30) {
    flags.push(flag("rsi-oversold", "med", "med", "low", "RSI oversold", `RSI(14) at ${stock.rsi14.toFixed(1)} — capitulation risk if trend continues.`));
  }

  const sellCalls = stock.brokerCalls.filter((c) => c.rating === "sell").length;
  if (sellCalls > 0 && sellCalls >= stock.brokerCalls.length / 2) {
    flags.push(
      flag("broker-sell", "med", "med", "med", "Broker sell pressure", `${sellCalls} of ${stock.brokerCalls.length} tracked brokerages rate Sell.`)
    );
  }

  const bandPosition = stock.pe > 0 ? (stock.pe - stock.peers.reduce((s, p) => s + p.pe, 0) / (stock.peers.length || 1)) : 0;
  if (stock.peers.length > 0 && bandPosition > 0 && stock.pe > (stock.peers.reduce((s, p) => s + p.pe, 0) / stock.peers.length) * 1.5) {
    flags.push(flag("valuation", "med", "low", "med", "Valuation premium to peers", `P/E ${stock.pe.toFixed(1)}x is well above peer average.`));
  }

  const complianceNews = stock.news.filter((n) => n.tags.includes("COMPLIANCE"));
  for (const n of complianceNews.slice(0, 3)) {
    flags.push(flag(`compliance-${n.id}`, "high", "med", "high", "Compliance/regulatory item", n.headline));
  }

  if (stock.circuitState !== "none") {
    flags.push(
      flag(
        "circuit",
        "high",
        "high",
        "high",
        stock.circuitState === "upper" ? "Upper circuit" : "Lower circuit",
        "Stock is currently circuit-locked — liquidity constrained."
      )
    );
  }

  if (flags.length === 0) {
    flags.push(flag("none", "low", "low", "low", "No active flags", "No rule-based risk conditions are currently triggered."));
  }

  return flags;
}

/** Verdict score: +1 per bullish signal, -1 per bearish signal, across DMA/RSI/PCR/broker consensus. */
export function computeVerdict(stock: Stock): ComputedVerdict {
  let score = 0;
  const reasons: string[] = [];

  const dmaCount = [stock.above20dma, stock.above50dma, stock.above200dma].filter(Boolean).length;
  if (dmaCount >= 2) {
    score += 1;
    reasons.push(`above ${dmaCount}/3 major DMAs`);
  } else if (dmaCount <= 1) {
    score -= 1;
    reasons.push(`below ${3 - dmaCount}/3 major DMAs`);
  }

  if (stock.rsi14 >= 55 && stock.rsi14 < 70) {
    score += 1;
    reasons.push(`RSI ${stock.rsi14.toFixed(1)} in bullish-neutral zone`);
  } else if (stock.rsi14 <= 40) {
    score -= 1;
    reasons.push(`RSI ${stock.rsi14.toFixed(1)} nearing oversold`);
  } else if (stock.rsi14 >= 70) {
    score -= 1;
    reasons.push(`RSI ${stock.rsi14.toFixed(1)} overbought`);
  }

  if (stock.isFo && stock.pcr > 0) {
    if (stock.pcr >= 1.1) {
      score += 1;
      reasons.push(`PCR ${stock.pcr.toFixed(2)} signals put-writer support`);
    } else if (stock.pcr <= 0.8) {
      score -= 1;
      reasons.push(`PCR ${stock.pcr.toFixed(2)} signals call-writer resistance`);
    }
  }

  if (stock.brokerCalls.length > 0) {
    const buys = stock.brokerCalls.filter((c) => c.rating === "buy").length;
    const sells = stock.brokerCalls.filter((c) => c.rating === "sell").length;
    if (buys > sells) {
      score += 1;
      reasons.push(`broker consensus ${buys} Buy / ${sells} Sell`);
    } else if (sells > buys) {
      score -= 1;
      reasons.push(`broker consensus ${buys} Buy / ${sells} Sell`);
    }
  }

  const verdict: Verdict = score >= 2 ? "Bullish" : score <= -2 ? "Bearish" : "Neutral";

  const reason = reasons.length > 0 ? `${reasons.join("; ")}.` : "Mixed signals across technicals and sentiment.";

  const entry = verdict === "Bullish" ? +(stock.cmp * 1.0).toFixed(0) : +(stock.cmp * 0.995).toFixed(0);
  const stopLoss =
    verdict === "Bearish"
      ? +(stock.resistance[2] ?? stock.cmp * 1.02).toFixed(0)
      : +(stock.support[0] ?? stock.cmp * 0.97).toFixed(0);
  const target =
    verdict === "Bearish"
      ? +(stock.support[1] ?? stock.cmp * 0.94).toFixed(0)
      : +(stock.resistance[0] ?? stock.cmp * 1.05).toFixed(0);

  return { verdict, reason, entry, stopLoss, target };
}
