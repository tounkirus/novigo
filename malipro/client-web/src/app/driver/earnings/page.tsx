"use client";

import * as React from "react";
import { Wallet, TrendingUp, Package, Gift } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { LineDuo } from "@/components/ui/charts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import type { SeriesPoint, PaymentMethodType } from "@/types";
import { NOW, PAYMENT_LABEL } from "@/constants";
import { formatFcfa, formatDate } from "@/lib/utils";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface Payout {
  id: string;
  period: string;
  courses: number;
  amount: number;
  method: PaymentMethodType;
  paid: boolean;
}

export default function DriverEarningsPage() {
  const week: SeriesPoint[] = React.useMemo(
    () =>
      DAYS.map((label, i) => ({
        label,
        value: 18000 + ((i * 37) % 11) * 1800 + (i % 3) * 2500,
        secondary: 15000 + ((i * 29) % 9) * 1600 + (i % 4) * 1900,
      })),
    [],
  );

  const payouts: Payout[] = React.useMemo(() => {
    const methods: PaymentMethodType[] = ["ORANGE_MONEY", "WAVE", "MOOV_MONEY", "ORANGE_MONEY"];
    return Array.from({ length: 9 }, (_, i) => ({
      id: `pay_${i}`,
      period: `Semaine ${34 - i}`,
      courses: 62 + ((i * 7) % 30),
      amount: 118000 + ((i * 53) % 40) * 1500,
      method: methods[i % methods.length],
      paid: i > 0,
    }));
  }, []);

  const total = payouts.reduce((s, p) => s + p.amount, 0);

  const columns: Column<Payout>[] = [
    { key: "period", header: "Période", cell: (p) => <span className="font-semibold text-ink">{p.period}</span> },
    { key: "courses", header: "Courses", align: "right", cell: (p) => p.courses },
    {
      key: "method",
      header: "Versé via",
      cell: (p) => <span className="text-muted">{PAYMENT_LABEL[p.method].label}</span>,
    },
    {
      key: "date",
      header: "Date",
      cell: (p) => <span className="text-muted">{formatDate(new Date(NOW - payouts.indexOf(p) * 7 * 86400_000).toISOString())}</span>,
    },
    {
      key: "status",
      header: "Statut",
      cell: (p) => <Badge tone={p.paid ? "success" : "warning"}>{p.paid ? "Payé" : "En attente"}</Badge>,
    },
    { key: "amount", header: "Montant", align: "right", cell: (p) => <span className="font-bold text-ink">{formatFcfa(p.amount)}</span> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Mes gains</h2>
        <p className="text-sm text-muted">Suivez vos revenus, pourboires et versements hebdomadaires.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Gains cumulés" value={formatFcfa(total)} delta={9} hint="ce mois" icon={<Wallet className="h-5 w-5" />} />
        <KpiCard label="Cette semaine" value={formatFcfa(148500)} delta={6} hint="vs semaine passée" icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard label="Courses effectuées" value="612" hint="30 derniers jours" icon={<Package className="h-5 w-5" />} />
        <KpiCard label="Pourboires" value={formatFcfa(21400)} delta={14} hint="ce mois" icon={<Gift className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparaison hebdomadaire</CardTitle>
          <CardDescription>
            <span className="text-brand">●</span> Cette semaine · <span className="text-gold-dark">●</span> Semaine précédente
          </CardDescription>
        </CardHeader>
        <div className="px-2 pb-4">
          <LineDuo data={week} />
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-base font-bold text-ink">Historique des versements</h3>
        <DataTable columns={columns} rows={payouts} getRowKey={(p) => p.id} />
      </div>
    </div>
  );
}
