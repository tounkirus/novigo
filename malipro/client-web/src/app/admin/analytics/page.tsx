"use client";

import * as React from "react";
import { TrendingUp, ShoppingBag, Wallet, Users, Percent, Repeat } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Segmented } from "@/components/ui/misc";
import { AreaTrend, BarSeries, LineDuo, DonutChart, PIE_COLORS } from "@/components/ui/charts";
import { revenueSeries, hourlySeries, categoryShare, topRatedStores } from "@/mock";
import { BAMAKO_DISTRICTS } from "@/constants";
import { formatFcfa, formatCompact, sumBy } from "@/lib/utils";
import type { SeriesPoint } from "@/types";
import { TopStoresRanking, TopDistrictsRanking } from "@/features/backoffice/analytics/rankings";
import { ConversionFunnel } from "@/features/backoffice/analytics/conversion-funnel";
import { SalesHeatmap } from "@/features/backoffice/analytics/sales-heatmap";

type Period = "7" | "14" | "30";
const PERIODS: { value: Period; label: string }[] = [
  { value: "7", label: "7 jours" },
  { value: "14", label: "14 jours" },
  { value: "30", label: "30 jours" },
];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = React.useState<Period>("14");
  const days = Number(period);

  const series = React.useMemo(() => revenueSeries(days), [days]);
  const hourly = React.useMemo(() => hourlySeries(), []);
  const share = React.useMemo(() => categoryShare(), []);
  const leaders = React.useMemo(() => topRatedStores(8), []);

  // Séries dérivées déterministes (jamais de Math.random / Date.now).
  const ordersVsClients = React.useMemo<SeriesPoint[]>(
    () =>
      series.map((p) => {
        const orders = p.secondary ?? 0;
        return { label: p.label, value: orders, secondary: Math.round(orders * 0.48) };
      }),
    [series],
  );

  const gmv = sumBy(series, (s) => s.value);
  const orders = sumBy(series, (s) => s.secondary ?? 0);
  const basket = Math.round(gmv / Math.max(1, orders));
  const activeClients = Math.round(orders * 0.62);

  // Entonnoir cohérent, reconstruit à partir des commandes réelles.
  const baskets = Math.round(orders / 0.55);
  const visitors = Math.round(baskets / 0.34);
  const delivered = Math.round(orders * 0.94);
  const conversion = (orders / Math.max(1, visitors)) * 100;
  const retention = 68.4;

  const districts = React.useMemo(
    () =>
      BAMAKO_DISTRICTS.slice(0, 8).map((name, i) => ({
        name,
        revenue: Math.round((gmv * (0.19 - i * 0.019 + (i % 3) * 0.006)) / 1000) * 1000,
        orders: Math.round(orders * (0.19 - i * 0.019)),
      })),
    [gmv, orders],
  );

  const funnel = [
    { label: "Visiteurs", value: visitors, hint: "Sessions uniques sur l'application" },
    { label: "Paniers créés", value: baskets, hint: "Ont ajouté au moins un article" },
    { label: "Commandes", value: orders, hint: "Commandes payées et validées" },
    { label: "Livrées", value: delivered, hint: "Commandes livrées avec succès" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Analytique avancée</h2>
          <p className="text-sm text-muted">Performance commerciale de NOVIGO à Bamako.</p>
        </div>
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="GMV (chiffre d'affaires)"
          value={`${formatCompact(gmv)} FCFA`}
          delta={12}
          hint={`sur ${days} j`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiCard label="Commandes" value={formatCompact(orders)} delta={9} hint="payées" icon={<ShoppingBag className="h-5 w-5" />} />
        <KpiCard label="Panier moyen" value={formatFcfa(basket)} delta={4} hint="par commande" icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard label="Clients actifs" value={formatCompact(activeClients)} delta={15} hint="sur la période" icon={<Users className="h-5 w-5" />} />
        <KpiCard label="Taux de conversion" value={`${conversion.toFixed(1)}%`} delta={3} hint="visiteur → commande" icon={<Percent className="h-5 w-5" />} />
        <KpiCard label="Taux de rétention" value={`${retention.toFixed(1)}%`} delta={-2} hint="clients récurrents" icon={<Repeat className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenus ({days} jours)</CardTitle>
            <CardDescription>Chiffre d'affaires quotidien, tous commerces confondus.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <AreaTrend data={series} height={260} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
            <CardDescription>Poids des familles de commerces.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-2">
            <DonutChart data={share} height={200} />
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commandes vs nouveaux clients</CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "rgb(var(--brand))" }} /> Commandes
              </span>
              <span className="ml-3 inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "rgb(var(--gold-dark))" }} /> Nouveaux clients
              </span>
            </CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <LineDuo data={ordersVsClients} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Volume horaire des commandes</CardTitle>
            <CardDescription>Activité moyenne sur 24 h.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <BarSeries data={hourly} height={240} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopStoresRanking stores={leaders} />
        <TopDistrictsRanking districts={districts} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConversionFunnel stages={funnel} />
        <SalesHeatmap />
      </div>
    </div>
  );
}
