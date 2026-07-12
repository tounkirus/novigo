"use client";

import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/states";
import type { BillHistory } from "@/types/modules";
import { formatFcfa, formatDate } from "@/lib/utils";

const STATUS: Record<BillHistory["status"], { label: string; tone: "success" | "warning" | "error" }> = {
  PAID: { label: "Payée", tone: "success" },
  PENDING: { label: "En attente", tone: "warning" },
  FAILED: { label: "Échouée", tone: "error" },
};

export function BillHistoryList({ history }: { history: BillHistory[] }) {
  if (history.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-8 w-8" />}
        title="Aucune facture"
        description="Vos paiements de factures apparaîtront ici."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <RevealGroup>
        {history.map((h, i) => {
          const st = STATUS[h.status];
          return (
            <RevealItem key={h.id}>
              <div className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Receipt className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{h.billerName}</p>
                  <p className="text-[12px] text-muted">
                    {h.reference} • {formatDate(h.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-black text-ink">{formatFcfa(h.amount)}</span>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </div>
  );
}
