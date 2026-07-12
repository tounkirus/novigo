"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getReconciliation } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatMoney } from "@/lib/utils";
import type { ReconciliationLine } from "@/lib/api/types";

const PROVIDERS = ["ORANGE_MONEY", "WAVE", "CARD"] as const;

const cols: Column<ReconciliationLine & { id: string }>[] = [
  { key: "internal", header: "Réf. SI", render: (l) => <span className="font-mono text-xs">{l.internalRef ?? "—"}</span> },
  { key: "provider", header: "Réf. opérateur", render: (l) => <span className="font-mono text-xs">{l.providerRef ?? "—"}</span> },
  { key: "internalAmount", header: "Montant SI", align: "right", render: (l) => formatMoney(l.internalAmount) },
  { key: "providerAmount", header: "Montant opérateur", align: "right", render: (l) => formatMoney(l.providerAmount) },
  { key: "status", header: "Rapprochement", render: (l) => <StatusBadge status={l.status} /> },
  { key: "date", header: "Date", align: "right", render: (l) => formatDate(l.occurredAt) },
];

export default function ReconciliationPage() {
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("ORANGE_MONEY");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [discrepanciesOnly, setDiscrepanciesOnly] = useState(true);

  const q = useQuery({
    queryKey: ["reconciliation", provider, dateFrom, dateTo],
    queryFn: () =>
      getReconciliation({
        provider,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const report = q.data?.data;
  const lines = (report?.lines ?? []).map((l, i) => ({ ...l, id: `${i}` }));
  const rows = discrepanciesOnly ? lines.filter((l) => l.status !== "MATCHED") : lines;

  return (
    <>
      <Topbar title="Réconciliation" />
      <main className="flex-1 space-y-6 p-6">
        <Link href="/payments" className="text-sm text-brand hover:underline">
          ← Retour aux paiements
        </Link>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Opérateur
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as (typeof PROVIDERS)[number])}
              className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Du
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Au
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none" />
          </label>
          <label className="ml-auto flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={discrepanciesOnly} onChange={(e) => setDiscrepanciesOnly(e.target.checked)} />
            Écarts seulement
          </label>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total SI" value={formatMoney(report?.summary.internalTotal)} />
          <KpiCard label="Total opérateur" value={formatMoney(report?.summary.providerTotal)} accent="gold" />
          <KpiCard label="Rapprochés" value={report?.summary.matched ?? "—"} />
          <KpiCard label="Écarts" value={report?.summary.discrepancies ?? "—"} accent="gold" />
        </section>

        <section className="rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">
              Lignes {discrepanciesOnly ? "en écart" : "rapprochées"}
            </h2>
            {report?.summary.difference && (
              <span className="font-mono text-sm text-ink">
                Différence nette : {formatMoney(report.summary.difference)}
              </span>
            )}
          </div>
          <DataTable
            columns={cols}
            rows={rows}
            loading={q.isLoading}
            emptyTitle={discrepanciesOnly ? "Aucun écart — tout est rapproché" : "Aucune ligne"}
          />
        </section>
      </main>
    </>
  );
}
