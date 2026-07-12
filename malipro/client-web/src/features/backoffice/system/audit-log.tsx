"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/misc";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { api } from "@/mock/api";
import { NOW } from "@/constants";
import { timeAgo } from "@/lib/utils";
import type { AuditLog } from "@/types/backoffice";

const LEVEL_TONE: Record<AuditLog["level"], "info" | "warning" | "error"> = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "error",
};

type Filter = "ALL" | AuditLog["level"];
const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "INFO", label: "Info" },
  { value: "WARNING", label: "Avertissement" },
  { value: "CRITICAL", label: "Critique" },
];

function AuditList({ logs }: { logs: AuditLog[] }) {
  const [level, setLevel] = React.useState<Filter>("ALL");
  const rows = level === "ALL" ? logs : logs.filter((l) => l.level === level);

  const columns: Column<AuditLog>[] = [
    { key: "actor", header: "Acteur", cell: (l) => <span className="font-semibold text-ink">{l.actor}</span> },
    {
      key: "action",
      header: "Action",
      cell: (l) => (
        <span className="text-muted">
          {l.action} <span className="font-medium text-ink">{l.target}</span>
        </span>
      ),
    },
    { key: "level", header: "Niveau", cell: (l) => <Badge tone={LEVEL_TONE[l.level]}>{l.level}</Badge> },
    { key: "ip", header: "Adresse IP", cell: (l) => <span className="font-mono text-[12px] text-muted">{l.ip}</span> },
    { key: "at", header: "Date", align: "right", cell: (l) => <span className="text-muted">{timeAgo(l.at, NOW)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{rows.length} évènement(s) enregistré(s).</p>
        <Segmented options={FILTERS} value={level} onChange={setLevel} />
      </div>
      <DataTable columns={columns} rows={rows} getRowKey={(l) => l.id} minWidth={760} empty="Aucun évènement pour ce niveau." />
    </div>
  );
}

export function AuditLogTab() {
  const q = useQuery({ queryKey: ["auditLogs"], queryFn: () => api.auditLogs() });
  return (
    <QueryState query={q} skeleton={<TableSkeleton rows={8} cols={5} />} isEmpty={(d) => d.length === 0}>
      {(logs) => <AuditList logs={logs} />}
    </QueryState>
  );
}
