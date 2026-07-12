"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

const TONE_ICON: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
  info: "bg-info-soft text-info",
  violet: "bg-violet-soft text-violet",
  gold: "bg-gold-soft text-gold-dark",
};

export function KpiCard({
  label,
  value,
  delta,
  icon,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string;
  delta?: number;
  icon?: ReactNode;
  hint?: string;
  tone?: "brand" | "success" | "warning" | "error" | "info" | "violet" | "gold";
}) {
  const up = (delta ?? 0) > 0;
  const flat = delta === 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink">{value}</p>
        </div>
        {icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", TONE_ICON[tone])}>
            {icon}
          </div>
        )}
      </div>
      {(delta != null || hint) && (
        <div className="mt-3 flex items-center gap-2 text-[13px]">
          {delta != null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
                flat ? "bg-shell text-muted" : up ? "bg-success-soft text-success" : "bg-error-soft text-error",
              )}
            >
              {!flat && (up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />)}
              {Math.abs(delta)}%
            </span>
          )}
          {hint && <span className="text-muted">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
