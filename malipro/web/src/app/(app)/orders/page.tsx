"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listOrders } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/api/types";

const STATUSES: (OrderStatus | "")[] = [
  "", "PENDING", "CONFIRMED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "REFUNDED",
];

const cols: Column<Order>[] = [
  {
    key: "ref",
    header: "Référence",
    render: (o) => (
      <Link href={`/orders/${o.id}`} className="font-mono text-xs text-brand hover:underline">
        {o.reference ?? o.id.slice(0, 8)}
      </Link>
    ),
  },
  { key: "type", header: "Type", render: (o) => o.type },
  { key: "method", header: "Paiement", render: (o) => o.paymentMethod ?? "—" },
  { key: "status", header: "Statut", render: (o) => <StatusBadge status={o.status} /> },
  { key: "total", header: "Total", align: "right", render: (o) => formatMoney(o.total) },
  { key: "date", header: "Créée", align: "right", render: (o) => formatDate(o.createdAt) },
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const q = useQuery({
    queryKey: ["orders", page, status],
    queryFn: () => listOrders({ page, limit: 20, status: status || undefined }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <Topbar title="Commandes" />
      <main className="flex-1 p-6">
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Toutes les commandes</h2>
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
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading} emptyTitle="Aucune commande" />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </div>
      </main>
    </>
  );
}
