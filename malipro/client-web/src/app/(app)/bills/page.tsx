"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { api } from "@/mock/api";
import { QueryState } from "@/components/ui/async-state";
import { Reveal } from "@/components/ui/reveal";
import { GridSkeleton, ListRowSkeleton } from "@/components/ui/skeletons";
import { BillerGrid } from "@/features/bills/biller-grid";
import { BillHistoryList } from "@/features/bills/bill-history";

function HistorySkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

export default function BillsPage() {
  const billersQuery = useQuery({ queryKey: ["billers"], queryFn: () => api.billers() });
  const historyQuery = useQuery({ queryKey: ["billHistory"], queryFn: () => api.billHistory() });

  return (
    <div className="px-4 py-4 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-ink">Paiement de factures</h1>

      <Reveal>
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Paiement 100 % sécurisé</p>
            <p className="text-[13px] text-muted">
              Vos règlements sont chiffrés et confirmés instantanément. Aucune commission cachée.
            </p>
          </div>
        </div>
      </Reveal>

      <section className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-ink">Facturiers</h2>
        <QueryState query={billersQuery} skeleton={<GridSkeleton count={8} card="product" />}>
          {(billers) => <BillerGrid billers={billers} />}
        </QueryState>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-ink">Factures récentes</h2>
        <QueryState
          query={historyQuery}
          skeleton={<HistorySkeleton />}
          isEmpty={(d) => d.length === 0}
        >
          {(history) => <BillHistoryList history={history} />}
        </QueryState>
      </section>
    </div>
  );
}
