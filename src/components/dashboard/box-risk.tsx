import type { Stock } from "@/types/stock";
import { Panel } from "./panel";
import { cn } from "@/lib/utils";

export function BoxRisk({ stock }: { stock: Stock }) {
  const activeCount = stock.riskFlags.filter((r) => r.severity !== "low").length;

  return (
    <Panel
      title="Risk & Alert Flags"
      tag={`${activeCount} Active`}
      tagClassName={cn(activeCount > 0 ? "bg-neg-dim text-neg" : "bg-pos-dim text-pos")}
      className="shrink-0 lg:max-h-[20%]"
    >
      {stock.riskFlags.map((r) => (
        <div key={r.id} className="flex items-start gap-1.5 border-b border-[#F0F1F3] py-1.5 last:border-b-0">
          <span
            className={cn(
              "mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full",
              r.severity === "high" ? "bg-neg" : r.severity === "med" ? "bg-amber" : "bg-pos"
            )}
          />
          <span className="text-[10.5px] leading-snug">
            <b className="font-bold">{r.title}</b> — {r.detail}
          </span>
        </div>
      ))}
    </Panel>
  );
}
