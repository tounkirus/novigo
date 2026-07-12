"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/mock/api";
import { revenueSeries } from "@/mock";
import type { SeriesPoint } from "@/types";
import type { PayoutRequest, MerchantWalletSummary } from "@/types/wallet";
import { NOW } from "@/constants";
import { formatFcfa, timeAgo } from "@/lib/utils";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, TableSkeleton, ChartSkeleton, ListRowSkeleton } from "@/components/ui/skeletons";
import { Reveal } from "@/components/ui/reveal";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaTrend, DonutChart, PIE_COLORS } from "@/components/ui/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/ui/states";
import { WalletBalanceCard, StatTiles, type StatTile } from "@/features/wallet/shared/wallet-ui";
import { TransactionList } from "@/features/wallet/shared/transaction-list";
import { METHOD_LABEL } from "@/features/wallet/shared/tx-utils";
import { MerchantPayoutActions } from "@/features/wallet/merchant/payout-actions";
import { MerchantFinancialReports } from "@/features/wallet/merchant/financial-reports";
import { MerchantInvoicesCard } from "@/features/wallet/merchant/invoices-card";

const PAYOUT_STATUS_META: Record<PayoutRequest["status"], { label: string; tone: "success" | "warning" | "error" | "info" }> = {
  PENDING: { label: "En attente", tone: "warning" },
  APPROVED: { label: "Approuvée", tone: "info" },
  PAID: { label: "Payée", tone: "success" },
  REJECTED: { label: "Rejetée", tone: "error" },
};

function BalanceSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-48 w-full rounded-3xl" />
      <Skeleton className="h-48 w-full rounded-3xl" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <KpiRowSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton height={260} />
        <ChartSkeleton height={260} />
      </div>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

function shareData(summary: MerchantWalletSummary): SeriesPoint[] {
  return [
    { label: "Ventes", value: summary.sales },
    { label: "Commissions", value: summary.commissions },
    { label: "Publicités", value: summary.ads },
    { label: "Abonnements", value: summary.subscriptions },
    { label: "Remboursements", value: summary.refunds },
  ];
}

