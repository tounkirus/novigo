"use client";

import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { api } from "@/mock/api";
import type { Supplier } from "@/types/backoffice";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/misc";
import { cn, formatFcfa } from "@/lib/utils";

export function SuppliersTab() {
  const query = useQuery({ queryKey: ["suppliers"], queryFn: () => api.suppliers() });

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Fournisseur", cell: (s) => <span className="font-semibold text-ink">{s.name}</span> },
    { key: "contact", header: "Contact", cell: (s) => <span className="text-muted">{s.contact}</span> },
    {
      key: "phone",
      header: "Téléphone",
      cell: (s) => (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Phone className="h-3.5 w-3.5" /> {s.phone}
        </span>
      ),
    },
    { key: "category", header: "Catégorie", cell: (s) => <Badge tone="neutral">{s.category}</Badge> },
    { key: "items", header: "Articles", align: "right", cell: (s) => s.items },
    {
      key: "reliability",
      header: "Fiabilité",
      cell: (s) => (
        <div className="flex min-w-[120px] items-center gap-2">
          <Progress value={s.reliability} className="flex-1" />
          <span className="w-9 text-right text-[12px] font-semibold text-ink">{s.reliability}%</span>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Solde",
      align: "right",
      cell: (s) => (
        <span className={cn("font-bold", s.balance < 0 ? "text-error" : "text-success")}>{formatFcfa(s.balance)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Partenaires d'approvisionnement et soldes comptables.</p>
      <QueryState query={query} skeleton={<TableSkeleton rows={8} cols={7} />} isEmpty={(d) => d.length === 0}>
        {(suppliers) => (
          <DataTable columns={columns} rows={suppliers} getRowKey={(s) => s.id} minWidth={920} empty="Aucun fournisseur." />
        )}
      </QueryState>
    </div>
  );
}
