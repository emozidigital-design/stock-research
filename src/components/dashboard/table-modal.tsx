"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

export function TableModal({
  open,
  onOpenChange,
  title,
  subtitle,
  tag,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  tag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[92vw] max-w-[880px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[4px] border border-border bg-card shadow-2xl outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-150"
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-panel-head px-3.5 py-2.5">
            <div className="flex min-w-0 items-baseline gap-2.5">
              <span className="text-[13px] font-bold uppercase tracking-wide text-foreground">{title}</span>
              {subtitle && <span className="truncate text-[10.5px] font-medium text-text2">{subtitle}</span>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {tag && (
                <span className="rounded-[2px] bg-accent px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-primary">
                  {tag}
                </span>
              )}
              <DialogPrimitive.Close
                aria-label="Close"
                className="flex h-6 w-6 items-center justify-center rounded-[3px] text-text2 hover:bg-background hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">{children}</div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
