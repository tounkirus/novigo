"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  count?: number;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active, icon, count, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "focus-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-all active:scale-95",
        active
          ? "border-brand bg-brand text-white shadow-sm"
          : "border-line bg-surface text-ink hover:border-brand/40 hover:bg-brand-soft",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
      {count != null && (
        <span className={cn("rounded-full px-1.5 text-[11px]", active ? "bg-white/20" : "bg-shell text-muted")}>
          {count}
        </span>
      )}
    </button>
  ),
);
Chip.displayName = "Chip";
