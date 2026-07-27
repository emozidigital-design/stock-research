import type { Stock } from "@/types/stock";
import { BoxRisk } from "./box-risk";
import { BoxNews } from "./box-news";
import { BoxBroker } from "./box-broker";
import { BoxVerdict } from "./box-verdict";

export function RightSidebar({ stock }: { stock: Stock }) {
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto lg:overflow-hidden">
      <BoxRisk stock={stock} />
      <BoxNews stock={stock} />
      <BoxBroker stock={stock} />
      <BoxVerdict stock={stock} />
    </div>
  );
}
