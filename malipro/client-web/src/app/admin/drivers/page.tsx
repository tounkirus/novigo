"use client";

import * as React from "react";
import { Eye, Search } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rating } from "@/components/ui/rating";
import { Avatar } from "@/components/ui/misc";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import { drivers } from "@/mock";
import type { Driver } from "@/types";
import { formatCompact } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function AdminDriversPage() {
  const all = React.useMemo(() => drivers().slice(0, 60), []);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);

  const online = React.useCallback((d: Driver) => Number(d.id.split("_")[1]) % 3 !== 0, []);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return all.filter((d) => d.name.toLowerCase().includes(q) || d.vehicle.toLowerCase().includes(q) || d.plate.toLowerCase().includes(q));
  }, [all, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  React.useEffect(() => setPage(0), [query]);

  const columns: Column<Driver>[] = [
    {
      key: "name",
      header: "Livreur",
      cell: (d) => (
        <div className="flex items-center gap-3">
          <Avatar src={d.avatar} alt={d.name} size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{d.name}</p>
            <p className="text-[12px] text-muted">{d.phone}</p>
          </div>
        </div>
      ),
    },
    { key: "vehicle", header: "Véhicule", cell: (d) => <Badge tone="neutral">{d.vehicle}</Badge> },
    { key: "plate", header: "Plaque", cell: (d) => <span className="font-mono text-[13px] text-muted">{d.plate}</span> },
    { key: "rating", header: "Note", cell: (d) => <Rating value={d.rating} /> },
    { key: "deliveries", header: "Livraisons", align: "right", cell: (d) => formatCompact(d.deliveries) },
    {
      key: "status",
      header: "Statut",
      cell: (d) => <Badge tone={online(d) ? "success" : "neutral"}>{online(d) ? "En ligne" : "Hors ligne"}</Badge>,
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: () => (
        <Button size="icon-sm" variant="ghost" aria-label="Voir">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const onlineCount = all.filter(online).length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Livreurs</h2>
        <p className="text-sm text-muted">Suivez la flotte de livraison NOVIGO.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Livreurs" value={String(all.length)} hint="affichés" />
        <KpiCard label="En ligne" value={String(onlineCount)} hint="disponibles" />
        <KpiCard label="Note moyenne" value="4,6" hint="qualité de service" />
      </div>

      <Input
        icon={<Search className="h-4 w-4" />}
        placeholder="Rechercher un livreur, un véhicule…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <DataTable columns={columns} rows={rows} getRowKey={(d) => d.id} minWidth={820} empty="Aucun livreur trouvé." />

      <Pagination page={current} pageCount={pageCount} total={filtered.length} onPage={setPage} />
    </div>
  );
}
