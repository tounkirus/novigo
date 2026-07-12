"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Clock, Users, Snowflake, TrendingUp, ShieldAlert } from "lucide-react";
import { api } from "@/mock/api";
import { revenueSeries } from "@/mock";
import type { WalletAccount, WalletRole } from "@/types/wallet";
import type { SeriesPoint } from "@/types";
import { QueryState } from "@/components/ui/async-state";
import { KpiRowSkeleton, ChartSkeleton } from "@/components/ui/skeletons";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaTrend, DonutChart, PIE_COLORS } from "@/components/ui/charts";
import { formatFcfa, formatCompact } from "@/lib/utils";
import { ROLE_LABEL } from "./shared";

/** Répartition des soldes par rôle, calculée depuis les comptes wallet. */
function balancesByRole(accounts: WalletAccount[]): SeriesPoint[] {
  const order: WalletRole[] = ["CLIENT", "DRIVER", "MERCHANT"];
  const totals = new Map<WalletRole, number>();
  for (const a of accounts) totals.set(a.role, (totals.get(a.role) ?? 0) + a.balance);
  return order
    .map((role) => ({ label: ROLE_LABEL[role], value: totals.get(role) ?? 0 }))
    .filter((p) => p.value > 0);
}

export function FinanceOverview() {
  const overviewQ = useQuery({ queryKey: ["adminFinance"], queryFn: () => api.adminFinanceOverview() });
  const walletsQ = useQuery({ queryKey: ["walletAccounts"], queryFn: () => api.walletAccounts(60) });
  const revenue = React.useMemo(() => revenueSeries(30, 2), []);

  return (
    <div className="space-y-6">
      <QueryState query={overviewQ} skeleton={<KpiRowSkeleton count={6} />}>
        {(o) => (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Solde total plateforme" value={formatFcfa(o.totalBalance)} delta={6} icon={<Wallet className="h-5 w-5" />} />
            <KpiCard label="En attente" value={formatFcfa(o.totalPending)} hint="reversements & retenues" icon={<Clock className="h-5 w-5" />} />
            <KpiCard label="Wallets actifs" value={formatCompact(o.walletsCount)} delta={4} icon={<Users className="h-5 w-5" />} />
            <KpiCard label="Wallets gelés" value={formatCompact(o.frozenCount)} hint="comptes bloqués" icon={<Snowflake className="h-5 w-5 text-error" />} />
            <KpiCard label="Volume 30j" value={formatFcfa(o.volume30d)} delta={9} icon={<TrendingUp className="h-5 w-5" />} />
            <KpiCard label="Alertes fraude" value={formatCompact(o.flaggedCount)} hint="à examiner" icon={<ShieldAlert className="h-5 w-5 text-warning" />} />
          </div>
        )}
      </QueryState>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Volume financier (30 jours)</CardTitle>
            <CardDescription>Flux monétaire quotidien sur l&apos;ensemble des wallets.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <AreaTrend data={revenue} height={260} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Soldes par rôle</CardTitle>
            <CardDescription>Répartition des fonds détenus.</CardDescription>
          </CardHeader>
          <QueryState query={walletsQ} skeleton={<ChartSkeleton height={200} />} isEmpty={(d) => d.length === 0}>
            {(accounts) => {
              const share = balancesByRole(accounts);
              return (
                <>
                  <div className="px-2 pb-2">
                    <DonutChart data={share} height={200} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pb-5">
                    {share.map((s, i) => (
                      <span key={s.label} className="flex items-center gap-1.5 text-[12px] text-muted">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {s.label} · {formatFcfa(s.value)}
                      </span>
                    ))}
                  </div>
                </>
              );
            }}
          </QueryState>
        </Card>
      </div>
    </div>
  );
}
