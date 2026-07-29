"use client";

import { useState } from "react";
import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { TableModal } from "./table-modal";
import { cn } from "@/lib/utils";
import { fmtNum } from "@/lib/format";

const STAT_TABS = ["Ratios", "Peer Comp"] as const;

export function BoxSnapshot({ stock }: { stock: Stock }) {
  const [tab, setTab] = useState<(typeof STAT_TABS)[number]>("Ratios");
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Panel
        title={
          <div className="flex gap-2.5">
            {STAT_TABS.map((t) => (
              <button
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  setTab(t);
                }}
                className={cn(
                  "uppercase tracking-wide",
                  tab === t ? "text-primary" : "text-text2 hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        }
        onExpand={() => setExpanded(true)}
        noBodyPad
      >
        {tab === "Ratios" ? (
          <div className="grid h-full grid-cols-2 gap-px bg-border xs:grid-cols-4">
            <Stat label="P/E (TTM)" value={`${stock.pe.toFixed(1)}x`} />
            <Stat label="P/B" value={`${stock.pb.toFixed(2)}x`} />
            <Stat label="Div Yield" value={`${stock.divYield.toFixed(2)}%`} />
            <Stat label="ROE" value={`${stock.roe.toFixed(1)}%`} />
            <Stat label="ROCE" value={`${stock.roce.toFixed(1)}%`} />
            <Stat label="D/E" value={stock.de.toFixed(2)} />
            <Stat label="EPS (TTM)" value={`₹${stock.epsTtm.toFixed(1)}`} />
            <Stat label="Face Value" value={`₹${stock.faceValue}`} />
            <Stat
              label="Promoter"
              value={stock.ownershipTrend.at(-1) ? `${stock.ownershipTrend.at(-1)!.promoter.toFixed(1)}%` : "—"}
            />
            <Stat label="Beta (1Y)" value={stock.betaOneYr.toFixed(2)} />
            <Stat label="Credit Rtg" value={stock.creditRating} small />
            <Stat label="CEO" value={stock.ceo} small />
          </div>
        ) : (
          <div className="px-2.5 py-2">
            {stock.peers.length === 0 ? (
              <div className="py-4 text-center text-[10.5px] text-text3">No peer comp data available.</div>
            ) : (
              <PeerTable stock={stock} />
            )}
          </div>
        )}
      </Panel>

      <TableModal
        open={expanded}
        onOpenChange={setExpanded}
        title="Snapshot · Key Ratios"
        subtitle={`${stock.symbol} · ${stock.name}`}
      >
        <div className="mb-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text2">Valuation</div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-border bg-border sm:grid-cols-4">
            <ModalStat label="P/E (TTM)" value={`${stock.pe.toFixed(1)}x`} />
            <ModalStat label="P/B" value={`${stock.pb.toFixed(2)}x`} />
            <ModalStat label="Div Yield" value={`${stock.divYield.toFixed(2)}%`} />
            <ModalStat label="Face Value" value={`₹${stock.faceValue}`} />
          </div>
        </div>
        <div className="mb-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text2">Profitability & Leverage</div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-border bg-border sm:grid-cols-4">
            <ModalStat label="ROE" value={`${stock.roe.toFixed(1)}%`} />
            <ModalStat label="ROCE" value={`${stock.roce.toFixed(1)}%`} />
            <ModalStat label="D/E" value={stock.de.toFixed(2)} />
            <ModalStat label="EPS (TTM)" value={`₹${stock.epsTtm.toFixed(1)}`} />
          </div>
        </div>
        <div className="mb-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text2">Ownership & Risk</div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-border bg-border sm:grid-cols-4">
            <ModalStat
              label="Promoter Holding"
              value={stock.ownershipTrend.at(-1) ? `${stock.ownershipTrend.at(-1)!.promoter.toFixed(1)}%` : "—"}
            />
            <ModalStat label="Promoter Pledge" value={`${stock.promoterPledge.toFixed(1)}%`} />
            <ModalStat label="Beta (1Y)" value={stock.betaOneYr.toFixed(2)} />
            <ModalStat label="Credit Rating" value={stock.creditRating} small />
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text2">Management & Peer Comp</div>
          <div className="mb-3 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-border bg-border sm:grid-cols-4">
            <ModalStat label="CEO" value={stock.ceo} small />
            <ModalStat label="Sector" value={stock.sector} small />
            <ModalStat label="Exchange" value={stock.exchange} small />
            <ModalStat label="Mkt Cap" value={`₹${fmtNum(stock.mcapCr, 0)} Cr`} small />
          </div>
          {stock.peers.length === 0 ? (
            <div className="py-3 text-center text-[10.5px] text-text3">No peer comp data available.</div>
          ) : (
            <PeerTable stock={stock} includeSelf />
          )}
        </div>
      </TableModal>
    </>
  );
}

function PeerTable({ stock, includeSelf = false }: { stock: Stock; includeSelf?: boolean }) {
  const rows = includeSelf
    ? [
        { symbol: stock.symbol, pe: stock.pe, pb: stock.pb, evEbitda: stock.evEbitda, mcapCr: stock.mcapCr, self: true },
        ...stock.peers.map((p) => ({ ...p, self: false })),
      ]
    : stock.peers.map((p) => ({ ...p, self: false }));

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="border-b border-border pb-1 text-left text-[8.5px] font-bold uppercase tracking-wide text-text3">Peer</th>
          <th className="border-b border-border pb-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">P/E</th>
          <th className="border-b border-border pb-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">P/B</th>
          <th className="border-b border-border pb-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">EV/EBITDA</th>
          <th className="border-b border-border pb-1 text-right text-[8.5px] font-bold uppercase tracking-wide text-text3">M-Cap (₹ Cr)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.symbol} className={p.self ? "bg-accent" : undefined}>
            <td className="border-b border-[#F0F1F3] py-[3px] text-[10.5px] font-semibold text-text2">
              {p.self ? <b className="text-primary">{p.symbol} (this stock)</b> : p.symbol}
            </td>
            <td className="tnum border-b border-[#F0F1F3] py-[3px] text-right text-[10.5px] font-semibold">{p.pe.toFixed(1)}x</td>
            <td className="tnum border-b border-[#F0F1F3] py-[3px] text-right text-[10.5px] font-semibold">{p.pb.toFixed(1)}x</td>
            <td className="tnum border-b border-[#F0F1F3] py-[3px] text-right text-[10.5px] font-semibold">{p.evEbitda.toFixed(1)}x</td>
            <td className="tnum border-b border-[#F0F1F3] py-[3px] text-right text-[10.5px] font-semibold">{fmtNum(p.mcapCr, 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stat({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-card px-2 py-1.5">
      <div className="mb-[2px] text-[9px] uppercase tracking-wide text-text2">{label}</div>
      <div className={cn("tnum font-bold", small ? "text-[11px]" : "text-[12.5px]")}>{value}</div>
    </div>
  );
}

function ModalStat({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-card px-2.5 py-2">
      <div className="mb-0.5 text-[9px] uppercase tracking-wide text-text2">{label}</div>
      <div className={cn("tnum font-bold", small ? "text-[12px]" : "text-[14px]")}>{value}</div>
    </div>
  );
}
