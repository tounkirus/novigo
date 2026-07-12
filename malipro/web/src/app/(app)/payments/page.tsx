"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { listPayments, refundPayment } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Payment, PaymentStatus } from "@/lib/api/types";

const STATUSES: (PaymentStatus | "")[] = ["", "INITIATED", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"];

const baseCols: Column<Payment>[] = [
  { key: "id", header: "Réf.", render: (p) => <span className="font-mono text-xs">{p.providerRef ?? p.id.slice(0, 8)}</span> },
  { key: "method", header: "Moyen", render: (p) => p.method },
  { key: "status", header: "Statut", render: (p) => <StatusBadge status={p.status} /> },
  { key: "amount", header: "Montant", align: "right", render: (p) => formatMoney(p.amount) },
  { key: "date", header: "Date", align: "right", render: (p) => formatDate(p.createdAt) },
];

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["payments", page, status],
    queryFn: () => listPayments({ page, limit: 20, status: status || undefined }),
    placeholderData: keepPreviousData,
  });
  const refund = useMutation({
    mutationFn: (id: string) => refundPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });

  const cols: Column<Payment>[] = [
    ...baseCols,
    {
      key: "actions", header: "", align: "right",
      render: (p) =>
        p.status === "SUCCEEDED" ? (
          <Button
            variant="outline"
            className="h-8 px-2 text-xs"
            disabled={refund.isPending}
            onClick={() => { if (confirm(`Rembourser ${p.providerRef ?? p.id.slice(0, 8)} ?`)) refund.mutate(p.id); }}
          >
            Rembourser
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <Topbar title="Paiements" />
      <main className="flex-1 p-6">
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Tous les paiements</h2>
            <div className="flex items-center gap-2">
              <Link
                href="/payments/reconciliation"
                className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm text-ink hover:bg-paper"
              >
                Réconciliation
              </Link>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s || "all"} value={s}>{s === "" ? "Tous les statuts" : s}</option>
                ))}
              </select>
            </div>
          </div>
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading} emptyTitle="Aucun paiement" />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </div>
      </main>
    </>
  );
}
