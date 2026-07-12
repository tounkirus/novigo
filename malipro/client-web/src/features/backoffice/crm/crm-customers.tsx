"use client";

import * as React from "react";
import { Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, Progress } from "@/components/ui/misc";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/mock/api";
import { formatFcfa, formatCompact } from "@/lib/utils";
import type { CrmCustomer, CustomerSegment } from "@/types/backoffice";
import { SEGMENT_META, CUSTOMER_STATUS } from "./crm-helpers";

const PAGE_SIZE = 10;
const SEGMENTS = Object.entries(SEGMENT_META) as [CustomerSegment, { short: string }][];

export function CrmCustomers() {
  const q = useQuery({ queryKey: ["crmCustomers", 60], queryFn: () => api.crmCustomers(60) });
  const [query, setQuery] = React.useState("");
  const [segment, setSegment] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(0);

  React.useEffect(() => setPage(0), [query, segment]);

  const columns: Column<CrmCustomer>[] = [
    {
      key: "name",
      header: "Client",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar src={c.avatar} alt={c.name} size={36} />
          <div className="min-w-0">
            <p className="max-w-[180px] truncate font-semibold text-ink">{c.name}</p>
            <p className="text-[12px] text-muted">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Téléphone", cell: (c) => <span className="text-muted">{c.phone}</span> },
    { key: "district", header: "Quartier", cell: (c) => <span className="text-muted">{c.district}</span> },
    {
      key: "segment",
      header: "Segment",
      cell: (c) => <Badge tone={SEGMENT_META[c.segment].tone}>{SEGMENT_META[c.segment].short}</Badge>,
    },
    { key: "orders", header: "Commandes", align: "right", cell: (c) => formatCompact(c.orders) },
    {
      key: "ltv",
      header: "LTV",
      align: "right",
      cell: (c) => <span className="font-semibold text-ink">{formatFcfa(c.ltv)}</span>,
    },
    {
      key: "satisfaction",
      header: "Satisfaction",
      cell: (c) => (
        <div className="flex items-center gap-2">
          <Progress value={c.satisfaction} className="w-20" />
          <span className="text-[12px] tabular-nums text-muted">{c.satisfaction}%</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (c) => <Badge tone={CUSTOMER_STATUS[c.status].tone}>{CUSTOMER_STATUS[c.status].label}</Badge>,
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: () => (
        <Button size="icon-sm" variant="ghost" aria-label="Voir la fiche client">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Rechercher un client, un téléphone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm flex-1"
        />
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les segments</SelectItem>
            {SEGMENTS.map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.short}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryState query={q} skeleton={<TableSkeleton rows={10} cols={7} />}>
        {(all) => {
          const term = query.trim().toLowerCase();
          const filtered = all.filter(
            (c) =>
              (segment === "ALL" || c.segment === segment) &&
              (term === "" ||
                c.name.toLowerCase().includes(term) ||
                c.phone.toLowerCase().includes(term) ||
                c.district.toLowerCase().includes(term) ||
                c.email.toLowerCase().includes(term)),
          );
          const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
          const current = Math.min(page, pageCount - 1);
          const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

          return (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(c) => c.id}
                minWidth={980}
                empty="Aucun client trouvé."
              />
              <Pagination page={current} pageCount={pageCount} total={filtered.length} onPage={setPage} />
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
