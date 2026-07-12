"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/misc";
import { NOW } from "@/constants";
import { formatFcfa, timeAgo } from "@/lib/utils";
import type { CashRemittance, RemittanceStatus } from "@/types/wallet";
import { REMITTANCE_METHOD_META } from "./remittance-flow";

const STATUS_META: Record<RemittanceStatus, { label: string; tone: "warning" | "success" | "error" | "neutral" }> = {
  PENDING: { label: "En attente", tone: "warning" },
  VALIDATED: { label: "Validée", tone: "success" },
  REJECTED: { label: "Rejetée", tone: "error" },
  LATE: { label: "En retard", tone: "neutral" },
};

type Filter = "ALL" | RemittanceStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "VALIDATED", label: "Validées" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "LATE", label: "En retard" },
];

const COLUMNS: Column<CashRemittance>[] = [
  {
    key: "ref",
    header: "Référence",
    cell: (r) => <span className="font-semibold text-ink">{r.ref}</span>,
  },
  {
    key: "amount",
    header: "Montant",
    align: "right",
    cell: (r) => <span className="font-semibold text-ink">{formatFcfa(r.amount)}</span>,
  },
  {
    key: "method",
    header: "Méthode",
    cell: (r) => {
      const m = REMITTANCE_METHOD_META[r.method];
      return <Badge tone={m.tone}>{m.label}</Badge>;
    },
  },
  {
    key: "status",
    header: "Statut",
    cell: (r) => {
      const s = STATUS_META[r.status];
      return <Badge tone={s.tone}>{s.label}</Badge>;
    },
  },
  {
    key: "validatedBy",
    header: "Validateur",
    cell: (r) => <span className="text-muted">{r.validatedBy ?? "—"}</span>,
  },
  {
    key: "createdAt",
    header: "Date",
    cell: (r) => <span className="text-muted">{timeAgo(r.createdAt, NOW)}</span>,
  },
  {
    key: "receipt",
    header: "Reçu",
    cell: (r) =>
      r.receiptId ? (
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-brand">
          <FileText className="h-3.5 w-3.5" /> {r.receiptId}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
];

export function RemittanceHistory({ remittances }: { remittances: CashRemittance[] }) {
  const [filter, setFilter] = React.useState<Filter>("ALL");

  const rows = React.useMemo(
    () => (filter === "ALL" ? remittances : remittances.filter((r) => r.status === filter)),
    [filter, remittances],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ink">Historique des remises</h2>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} className="max-w-full overflow-x-auto" />
      </div>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        getRowKey={(r) => r.id}
        empty="Aucune remise pour ce filtre."
      />
    </div>
  );
}
