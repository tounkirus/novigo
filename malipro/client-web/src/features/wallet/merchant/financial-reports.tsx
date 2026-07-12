"use client";

import * as React from "react";
import { FileSpreadsheet, FileText, Wallet, Percent, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/misc";
import { KpiCard } from "@/components/ui/kpi-card";
import { useToast } from "@/components/ui/toast";
import { downloadFile } from "@/features/wallet/shared/tx-utils";
import { formatFcfa } from "@/lib/utils";
import type { MerchantWalletSummary } from "@/types/wallet";

type Period = "week" | "month" | "year";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
];

/** Facteurs déterministes appliqués au résumé mensuel (aucun aléatoire). */
const PERIOD_FACTOR: Record<Period, number> = { week: 0.25, month: 1, year: 12 };
const PERIOD_LABEL: Record<Period, string> = { week: "cette semaine", month: "ce mois", year: "cette année" };
const PERIOD_DELTA: Record<Period, number> = { week: 6, month: 12, year: 21 };

const round = (n: number) => Math.round(n / 100) * 100;

/**
 * Rapports financiers commerçant : sélecteur de période + KPIs (CA, commissions,
 * revenu net) + export comptable CSV et rapport PDF.
 */
export function MerchantFinancialReports({ summary }: { summary: MerchantWalletSummary }) {
  const { toast } = useToast();
  const [period, setPeriod] = React.useState<Period>("month");

  const factor = PERIOD_FACTOR[period];
  const revenue = round(summary.sales * factor);
  const commissions = round(summary.commissions * factor);
  const refunds = round(summary.refunds * factor);
  const ads = round(summary.ads * factor);
  const subscriptions = round(summary.subscriptions * factor);
  const net = round(summary.netRevenue * factor);
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "";

  function exportCsv() {
    const rows: [string, number][] = [
      ["Chiffre d'affaires", revenue],
      ["Commissions NOVIGO", commissions],
      ["Remboursements", refunds],
      ["Publicités", ads],
      ["Abonnements", subscriptions],
      ["Revenu net", net],
    ];
    const csv = [
      ["Rubrique", `Montant (FCFA) — ${periodLabel}`].join(";"),
      ...rows.map(([label, val]) => [label, String(val)].join(";")),
    ].join("\n");
    downloadFile(csv, `novigo-rapport-comptable-${period}.csv`);
    toast({ title: "Export comptable généré", description: `Rapport ${periodLabel.toLowerCase()} au format CSV.`, tone: "success" });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Rapports financiers</CardTitle>
          <CardDescription>Synthèse comptable {PERIOD_LABEL[period]}.</CardDescription>
        </div>
        <Segmented options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </CardHeader>

      <div className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-3">
        <KpiCard
          label="Chiffre d'affaires"
          value={formatFcfa(revenue)}
          delta={PERIOD_DELTA[period]}
          hint={PERIOD_LABEL[period]}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiCard
          label="Commissions NOVIGO"
          value={formatFcfa(commissions)}
          hint={`${PERIOD_LABEL[period]} · prélevées`}
          icon={<Percent className="h-5 w-5" />}
        />
        <KpiCard
          label="Revenu net"
          value={formatFcfa(net)}
          delta={PERIOD_DELTA[period]}
          hint="après commissions & frais"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="flex flex-wrap gap-2 p-5">
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <FileSpreadsheet className="h-4 w-4" /> Export comptable
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            toast({
              title: "Rapport PDF en préparation",
              description: `Le rapport financier (${periodLabel.toLowerCase()}) sera disponible dans vos documents.`,
              tone: "info",
            })
          }
        >
          <FileText className="h-4 w-4" /> Rapport PDF
        </Button>
      </div>
    </Card>
  );
}
