"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { listPendingProducts, moderateProduct } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import type { AdminPendingProduct } from "@/lib/api/types";

export default function ModerationPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["pending-products", page],
    queryFn: () => listPendingProducts({ page, limit: 20 }),
    placeholderData: keepPreviousData,
  });
  const mut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "PUBLISHED" | "REJECTED" }) => moderateProduct(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-products"] }),
  });

  const cols: Column<AdminPendingProduct>[] = [
    {
      key: "name", header: "Produit",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-paper" />
          )}
          <div>
            <p className="font-medium text-ink">{p.name}</p>
            <p className="font-mono text-xs text-muted">{p.storeName || "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "merchant", header: "Commerçant", render: (p) => p.merchant || "—" },
    { key: "price", header: "Prix", render: (p) => formatMoney(p.price) },
    {
      key: "actions", header: "", align: "right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-8 px-2 text-xs" disabled={mut.isPending}
            onClick={() => mut.mutate({ id: p.id, status: "PUBLISHED" })}>
            Publier
          </Button>
          <Button variant="outline" className="h-8 px-2 text-xs" disabled={mut.isPending}
            onClick={() => mut.mutate({ id: p.id, status: "REJECTED" })}>
            Rejeter
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar title="Modération produits" />
      <main className="flex-1 p-6">
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Produits en attente de validation</h2>
          </div>
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading}
            emptyTitle="Aucun produit en attente" />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </div>
      </main>
    </>
  );
}
