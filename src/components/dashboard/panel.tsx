import type { ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  tag,
  tagClassName,
  children,
  className,
  bodyClassName,
  noBodyPad = false,
  onExpand,
}: {
  title: ReactNode;
  tag?: ReactNode;
  tagClassName?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noBodyPad?: boolean;
  /** When provided, the header becomes clickable and opens an enhanced popup view of this table. */
  onExpand?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[180px] flex-col overflow-hidden rounded-[4px] border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:min-h-0",
        className
      )}
    >
      <div
        onClick={onExpand}
        role={onExpand ? "button" : undefined}
        tabIndex={onExpand ? 0 : undefined}
        onKeyDown={
          onExpand
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onExpand();
                }
              }
            : undefined
        }
        className={cn(
          "group flex shrink-0 items-center justify-between gap-2 border-b border-border bg-panel-head px-2.5 py-1.5",
          onExpand && "cursor-pointer hover:bg-accent"
        )}
      >
        <span className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-text2">{title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {tag && (
            <span
              className={cn(
                "rounded-[2px] bg-accent px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-primary",
                tagClassName
              )}
            >
              {tag}
            </span>
          )}
          {onExpand && (
            <Maximize2
              className="h-3 w-3 shrink-0 text-text3 opacity-0 transition-opacity group-hover:opacity-100"
              strokeWidth={2.25}
            />
          )}
        </div>
      </div>
      <div className={cn("flex-1 overflow-x-auto overflow-y-auto", !noBodyPad && "px-2.5 py-2", bodyClassName)}>{children}</div>
    </div>
  );
}
