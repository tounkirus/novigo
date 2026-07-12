"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/mock/api";
import { revenueSeries } from "@/mock";
import type { SeriesPoint } from "@/types";
import type { PayoutRequest } from "@/types/wallet";
import { NOW } from "@/constants";
import { formatFcfa, timeAgo } from "@/lib/utils";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, TableSkeleton, ChartSkeleton, ListRowSkeleton } from "@/components/ui/skeletons";
import { Reveal } from "@/components/ui/reveal";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaTrend, BarSeries } from "@/components/ui/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/ui/states";
import { WalletBalanceCard, StatTiles, type StatTile } from "@/features/wallet/shared/wallet-ui";
import { TransactionList } from "@/features/wallet/shared/transaction-list";
import { METHOD_LABEL } from "@/features/wallet/shared/tx-utils";
import { DriverPayoutActions } from "@/features/wallet/driver/payout-actions";
import { DriverInvoicesCard } from "@/features/wallet/driver/invoices-card";

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
/** Répartition déterministe des gains hebdomadaires (aucun aléatoire). */
const WEEK_FACTORS = [0.82, 1.04, 0.93, 1.16, 1.31, 1.42, 0.68];

const PAYOUT_STATUS_META: Record<PayoutRequest["status"], { label: string; tone: "success" | "warning" | "error" | "info" }> = {
  PENDING: { label: "En attente", tone: "warning" },
  APPROVED: { label: "Approuvée", tone: "info" },
  PAID: { label: "Payée", tone: "success" },
  REJECTED: { label: "Rejetée", tone: "error" },
};

function BalanceSkeleton() {
  return <Skeleton className="h-48 w-full rounded-3xl" />;
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <KpiRowSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton height={240} />
        <ChartSkeleton height={240} />
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

export default function DriverWalletPage() {
  const accountQuery = useQuery({ queryKey: ["driverWallet"], queryFn: () => api.walletAccount("DRIVER") });
  const summaryQuery = useQuery({ queryKey: ["driverWalletSummary"], queryFn: () => api.driverWalletSummary() });
  const payoutsQuery = useQuery({ queryKey: ["payoutRequests"], queryFn: () => api.payoutRequests() });

  const revenue14d: SeriesPoint[] = React.useMemo(() => revenueSeries(14), []);

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
        <h2 className="text-xl font-bold tracking-tight text-ink">Portefeuille</h2>
        <p className="text-sm text-muted">Gérez vos gains, retraits et versements en toute transparence.</p>
      </div>

      {/* Solde principal + actions de retrait */}
      <Reveal>
        <QueryState query={accountQuery} skeleton={<BalanceSkeleton />}>
          {(account) => (
            <WalletBalanceCard
              label="Solde disponible"
              balance={account.balance}
              pending={summaryQuery.data?.pendingPayout ?? account.pending}
              pendingLabel="Reversement en attente"
              gradient="brand-gradient"
              actions={<DriverPayoutActions balance={account.balance} />}
            />
          )}
        </QueryState>
      </Reveal>

      {/* Statistiques de gains + graphiques */}
      <Reveal delay={0.05}>
        <QueryState query={summaryQuery} skeleton={<StatsSkeleton />}>
          {(summary) => {
            const tiles: StatTile[] = [
              { label: "Gains du jour", value: summary.today, money: true, icon: "Sun", tone: "success" },
              { label: "Cette semaine", value: summary.week, money: true, icon: "CalendarDays", tone: "brand" },
              { label: "Ce mois", value: summary.month, money: true, icon: "CalendarRange", tone: "brand" },
              { label: "Pourboires", value: summary.tips, money: true, icon: "HandCoins", tone: "success" },
              { label: "Bonus", value: summary.bonus, money: true, icon: "Gift", tone: "info" },
              { label: "Commissions", value: summary.commissions, money: true, icon: "Percent", tone: "warning" },
              { label: "Ajustements", value: summary.adjustments, money: true, icon: "Sliders", tone: "neutral" },
              { label: "Retraits", value: summary.withdrawals, money: true, icon: "ArrowUpFromLine", tone: "neutral" },
            ];
            const dayGains: SeriesPoint[] = WEEK_DAYS.map((label, i) => ({
              label,
              value: Math.round((summary.today * WEEK_FACTORS[i]) / 100) * 100,
            }));
            return (
              <div className="space-y-6">
                <StatTiles items={tiles} cols={4} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenus sur 14 jours</CardTitle>
                      <CardDescription>Évolution de vos gains quotidiens</CardDescription>
                    </CardHeader>
                    <div className="px-2 pb-4">
                      <AreaTrend data={revenue14d} />
                    </div>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Gains par jour</CardTitle>
                      <CardDescription>Répartition sur la semaine en cours</CardDescription>
                    </CardHeader>
                    <div className="px-2 pb-4">
                      <BarSeries data={dayGains} />
                    </div>
                  </Card>
                </div>
              </div>
            );
          }}
        </QueryState>
      </Reveal>

      {/* Demandes de paiement (retraits) */}
      <Reveal delay={0.1}>
        <div className="space-y-3">
          <h2 className="text-base font-bold text-ink">Demandes de paiement</h2>
          <QueryState
            query={payoutsQuery}
            skeleton={<TableSkeleton rows={6} cols={6} />}
            isEmpty={(rows) => rows.filter((r) => r.role === "DRIVER").length === 0}
            emptyState={<EmptyState title="Aucune demande" description="Vous n'avez encore demandé aucun retrait." />}
          >
            {(rows) => (
              <DataTable
                columns={payoutColumns}
                rows={rows.filter((r) => r.role === "DRIVER")}
                getRowKey={(p) => p.id}
              />
            )}
          </QueryState>
        </div>
      </Reveal>

      {/* Factures & reçus */}
      <Reveal delay={0.15}>
        <DriverInvoicesCard />
      </Reveal>

      {/* Historique des transactions (composant partagé) */}
      <Reveal delay={0.2}>
        <QueryState query={accountQuery} skeleton={<TransactionsSkeleton />}>
          {(account) => (
            <TransactionList transactions={account.transactions} title="Historique des transactions" />
          )}
        </QueryState>
      </Reveal>
    </div>
  );
}
