"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import { person } from "@/components/dashboard/people";
import { formatFcfa, formatCompact } from "@/lib/utils";

const PAGE_SIZE = 12;

interface Customer {
  id: string;
  name: string;
  phone: string;
  district: string;
  orders: number;
  spent: number;
  active: boolean;
}

function buildCustomers(): Customer[] {
  return Array.from({ length: 44 }, (_, i) => {
    const p = person(i * 3 + 4);
    const orders = 3 + ((i * 11) % 60);
    return {
      id: `cust_${i}`,
      name: p.name,
      phone: p.phone,
      district: p.district,
      orders,
      spent: orders * (4200 + ((i * 23) % 30) * 350),
      active: i % 5 !== 0,
    };
  });
}

export default function AdminUsersPage() {
  const all = React.useMemo(buildCustomers, []);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return all.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.district.toLowerCase().includes(q));
  }, [all, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  React.useEffect(() => setPage(0), [query]);

  const totalSpent = all.reduce((s, c) => s + c.spent, 0);
  const activeCount = all.filter((c) => c.active).length;

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Client",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">
            {c.name.charAt(0)}
          </span>
          <span className="font-semibold text-ink">{c.name}</span>
        </div>
      ),
    },
    { key: "phone", header: "Téléphone", cell: (c) => <span className="font-mono text-[13px] text-muted">{c.phone}</span> },
    { key: "district", header: "Quartier", cell: (c) => <span className="text-muted">{c.district}</span> },
    { key: "orders", header: "Commandes", align: "right", cell: (c) => c.orders },
    { key: "spent", header: "Dépenses", align: "right", cell: (c) => <span className="font-bold text-ink">{formatFcfa(c.spent)}</span> },
    { key: "status", header: "Statut", cell: (c) => <Badge tone={c.active ? "success" : "neutral"}>{c.active ? "Actif" : "Inactif"}</Badge> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Utilisateurs</h2>
        <p className="text-sm text-muted">Base clients de NOVIGO.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Clients" value={String(all.length)} hint="affichés" />
        <KpiCard label="Actifs" value={String(activeCount)} hint="30 derniers jours" />
        <KpiCard label="Volume dépensé" value={`${formatCompact(totalSpent)} FCFA`} hint="cumulé" />
      </div>

      <Input
        icon={<Search className="h-4 w-4" />}
        placeholder="Rechercher un client, un numéro, un quartier…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <DataTable columns={columns} rows={rows} getRowKey={(c) => c.id} minWidth={760} empty="Aucun client trouvé." />

      <Pagination page={current} pageCount={pageCount} total={filtered.length} onPage={setPage} />
    </div>
  );
}
