"use client";

import { useState } from "react";
import { Icon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/states";
import type { WalletTx } from "@/types/modules";
import { formatFcfa, timeAgo } from "@/lib/utils";
import { NOW } from "@/constants";

type Filter = "all" | "in" | "out";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "in", label: "Entrées" },
  { value: "out", label: "Sorties" },
];

const STATUS: Record<WalletTx["status"], { label: string; tone: "success" | "warning" | "error" }> = {
  COMPLETED: { label: "Réussi", tone: "success" },
  PENDING: { label: "En attente", tone: "warning" },
  FAILED: { label: "Échoué", tone: "error" },
};

export function WalletTransactions({ transactions }: { transactions: WalletTx[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const items = transactions.filter((t) =>
    filter === "all" ? true : filter === "in" ? t.amount > 0 : t.amount < 0,
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-tight text-ink">Transactions</h2>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {items.length === 0 ? (
          <EmptyState title="Aucune transaction" description="Aucun mouvement pour ce filtre." />
        ) : (
          <RevealGroup>
            {items.map((tx, i) => {
              const credit = tx.amount > 0;
              const st = STATUS[tx.status];
              return (
                <RevealItem key={tx.id}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        credit ? "bg-success-soft text-success" : "bg-brand-soft text-brand"
                      }`}
                    >
                      <Icon name={tx.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{tx.label}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[12px] text-muted">{timeAgo(tx.createdAt, NOW)}</span>
                        {tx.status !== "COMPLETED" && <Badge tone={st.tone}>{st.label}</Badge>}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-black ${credit ? "text-success" : "text-error"}`}
                    >
                      {credit ? "+" : "−"}
                      {formatFcfa(Math.abs(tx.amount))}
                    </span>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}
