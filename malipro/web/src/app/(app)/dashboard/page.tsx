"use client";
import { useQuery } from "@tanstack/react-query";
import { getKpis, listOrders } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";
import type { Order } from "@/lib/api/types";

const recentCols: Column<Order>[] = [
  { key: "ref", header: "Référence", render: (o) => <span className="font-mono text-xs">{o.reference ?? o.id.slice(0, 8)}</span> },
  { key: "type", header: "Type", render: (o) => o.type },
  { key: "status", header: "Statut", render: (o) => <StatusBadge status={o.status} /> },
  { key: "total", header: "Total", align: "right", render: (o) => formatMoney(o.total) },
  { key: "date", header: "Créée", align: "right", render: (o) => formatDate(o.createdAt) },
];

export default function DashboardPage() {
  const kpis = useQuery({ queryKey: ["kpis"], queryFn: () => getKpis() });
  const recent = useQuery({
    queryKey: ["orders", "recent"],
    queryFn: () => listOrders({ limit: 6, sort: "-createdAt" }),
  });

  const k = kpis.data?.data;

  return (
    <>
      <Topbar title="Tableau de bord" />
      <main className="flex-1 space-y-6 p-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-card">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-4 h-7 w-24" />
              </div>
            ))
          ) : (
            <>
              <KpiCard label="GMV" value={formatMoney(k?.gmv)} accent="gold" />
              <KpiCard label="Commandes" value={formatNumber(k?.ordersCount)} />
              <KpiCard label="Livreurs actifs" value={formatNumber(k?.activeDrivers)} />
              <KpiCard label="Nouveaux clients" value={formatNumber(k?.newCustomers)} />
              <KpiCard
                label="Délai moyen"
                value={k ? `${k.avgDeliveryMinutes.toFixed(0)} min` : "—"}
              />
            </>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Dernières commandes</h2>
          </div>
          <DataTable
            columns={recentCols}
            rows={recent.data?.data}
            loading={recent.isLoading}
            emptyTitle="Aucune commande récente"
          />
        </section>
      </main>
    </>
  );
}
