"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Percent, Send, Clock, PiggyBank } from "lucide-react";
import { api } from "@/mock/api";
import { revenueSeries } from "@/mock";
import type { Invoice } from "@/types/backoffice";
import { QueryState } from "@/components/ui/async-state";
import { KpiRowSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaTrend } from "@/components/ui/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import { formatFcfa, formatDate } from "@/lib/utils";

const TYPE_LABEL: Record<Invoice["type"], string> = {
  PAYOUT: "Reversement",
  INVOICE: "Facture",
  COMMISSION: "Commission",
};

const INVOICE_STATUS: Record<Invoice["status"], { label: string; tone: NonNullable<BadgeProps["tone"]> }> = {
  PAID: { label: "Payée", tone: "success" },
  PENDING: { label: "En attente", tone: "warning" },
  OVERDUE: { label: "En retard", tone: "error" },
};

export function FinancesTab() {
  const summaryQ = useQuery({ queryKey: ["financeSummary"], queryFn: () => api.financeSummary() });
  const invoicesQ = useQuery({ queryKey: ["invoices"], queryFn: () => api.invoices() });
  const revenue = React.useMemo(() => revenueSeries(30, 4), []);

  const columns: Column<Invoice>[] = [
    { key: "ref", header: "Référence", cell: (i) => <span className="font-semibold text-ink">{i.ref}</span> },
    { key: "party", header: "Tiers", cell: (i) => i.party },
    { key: "type", header: "Type", cell: (i) => <Badge tone="neutral">{TYPE_LABEL[i.type]}</Badge> },
    { key: "amount", header: "Montant", align: "right", cell: (i) => <span className="font-bold text-ink">{formatFcfa(i.amount)}</span> },
    { key: "status", header: "Statut", cell: (i) => <Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge> },
    { key: "due", header: "Échéance", cell: (i) => <span className="text-muted">{formatDate(i.dueAt)}</span> },
  ];

  return (
    <div className="space-y-4">
      <QueryState query={summaryQ} skeleton={<KpiRowSkeleton count={5} />}>
        {(s) => (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <KpiCard label="Revenus" value={formatFcfa(s.revenue)} delta={11} icon={<TrendingUp className="h-5 w-5" />} />
            <KpiCard label="Commissions" value={formatFcfa(s.commissions)} delta={7} icon={<Percent className="h-5 w-5" />} />
            <KpiCard label="Reversements" value={formatFcfa(s.payouts)} delta={9} icon={<Send className="h-5 w-5" />} />
            <KpiCard label="En attente" value={formatFcfa(s.pending)} icon={<Clock className="h-5 w-5" />} />
            <KpiCard label="Bénéfice net" value={formatFcfa(s.netProfit)} delta={11} icon={<PiggyBank className="h-5 w-5" />} />
          </div>
        )}
      </QueryState>

      <Card>
        <CardHeader>
          <CardTitle>Revenus (30 jours)</CardTitle>
          <CardDescription>Chiffre d'affaires quotidien de la plateforme.</CardDescription>
        </CardHeader>
        <div className="px-2 pb-4">
          <AreaTrend data={revenue} height={260} />
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Factures &amp; reversements</h3>
        <QueryState query={invoicesQ} skeleton={<TableSkeleton rows={8} cols={6} />} isEmpty={(d) => d.length === 0}>
          {(invoices) => (
            <DataTable columns={columns} rows={invoices} getRowKey={(i) => i.id} minWidth={820} empty="Aucune facture." />
          )}
        </QueryState>
      </div>
    </div>
  );
}
