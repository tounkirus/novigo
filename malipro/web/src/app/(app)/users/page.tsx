"use client";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listUsers } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { User } from "@/lib/api/types";

const cols: Column<User>[] = [
  {
    key: "name",
    header: "Utilisateur",
    render: (u) => (
      <div>
        <p className="font-medium text-ink">{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</p>
        <p className="font-mono text-xs text-muted">{u.phone}</p>
      </div>
    ),
  },
  { key: "roles", header: "Rôles", render: (u) => u.roles.join(", ") },
  { key: "status", header: "Statut", render: (u) => <StatusBadge status={u.status} /> },
  { key: "date", header: "Inscrit", align: "right", render: (u) => formatDate(u.createdAt) },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => listUsers({ page, limit: 20, search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <Topbar title="Utilisateurs" />
      <main className="flex-1 p-6">
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Comptes</h2>
            <div className="w-64">
              <Input
                placeholder="Rechercher (nom, téléphone)…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading} emptyTitle="Aucun utilisateur" />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </div>
      </main>
    </>
  );
}
