"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { formatFcfa, cn } from "@/lib/utils";

/** Grande carte de solde (réutilisable Client / Livreur / Commerçant / Admin). */
export function WalletBalanceCard({
  label,
  balance,
  pending,
  pendingLabel = "En attente",
  actions,
  gradient = "brand-gradient",
  footer,
}: {
  label: string;
  balance: number;
  pending?: number;
  pendingLabel?: string;
  actions?: ReactNode;
  gradient?: string;
  footer?: ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl p-6 text-white shadow-glow", gradient)}>
      <Sparkles className="absolute -right-6 -top-6 h-28 w-28 opacity-15" />
      <div className="relative">
        <p className="text-[13px] font-medium opacity-90">{label}</p>
        <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{formatFcfa(balance)}</p>
        {pending != null && (
          <p className="mt-1 text-[13px] opacity-90">
            {pendingLabel} : <span className="font-semibold">{formatFcfa(pending)}</span>
          </p>
        )}
        {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
        {footer && <div className="mt-4 border-t border-white/20 pt-3">{footer}</div>}
      </div>
    </div>
  );
}

export interface StatTile {
  label: string;
  value: number | string;
  icon?: string;
  tone?: "brand" | "success" | "warning" | "error" | "info" | "neutral";
  money?: boolean;
}

const TONES: Record<NonNullable<StatTile["tone"]>, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
  info: "bg-info-soft text-info",
  neutral: "bg-shell text-muted",
};

/** Grille de tuiles statistiques (réutilisable). */
export function StatTiles({ items, cols = 4 }: { items: StatTile[]; cols?: 2 | 3 | 4 }) {
  const grid = cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={cn("grid grid-cols-2 gap-3", grid)}>
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          {it.icon && (
            <span className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-xl", TONES[it.tone ?? "brand"])}>
              <Icon name={it.icon} className="h-[18px] w-[18px]" />
            </span>
          )}
          <p className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            {it.money && typeof it.value === "number" ? formatFcfa(it.value) : it.value}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">{it.label}</p>
        </div>
      ))}
    </div>
  );
}
