"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertTriangle, Package, PackageX, PackageMinus, Wallet } from "lucide-react";
import { api } from "@/mock/api";
import type { InventoryItem } from "@/types/backoffice";
import { QueryState } from "@/components/ui/async-state";
import { KpiRowSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import type { BadgeProps } from "@/components/ui/badge";
import { formatFcfa, formatCompact } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS: Record<InventoryItem["status"], { label: string; tone: NonNullable<BadgeProps["tone"]> }> = {
  IN_STOCK: { label: "En stock", tone: "success" },
  LOW: { label: "Stock faible", tone: "warning" },
  OUT: { label: "Rupture", tone: "error" },
};

function StockCell({ item }: { item: InventoryItem }) {
  const cap = Math.max(item.reorderLevel * 4, item.stock, 1);
  const pct = (item.stock / cap) * 100;
  const color =
    item.status === "OUT" ? "bg-error" : item.status === "LOW" ? "bg-warning" : "bg-success";
  return (
    <div className="min-w-[120px] space-y-1">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-semibold text-ink">{item.stock}</span>
        <span className="text-muted">seuil {item.reorderLevel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export function StocksTab() {
  const query = useQuery({ queryKey: ["inventory"], queryFn: () => api.inventory() });
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [page, setPage] = React.useState(0);

  React.useEffect(() => setPage(0), [q, status]);

  const columns: Column<InventoryItem>[] = [
    { key: "name", header: "Article", cell: (i) => <span className="font-semibold text-ink">{i.name}</span> },
    { key: "sku", header: "SKU", cell: (i) => <span className="font-mono text-[12px] text-muted">{i.sku}</span> },
    { key: "category", header: "Catégorie", cell: (i) => <Badge tone="neutral">{i.category}</Badge> },
    { key: "supplier", header: "Fournisseur", cell: (i) => <span className="text-muted">{i.supplier}</span> },
    { key: "stock", header: "Stock", cell: (i) => <StockCell item={i} /> },
    { key: "cost", header: "Prix d'achat", align: "right", cell: (i) => formatFcfa(i.costPrice) },
    { key: "sell", header: "Prix de vente", align: "right", cell: (i) => <span className="font-semibold text-ink">{formatFcfa(i.sellPrice)}</span> },
    {
      key: "margin",
      header: "Marge",
      align: "right",
      cell: (i) => {
        const m = Math.round(((i.sellPrice - i.costPrice) / i.costPrice) * 100);
        return <span className="font-semibold text-success">{m}%</span>;
      },
    },
    { key: "status", header: "Statut", cell: (i) => <Badge tone={STATUS[i.status].tone}>{STATUS[i.status].label}</Badge> },
  ];

  return (
    <QueryState
      query={query}
      skeleton={
        <div className="space-y-4">
          <KpiRowSkeleton count={4} />
          <TableSkeleton rows={8} cols={7} />
        </div>
      }
      isEmpty={(d) => d.length === 0}
    >
      {(items) => {
        const out = items.filter((i) => i.status === "OUT").length;
        const low = items.filter((i) => i.status === "LOW").length;
        const value = items.reduce((s, i) => s + i.stock * i.costPrice, 0);

        const term = q.toLowerCase();
        const filtered = items.filter(
          (i) =>
            (status === "ALL" || i.status === status) &&
            (i.name.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term) || i.supplier.toLowerCase().includes(term)),
        );
        const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        const current = Math.min(page, pageCount - 1);
        const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard label="Articles totaux" value={formatCompact(items.length)} hint="références" icon={<Package className="h-5 w-5" />} />
              <KpiCard label="En rupture" value={String(out)} hint="à recommander" icon={<PackageX className="h-5 w-5" />} />
              <KpiCard label="Stock faible" value={String(low)} hint="sous le seuil" icon={<PackageMinus className="h-5 w-5" />} />
              <KpiCard label="Valeur du stock" value={formatFcfa(value)} hint="au prix d'achat" icon={<Wallet className="h-5 w-5" />} />
            </div>

            {out + low > 0 && (
              <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft px-4 py-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <p className="text-[13px] text-ink">
                  <span className="font-semibold">Réapprovisionnement requis :</span> {out} article(s) en rupture et {low} sous le seuil de réappro.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Input
                icon={<Search className="h-4 w-4" />}
                placeholder="Rechercher (nom, SKU, fournisseur)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="max-w-sm flex-1"
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="IN_STOCK">En stock</SelectItem>
                  <SelectItem value="LOW">Stock faible</SelectItem>
                  <SelectItem value="OUT">Rupture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable columns={columns} rows={rows} getRowKey={(i) => i.id} minWidth={960} empty="Aucun article trouvé." />
            <Pagination page={current} pageCount={pageCount} total={filtered.length} onPage={setPage} />
          </div>
        );
      }}
    </QueryState>
  );
}
