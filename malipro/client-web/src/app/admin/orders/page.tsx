"use client";

import * as React from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import { person } from "@/components/dashboard/people";
import { stores } from "@/mock";
import { ORDER_STATUS, PAYMENT_LABEL, NOW } from "@/constants";
import type { OrderStatus, PaymentMethodType } from "@/types";
import { formatFcfa, formatDate } from "@/lib/utils";

const PAGE_SIZE = 12;
const STATUS_CYCLE: OrderStatus[] = [
  "DELIVERED", "DELIVERED", "DELIVERING", "PREPARING", "DELIVERED", "PENDING",
  "DELIVERED", "CANCELLED", "DELIVERED", "READY", "DELIVERED", "CONFIRMED",
];
const PAY_CYCLE: PaymentMethodType[] = ["ORANGE_MONEY", "WAVE", "MOOV_MONEY", "CASH", "CARD"];

interface AdminOrder {
  id: string;
  ref: string;
  customer: string;
  store: string;
  logo: string;
  total: number;
  method: PaymentMethodType;
  status: OrderStatus;
  createdAt: string;
}

function buildOrders(): AdminOrder[] {
  const s = stores();
  return Array.from({ length: 42 }, (_, i) => {
    const store = s[(i * 17 + 5) % s.length];
    const p = person(i);
    return {
      id: `aord_${i}`,
      ref: `MP-${100420 + i * 6}`,
      customer: p.name,
      store: store.name,
      logo: store.logo,
      total: 3500 + ((i * 37) % 40) * 650,
      method: PAY_CYCLE[i % PAY_CYCLE.length],
      status: STATUS_CYCLE[i % STATUS_CYCLE.length],
      createdAt: new Date(NOW - i * 3.2 * 3600_000).toISOString(),
    };
  });
}

export default function AdminOrdersPage() {
  const all = React.useMemo(buildOrders, []);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return all.filter(
      (o) =>
        (status === "ALL" || o.status === status) &&
        (o.ref.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.store.toLowerCase().includes(q)),
    );
  }, [all, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  React.useEffect(() => setPage(0), [query, status]);

  const revenue = all.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + o.total, 0);

  const columns: Column<AdminOrder>[] = [
    { key: "ref", header: "Référence", cell: (o) => <span className="font-semibold text-ink">{o.ref}</span> },
    { key: "customer", header: "Client", cell: (o) => o.customer },
    {
      key: "store",
      header: "Commerce",
      cell: (o) => (
        <div className="flex items-center gap-2.5">
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-shell">
            <Image src={o.logo} alt={o.store} fill sizes="32px" className="object-cover" />
          </span>
          <span className="max-w-[160px] truncate text-muted">{o.store}</span>
        </div>
      ),
    },
    { key: "method", header: "Paiement", cell: (o) => <Badge tone="neutral">{PAYMENT_LABEL[o.method].label}</Badge> },
    { key: "date", header: "Date", cell: (o) => <span className="text-muted">{formatDate(o.createdAt)}</span> },
    { key: "status", header: "Statut", cell: (o) => <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge> },
    { key: "total", header: "Montant", align: "right", cell: (o) => <span className="font-bold text-ink">{formatFcfa(o.total)}</span> },
  ];

  const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERING", "DELIVERED", "CANCELLED"];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Commandes</h2>
        <p className="text-sm text-muted">Toutes les commandes de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Commandes" value={String(all.length)} hint="sur la période" />
        <KpiCard label="Livrées" value={String(all.filter((o) => o.status === "DELIVERED").length)} hint="terminées" />
        <KpiCard label="Revenus" value={formatFcfa(revenue)} hint="commandes livrées" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Rechercher (réf, client, commerce)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm flex-1"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {STATUS_OPTIONS.map((st) => (
              <SelectItem key={st} value={st}>{ORDER_STATUS[st].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} rows={rows} getRowKey={(o) => o.id} minWidth={900} empty="Aucune commande trouvée." />

      <Pagination page={current} pageCount={pageCount} total={filtered.length} onPage={setPage} />
    </div>
  );
}
