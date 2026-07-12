"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { listArtisans, setArtisanAvailability } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import type { AdminArtisan } from "@/lib/api/types";

export default function ArtisansPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["artisans", page],
    queryFn: () => listArtisans({ page, limit: 20 }),
    placeholderData: keepPreviousData,
  });
  const toggle = useMutation({
    mutationFn: (a: AdminArtisan) => setArtisanAvailability(a.id, !a.isAvailable),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artisans"] }),
  });

  const cols: Column<AdminArtisan>[] = [
    {
      key: "name", header: "Artisan",
      render: (a) => (
        <div>
          <p className="font-medium text-ink">{a.name || "—"}</p>
          <p className="font-mono text-xs text-muted">{a.phone}</p>
        </div>
      ),
    },
    { key: "profession", header: "Métier", render: (a) => a.profession },
    { key: "rating", header: "Note", render: (a) => `${a.rating.toFixed(1)} ★` },
    { key: "services", header: "Services", render: (a) => a.serviceCount },
    { key: "status", header: "Dispo.", render: (a) => <StatusBadge status={a.isAvailable ? "ACTIVE" : "SUSPENDED"} /> },
    {
      key: "actions", header: "", align: "right",
      render: (a) => (
        <Button variant="outline" className="h-8 px-2 text-xs" disabled={toggle.isPending} onClick={() => toggle.mutate(a)}>
          {a.isAvailable ? "Rendre indispo." : "Rendre dispo."}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Topbar title="Artisans" />
      <main className="flex-1 p-6">
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Artisans</h2>
          </div>
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading} emptyTitle="Aucun artisan" />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </div>
      </main>
    </>
  );
}
