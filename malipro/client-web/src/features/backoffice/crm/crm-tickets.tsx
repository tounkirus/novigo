"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/mock/api";
import { timeAgo } from "@/lib/utils";
import { NOW } from "@/constants";
import type { SupportTicket } from "@/types/backoffice";
import { TICKET_PRIORITY, TICKET_STATUS, CHANNEL_LABEL } from "./crm-helpers";

const FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "OPEN", label: "Ouverts" },
  { value: "PENDING", label: "En attente" },
  { value: "RESOLVED", label: "Résolus" },
];

export function CrmTickets() {
  const q = useQuery({ queryKey: ["supportTickets"], queryFn: () => api.supportTickets() });
  const [status, setStatus] = React.useState<string>("ALL");

  const columns: Column<SupportTicket>[] = [
    { key: "ref", header: "Réf.", cell: (t) => <span className="font-mono text-[12px] text-muted">{t.ref}</span> },
    {
      key: "customer",
      header: "Client",
      cell: (t) => (
        <div className="flex items-center gap-3">
          <Avatar src={t.avatar} alt={t.customer} size={32} />
          <span className="max-w-[150px] truncate font-semibold text-ink">{t.customer}</span>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Sujet",
      cell: (t) => <span className="max-w-[220px] truncate text-ink">{t.subject}</span>,
    },
    { key: "channel", header: "Canal", cell: (t) => <span className="text-muted">{CHANNEL_LABEL[t.channel]}</span> },
    {
      key: "priority",
      header: "Priorité",
      cell: (t) => <Badge tone={TICKET_PRIORITY[t.priority].tone}>{TICKET_PRIORITY[t.priority].label}</Badge>,
    },
    {
      key: "status",
      header: "Statut",
      cell: (t) => <Badge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Badge>,
    },
    {
      key: "agent",
      header: "Agent",
      cell: (t) => <span className="text-muted">{t.agent ?? "Non assigné"}</span>,
    },
    {
      key: "createdAt",
      header: "Créé",
      align: "right",
      cell: (t) => <span className="text-[12px] text-muted">{timeAgo(t.createdAt, NOW)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <QueryState query={q} skeleton={<TableSkeleton rows={8} cols={7} />}>
        {(tickets) => {
          const rows = status === "ALL" ? tickets : tickets.filter((t) => t.status === status);
          return (
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(t) => t.id}
              minWidth={920}
              empty="Aucun ticket dans cette catégorie."
            />
          );
        }}
      </QueryState>
    </div>
  );
}
