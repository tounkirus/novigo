"use client";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/lib/api/types";

const cols: Column<AuditLog>[] = [
  { key: "action", header: "Action", render: (l) => <span className="font-mono text-xs">{l.action}</span> },
  { key: "entity", header: "Entité", render: (l) => l.entityType ?? "—" },
  { key: "actor", header: "Acteur", render: (l) => <span className="font-mono text-xs">{l.actorId.slice(0, 8)}</span> },
  { key: "ip", header: "IP", render: (l) => l.ip ?? "—" },
  { key: "date", header: "Horodatage", align: "right", render: (l) => formatDate(l.createdAt) },
];

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["audit", page],
    queryFn: () => listAuditLogs({ page, limit: 20, sort: "-createdAt" }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <Topbar title="Journaux d'audit" />
      <main className="flex-1 p-6">
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Traçabilité des actions</h2>
          </div>
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading} emptyTitle="Aucune entrée d'audit" />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </div>
      </main>
    </>
  );
}
