"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listSupportTickets } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import type { SupportTicket } from "@/lib/api/types";

const STATUSES = ["", "OPEN", "PENDING", "RESOLVED", "CLOSED"];

const cols: Column<SupportTicket>[] = [
  {
    key: "subject", header: "Sujet",
    render: (t) => (
      <Link href={`/support/${t.id}`} className="font-medium text-ink hover:text-brand">
        {t.subject}
      </Link>
    ),
  },
  { key: "category", header: "Catégorie", render: (t) => t.category },
  { key: "priority", header: "Priorité", render: (t) => t.priority },
  { key: "status", header: "Statut", render: (t) => <StatusBadge status={t.status} /> },
  { key: "updated", header: "Mis à jour", align: "right", render: (t) => formatDate(t.updatedAt) },
];

export default function SupportPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const q = useQuery({
    queryKey: ["support", page, status],
    queryFn: () => listSupportTickets({ page, limit: 20, status: status || undefined }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <Topbar title="Support" />
      <main className="flex-1 p-6">
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Tickets</h2>
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
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading} emptyTitle="Aucun ticket" />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </div>
      </main>
    </>
  );
}
