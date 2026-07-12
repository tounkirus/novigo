"use client";

import * as React from "react";
import Image from "next/image";
import { Eye, Search } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rating } from "@/components/ui/rating";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import { stores } from "@/mock";
import { STORE_CATEGORY_LABEL } from "@/constants";
import type { Store, StoreCategory } from "@/types";
import { formatCompact } from "@/lib/utils";

const PAGE_SIZE = 12;
const CATEGORIES = Object.entries(STORE_CATEGORY_LABEL) as [StoreCategory, string][];

export default function AdminMerchantsPage() {
  const all = React.useMemo(() => stores().slice(0, 60), []);
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return all.filter(
      (s) =>
        (cat === "ALL" || s.category === cat) &&
        (s.name.toLowerCase().includes(q) || s.district.toLowerCase().includes(q)),
    );
  }, [all, query, cat]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  React.useEffect(() => setPage(0), [query, cat]);

  const columns: Column<Store>[] = [
    {
      key: "name",
      header: "Commerce",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-shell">
            <Image src={s.logo} alt={s.name} fill sizes="36px" className="object-cover" />
          </span>
          <span className="min-w-0 max-w-[200px] truncate font-semibold text-ink">{s.name}</span>
        </div>
      ),
    },
    { key: "category", header: "Catégorie", cell: (s) => <Badge tone="neutral">{STORE_CATEGORY_LABEL[s.category]}</Badge> },
    { key: "district", header: "Quartier", cell: (s) => <span className="text-muted">{s.district}</span> },
    { key: "rating", header: "Note", cell: (s) => <Rating value={s.rating} count={s.reviewCount} /> },
    { key: "orders", header: "Commandes", align: "right", cell: (s) => formatCompact(s.orderCount) },
    { key: "status", header: "Statut", cell: (s) => <Badge tone={s.isOpen ? "success" : "neutral"}>{s.isOpen ? "Ouvert" : "Fermé"}</Badge> },
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

  const openCount = all.filter((s) => s.isOpen).length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Commerçants</h2>
        <p className="text-sm text-muted">Gérez les commerces partenaires de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Commerces" value={String(all.length)} hint="affichés" />
        <KpiCard label="Ouverts" value={String(openCount)} hint="en ligne maintenant" />
        <KpiCard label="Note moyenne" value="4,4" hint="satisfaction" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Rechercher par nom ou quartier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm flex-1"
        />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes les catégories</SelectItem>
            {CATEGORIES.map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} rows={rows} getRowKey={(s) => s.id} minWidth={860} empty="Aucun commerce trouvé." />

      <Pagination page={current} pageCount={pageCount} total={filtered.length} onPage={setPage} />
    </div>
  );
}