export default function MerchantWalletPage() {
  const accountQuery = useQuery({ queryKey: ["merchantWallet"], queryFn: () => api.walletAccount("MERCHANT") });
  const summaryQuery = useQuery({ queryKey: ["merchantWalletSummary"], queryFn: () => api.merchantWalletSummary() });
  const payoutsQuery = useQuery({ queryKey: ["payoutRequests"], queryFn: () => api.payoutRequests() });

  const revenue30d: SeriesPoint[] = React.useMemo(() => revenueSeries(30), []);

  const payoutColumns: Column<PayoutRequest>[] = [
    { key: "ref", header: "Référence", cell: (p) => <span className="font-semibold text-ink">{p.ref}</span> },
    {
      key: "amount",
      header: "Montant",
      align: "right",
      cell: (p) => <span className="font-bold tabular-nums text-ink">{formatFcfa(p.amount)}</span>,
    },
    { key: "method", header: "Méthode", cell: (p) => <span className="text-muted">{METHOD_LABEL[p.method]}</span> },
    {
      key: "mode",
      header: "Mode",
      cell: (p) => <Badge tone={p.auto ? "info" : "neutral"}>{p.auto ? "Automatique" : "Manuel"}</Badge>,
    },
    {
      key: "status",
      header: "Statut",
      cell: (p) => {
        const meta = PAYOUT_STATUS_META[p.status];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    { key: "date", header: "Date", cell: (p) => <span className="text-muted">{timeAgo(p.createdAt, NOW)}</span> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Portefeuille business</h2>
        <p className="text-sm text-muted">Suivez vos ventes, reversements et rapports financiers en temps réel.</p>
      </div>

      {/* Cartes de solde : disponible + en attente */}
      <Reveal>
        <QueryState query={summaryQuery} skeleton={<BalanceSkeleton />}>
          {(summary) => (
            <div className="grid gap-4 lg:grid-cols-2">
              <WalletBalanceCard
                label="Solde disponible"
                balance={summary.available}
                gradient="brand-gradient"
                actions={<MerchantPayoutActions available={summary.available} />}
              />
              <WalletBalanceCard
                label="Solde en attente"
                balance={summary.pending}
                gradient="premium-gradient"
                footer={<p className="text-[13px] opacity-90">Disponible sous 48 h après validation des commandes.</p>}
              />
            </div>
          )}
        </QueryState>
      </Reveal>

      {/* Tuiles statistiques */}
      <Reveal delay={0.05}>
        <QueryState query={summaryQuery} skeleton={<KpiRowSkeleton count={4} />}>
          {(summary) => {
            const tiles: StatTile[] = [
              { label: "Ventes", value: summary.sales, money: true, icon: "ShoppingBag", tone: "brand" },
              { label: "Reversements", value: summary.payouts, money: true, icon: "ArrowUpFromLine", tone: "neutral" },
              { label: "Remboursements", value: summary.refunds, money: true, icon: "Undo2", tone: "error" },
              { label: "Commissions NOVIGO", value: summary.commissions, money: true, icon: "Percent", tone: "warning" },
              { label: "Publicités", value: summary.ads, money: true, icon: "Megaphone", tone: "info" },
              { label: "Abonnements", value: summary.subscriptions, money: true, icon: "BadgeCheck", tone: "neutral" },
              { label: "Revenu net", value: summary.netRevenue, money: true, icon: "TrendingUp", tone: "success" },
            ];
            return <StatTiles items={tiles} cols={4} />;
          }}
        </QueryState>
      </Reveal>

      {/* Graphiques : revenus 30j + répartition */}
      <Reveal delay={0.1}>
        <QueryState query={summaryQuery} skeleton={<StatsSkeleton />}>
          {(summary) => {
            const share = shareData(summary);
            return (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenus (30 jours)</CardTitle>
                    <CardDescription>Évolution du chiffre d&apos;affaires quotidien.</CardDescription>
                  </CardHeader>
                  <div className="px-2 pb-4">
                    <AreaTrend data={revenue30d} height={260} />
                  </div>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition des flux</CardTitle>
                    <CardDescription>Ventes, commissions, publicités, abonnements et remboursements.</CardDescription>
                  </CardHeader>
                  <div className="px-2 pb-2">
                    <DonutChart data={share} height={220} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pb-5">
                    {share.map((s, i) => (
                      <span key={s.label} className="flex items-center gap-1.5 text-[12px] text-muted">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {s.label}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>
            );
          }}
        </QueryState>
      </Reveal>

      {/* Rapports financiers */}
      <Reveal delay={0.15}>
        <QueryState query={summaryQuery} skeleton={<ChartSkeleton height={220} />}>
          {(summary) => <MerchantFinancialReports summary={summary} />}
        </QueryState>
      </Reveal>

      {/* Reversements */}
      <Reveal delay={0.2}>
        <div className="space-y-3">
          <h2 className="text-base font-bold text-ink">Reversements</h2>
          <QueryState
            query={payoutsQuery}
            skeleton={<TableSkeleton rows={6} cols={6} />}
            isEmpty={(rows) => rows.filter((r) => r.role === "MERCHANT").length === 0}
            emptyState={<EmptyState title="Aucun reversement" description="Vous n'avez encore demandé aucun reversement." />}
          >
            {(rows) => (
              <DataTable
                columns={payoutColumns}
                rows={rows.filter((r) => r.role === "MERCHANT")}
                getRowKey={(p) => p.id}
              />
            )}
          </QueryState>
        </div>
      </Reveal>

      {/* Factures */}
      <Reveal delay={0.25}>
        <MerchantInvoicesCard />
      </Reveal>

      {/* Historique des transactions (composant partagé) */}
      <Reveal delay={0.3}>
        <QueryState query={accountQuery} skeleton={<TransactionsSkeleton />}>
          {(account) => <TransactionList transactions={account.transactions} title="Historique" />}
        </QueryState>
      </Reveal>
    </div>
  );
}
