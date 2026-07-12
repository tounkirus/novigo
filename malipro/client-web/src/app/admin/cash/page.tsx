"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Wallet,
  Undo2,
  Clock,
  AlertTriangle,
  Coins,
  PieChart as PieIcon,
} from "lucide-react";
import { api } from "@/mock/api";
import { QueryState } from "@/components/ui/async-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { DonutChart, PIE_COLORS } from "@/components/ui/charts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiRowSkeleton, TableSkeleton, ChartSkeleton } from "@/components/ui/skeletons";
import { Reveal } from "@/components/ui/reveal";
import { formatFcfa } from "@/lib/utils";
import type { CashDashboard } from "@/types/wallet";
import type { SeriesPoint } from "@/types";
import { CashRegistersTable } from "@/features/backoffice/cash/cash-registers-table";
import { RemittancesPanel } from "@/features/backoffice/cash/remittances-panel";
import { ReconciliationPanel } from "@/features/backoffice/cash/reconciliation-panel";
import { DiscrepanciesPanel } from "@/features/backoffice/cash/discrepancies-panel";
import { AccountingBar } from "@/features/backoffice/cash/accounting-bar";

function DashboardHeader({ dashboard }: { dashboard: CashDashboard }) {
  const cashData: SeriesPoint[] = [
    { label: "Espèces", value: dashboard.cashRatio },
    { label: "Électronique", value: 100 - dashboard.cashRatio },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <KpiCard
            label="Cash collecté aujourd'hui"
            value={formatFcfa(dashboard.collectedToday)}
            icon={<Banknote className="h-5 w-5" />}
            tone="success"
            hint="tous livreurs"
          />
          <KpiCard
            label="En circulation"
            value={formatFcfa(dashboard.inCirculation)}
            icon={<Wallet className="h-5 w-5" />}
            tone="info"
            hint="non reversé"
          />
          <KpiCard
            label="Remis aujourd'hui"
            value={formatFcfa(dashboard.remittedToday)}
            icon={<Undo2 className="h-5 w-5" />}
            tone="brand"
            hint="reversements"
          />
          <KpiCard
            label="En attente"
            value={formatFcfa(dashboard.pending)}
            icon={<Clock className="h-5 w-5" />}
            tone="warning"
            hint="à reverser"
          />
          <KpiCard
            label="Écarts totaux"
            value={formatFcfa(dashboard.gapsTotal)}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="error"
            hint="à investiguer"
          />
          <KpiCard
            label="Paiements espèces"
            value={String(dashboard.cashPayments)}
            icon={<Coins className="h-5 w-5" />}
            tone="brand"
            hint="transactions du jour"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-brand" /> Cash vs Électronique
          </CardTitle>
          <CardDescription>Répartition des paiements de la plateforme.</CardDescription>
        </CardHeader>
        <div className="relative px-2 pb-2">
          <DonutChart data={cashData} height={190} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-ink">{dashboard.cashRatio}%</span>
            <span className="text-[11px] text-muted">espèces</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-5 pb-5">
          {cashData.map((s, i) => (
            <span key={s.label} className="flex items-center gap-1.5 text-[12px] text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              {s.label} · {s.value}%
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function AdminCashPage() {
  const dashboardQuery = useQuery({ queryKey: ["cashDashboard"], queryFn: () => api.cashDashboard() });
  const registersQuery = useQuery({ queryKey: ["cashRegisters"], queryFn: () => api.cashRegisters(40) });
  const remittancesQuery = useQuery({ queryKey: ["cashRemittances"], queryFn: () => api.cashRemittances() });
  const reconciliationsQuery = useQuery({ queryKey: ["cashReconciliations"], queryFn: () => api.cashReconciliations() });
  const discrepanciesQuery = useQuery({ queryKey: ["cashDiscrepancies"], queryFn: () => api.cashDiscrepancies() });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Gestion de caisse</h2>
        <p className="text-sm text-muted">
          Supervision en temps réel du cash : caisses livreurs, remises, rapprochement et écarts.
        </p>
      </div>

      <QueryState
        query={dashboardQuery}
        skeleton={
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <KpiRowSkeleton count={6} />
            </div>
            <ChartSkeleton height={280} />
          </div>
        }
      >
        {(dashboard) => (
          <Reveal>
            <DashboardHeader dashboard={dashboard} />
          </Reveal>
        )}
      </QueryState>

      <Tabs defaultValue="registers">
        <TabsList className="flex w-full max-w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="registers">Caisses livreurs</TabsTrigger>
          <TabsTrigger value="remittances">Remises à valider</TabsTrigger>
          <TabsTrigger value="reconciliation">Rapprochement</TabsTrigger>
          <TabsTrigger value="discrepancies">Écarts & fraude</TabsTrigger>
        </TabsList>

        <TabsContent value="registers">
          <QueryState
            query={registersQuery}
            skeleton={<TableSkeleton rows={8} cols={8} />}
            isEmpty={(d) => d.length === 0}
          >
            {(registers) => <CashRegistersTable registers={registers} />}
          </QueryState>
        </TabsContent>

        <TabsContent value="remittances">
          <QueryState
            query={remittancesQuery}
            skeleton={<TableSkeleton rows={8} cols={7} />}
            isEmpty={(d) => d.length === 0}
          >
            {(remittances) => <RemittancesPanel remittances={remittances} />}
          </QueryState>
        </TabsContent>

        <TabsContent value="reconciliation">
          <QueryState
            query={reconciliationsQuery}
            skeleton={<TableSkeleton rows={8} cols={8} />}
            isEmpty={(d) => d.length === 0}
          >
            {(reconciliations) => <ReconciliationPanel reconciliations={reconciliations} />}
          </QueryState>
        </TabsContent>

        <TabsContent value="discrepancies">
          <QueryState
            query={discrepanciesQuery}
            skeleton={<TableSkeleton rows={6} cols={8} />}
            isEmpty={(d) => d.length === 0}
          >
            {(discrepancies) => <DiscrepanciesPanel discrepancies={discrepancies} />}
          </QueryState>
        </TabsContent>
      </Tabs>

      <AccountingBar />
    </div>
  );
}
