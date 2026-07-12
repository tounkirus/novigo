import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5",
  {
    variants: {
      tone: {
        brand: "bg-brand-soft text-brand",
        gold: "bg-gold-soft text-gold-dark",
        success: "bg-success-soft text-success",
        error: "bg-error-soft text-error",
        info: "bg-info-soft text-info",
        warning: "bg-warning-soft text-warning",
        violet: "bg-violet-soft text-violet",
        neutral: "bg-shell text-muted border border-line",
        solid: "brand-gradient text-white",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
