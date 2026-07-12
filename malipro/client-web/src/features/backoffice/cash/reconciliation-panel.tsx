"use client";

import * as React from "react";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarSeries } from "@/components/ui/charts";
import { cn, formatFcfa, formatDate, sumBy } from "@/lib/utils";
import type { CashReconciliation } from "@/types/wallet";
import type { SeriesPoint } from "@/types";
import { RECON_STATUS_META } from "./meta";

function gapClass(gap: number): string {
  if (gap > 0) return "text-error";
  if (gap < 0) return "text-warning";
  return "text-success";
}

function gapLabel(gap: number): string {
  const sign = gap > 0 ? "+" : "";
  return `${sign}${formatFcfa(gap)}`;
}

const COLUMNS: Column<CashReconciliation>[] = [
  {
    key: "date",
    header: "Date",
    cell: (r) => <span className="font-medium text-ink">{formatDate(r.date)}</span>,
  },
  {
    key: "driver",
    header: "Livreur",
    cell: (r) => <span className="text-ink">{r.driverName}</span>,
  },
  {
    key: "collected",
    header: "Collecté",
    align: "right",
    cell: (r) => <span className="text-ink">{formatFcfa(r.collected)}</span>,
  },
  {
    key: "declared",
    header: "Déclaré",
    align: "right",
    cell: (r) => <span className="text-muted">{formatFcfa(r.declared)}</span>,
  },
  {
    key: "remitted",
    header: "Remis",
    align: "right",
    cell: (r) => <span className="text-muted">{formatFcfa(r.remitted)}</span>,
  },
  {
    key: "electronic",
    header: "Électronique",
    align: "right",
    cell: (r) => <span className="text-muted">{formatFcfa(r.electronic)}</span>,
  },
  {
    key: "gap",
    header: "Écart",
    align: "right",
    cell: (r) => <span className={cn("font-semibold", gapClass(r.gap))}>{gapLabel(r.gap)}</span>,
  },
  {
    key: "status",
    header: "Statut",
    cell: (r) => {
      const m = RECON_STATUS_META[r.status];
      return <Badge tone={m.tone}>{m.label}</Badge>;
    },
  },
];

export function ReconciliationPanel({ reconciliations }: { reconciliations: CashReconciliation[] }) {
  const totals = React.useMemo(
    () => ({
      collected: sumBy(reconciliations, (r) => r.collected),
      declared: sumBy(reconciliations, (r) => r.declared),
      remitted: sumBy(reconciliations, (r) => r.remitted),
      electronic: sumBy(reconciliations, (r) => r.electronic),
      gap: sumBy(reconciliations, (r) => r.gap),
    }),
    [reconciliations],
  );

  // Collecté par jour (chronologique, déterministe)
  const chartData = React.useMemo<SeriesPoint[]>(
    () =>
      [...reconciliations]
        .reverse()
        .slice(-10)
        .map((r) => ({ label: formatDate(r.date), value: r.collected, secondary: r.remitted })),
    [reconciliations],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={COLUMNS}
        rows={reconciliations}
        getRowKey={(r) => r.id}
        minWidth={860}
        empty="Aucun rapprochement disponible."
      />

      {/* Ligne de total */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-shell/60 p-4 text-[13px] sm:grid-cols-5">
        <div>
          <p className="text-muted">Total collecté</p>
          <p className="font-bold text-ink">{formatFcfa(totals.collected)}</p>
        </div>
        <div>
          <p className="text-muted">Total déclaré</p>
          <p className="font-bold text-ink">{formatFcfa(totals.declared)}</p>
        </div>
        <div>
          <p className="text-muted">Total remis</p>
          <p className="font-bold text-ink">{formatFcfa(totals.remitted)}</p>
        </div>
        <div>
          <p className="text-muted">Total électronique</p>
          <p className="font-bold text-ink">{formatFcfa(totals.electronic)}</p>
        </div>
        <div>
          <p className="text-muted">Écart total</p>
          <p className={cn("font-bold", gapClass(totals.gap))}>{gapLabel(totals.gap)}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collecté vs remis par jour</CardTitle>
          <CardDescription>Volume d'espèces collecté quotidiennement (10 derniers jours).</CardDescription>
        </CardHeader>
        <div className="px-2 pb-4">
          <BarSeries data={chartData} height={220} />
        </div>
      </Card>
    </div>
  );
}
