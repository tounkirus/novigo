"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { listMerchants, setMerchantStatus, setMerchantAutoPublish } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import type { AdminMerchant, MerchantStatus } from "@/lib/api/types";

export default function MerchantsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["merchants", page],
    queryFn: () => listMerchants({ page, limit: 20 }),
    placeholderData: keepPreviousData,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["merchants"] });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MerchantStatus }) => setMerchantStatus(id, status),
    onSuccess: invalidate,
  });
  const autoPubMut = useMutation({
    mutationFn: ({ id, autoPublish }: { id: string; autoPublish: boolean }) => setMerchantAutoPublish(id, autoPublish),
    onSuccess: invalidate,
  });
  const busy = statusMut.isPending || autoPubMut.isPending;

  const cols: Column<AdminMerchant>[] = [
    {
      key: "name", header: "Commerçant",
      render: (m) => (
        <div>
          <p className="font-medium text-ink">{m.businessName}</p>
          <p className="font-mono text-xs text-muted">{m.owner || "—"} · {m.phone}</p>
        </div>
      ),
    },
    { key: "category", header: "Catégorie", render: (m) => m.category || "—" },
    { key: "stores", header: "Boutiques", render: (m) => m.storeCount },
    { key: "status", header: "Validation", render: (m) => <StatusBadge status={m.status} /> },
    {
      key: "autopub", header: "Publication",
      render: (m) => (
        <button
          disabled={busy}
          onClick={() => autoPubMut.mutate({ id: m.id, autoPublish: !m.autoPublish })}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            m.autoPublish ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
          title="Basculer l'auto-publication des produits"
        >
          {m.autoPublish ? "Auto ✓" : "Validation"}
        </button>
      ),
    },
    {
      key: "actions", header: "", align: "right",
      render: (m) => (
        <div className="flex justify-end gap-2">
          {m.status !== "APPROVED" && (
            <Button variant="outline" className="h-8 px-2 text-xs" disabled={busy}
              onClick={() => statusMut.mutate({ id: m.id, status: "APPROVED" })}>
              {m.status === "SUSPENDED" ? "Réactiver" : "Approuver"}
            </Button>
          )}
          {m.status === "APPROVED" && (
            <Button variant="outline" className="h-8 px-2 text-xs" disabled={busy}
              onClick={() => statusMut.mutate({ id: m.id, status: "SUSPENDED" })}>
              Suspendre
            </Button>
          )}
          {m.status === "PENDING" && (
            <Button variant="outline" className="h-8 px-2 text-xs" disabled={busy}
              onClick={() => statusMut.mutate({ id: m.id, status: "REJECTED" })}>
              Rejeter
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar title="Commerçants" />
      <main className="flex-1 p-6">
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Commerçants</h2>
          </div>
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading} emptyTitle="Aucun commerçant" />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </div>
      </main>
    </>
  );
}
