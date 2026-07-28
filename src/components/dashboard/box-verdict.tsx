"use client";

import { useMemo, useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { cn } from "@/lib/utils";
import { fmtInt, fmtTimeIST } from "@/lib/format";
import { computeVerdict } from "@/lib/risk-verdict-engine";

export function BoxVerdict({ stock }: { stock: Stock }) {
  const [subscribed, setSubscribed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const computed = useMemo(() => computeVerdict(stock), [stock]);

  const verdictBg =
    computed.verdict === "Bullish" ? "bg-gradient-to-br from-pos-dim to-[#f0faf3]" :
    computed.verdict === "Bearish" ? "bg-gradient-to-br from-neg-dim to-[#fdf1f0]" :
    "bg-gradient-to-br from-amber-dim to-[#fef8ec]";

  return (
    <Panel title="Verdict" className="shrink-0" noBodyPad>
      <div className={cn("flex flex-col gap-1.5 px-2.5 py-2", verdictBg)}>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "rounded-[3px] px-2 py-[3px] text-[11px] font-extrabold uppercase tracking-wide text-white",
              computed.verdict === "Bullish" && "bg-pos",
              computed.verdict === "Bearish" && "bg-neg",
              computed.verdict === "Neutral" && "bg-amber"
            )}
          >
            {computed.verdict}
          </span>
          <span className="text-[9px] text-text3">Rule-based · updated {fmtTimeIST(stock.verdictUpdatedAt)} IST</span>
        </div>
        <div className="text-[10px] leading-snug text-text2">{computed.reason}</div>
        <div className="flex gap-px overflow-hidden rounded-[3px] border border-border bg-border">
          <VerdictNum label="Entry" value={computed.entry} color="var(--primary)" />
          <VerdictNum label="Stop-Loss" value={computed.stopLoss} color="var(--neg)" />
          <VerdictNum label="Target" value={computed.target} color="var(--pos)" />
        </div>
      </div>

      <div className="border-t border-border px-2.5 py-2">
        {subscribed ? (
          <div className="rounded-[3px] border border-[#cdeed9] bg-pos-dim px-2 py-1.5 text-[9.5px] font-semibold text-pos">
            ✓ Subscribed — {stock.symbol} updates at 9:30 AM & 3:30 PM IST
          </div>
        ) : showForm ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSubscribed(true);
            }}
            className="flex gap-1.5"
          >
            <input
              type="email"
              required
              autoFocus
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-[3px] border border-border bg-card px-1.5 py-1 text-[10.5px] outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="shrink-0 rounded-[3px] bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground hover:bg-[#164ec2]"
            >
              Confirm
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-[3px] border border-dashed border-primary px-2 py-1.5">
            <span className="text-[9.5px] leading-tight text-text2">
              Get <b className="font-bold text-foreground">{stock.symbol}</b> updates by email
              <br />
              9:30 AM & 3:30 PM IST
            </span>
            <button
              onClick={() => setShowForm(true)}
              className="shrink-0 whitespace-nowrap rounded-[3px] bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground hover:bg-[#164ec2]"
            >
              + Subscribe
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}

function VerdictNum({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 bg-card px-1.5 py-1 text-center">
      <div className="text-[8px] uppercase tracking-wide text-text3">{label}</div>
      <div className="tnum text-[12px] font-extrabold" style={{ color }}>
        {fmtInt(value)}
      </div>
    </div>
  );
}
