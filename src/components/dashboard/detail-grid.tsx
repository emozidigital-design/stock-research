import type { Stock } from "@/types/stock";
import { BoxSnapshot } from "./box-snapshot";
import { BoxChart } from "./box-chart";
import { BoxFundamentals } from "./box-fundamentals";
import { BoxTechnicals } from "./box-technicals";
import { BoxFo } from "./box-fo";
import { BoxOwnership } from "./box-ownership";

export function DetailGrid({ stock }: { stock: Stock }) {
  return (
    <div className="grid flex-1 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:auto-rows-fr lg:grid-rows-3 lg:overflow-hidden">
      <BoxSnapshot stock={stock} />
      <BoxChart stock={stock} />
      <BoxFundamentals stock={stock} />
      <BoxTechnicals stock={stock} />
      <BoxFo stock={stock} />
      <BoxOwnership stock={stock} />
    </div>
  );
}
