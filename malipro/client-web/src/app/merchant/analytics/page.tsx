"use client";

import * as React from "react";
import Image from "next/image";
import { Wallet, ShoppingBag, TrendingUp, Percent } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { AreaTrend, BarSeries, DonutChart, PIE_COLORS } from "@/components/ui/charts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import { stores, productsOf, revenueSeries, hourlySeries, categoryShare } from "@/mock";
import { formatFcfa, formatCompact } from "@/lib/utils";

export default function MerchantAnalyticsPage() {
  const store = stores()[0];
  const revenue = React.useMemo(() => revenueSeries(30, 8), []);
  const hourly = React.useMemo(() => hourlySeries(13), []);
  const share = React.useMemo(() => categoryShare(), []);

  const topProducts = React.useMemo(
    () => [...productsOf(store)].sort((a, b) => b.popularity - a.popularity).slice(0, 8),
    [store],
  );
  const maxPop = topProducts[0]?.popularity ?? 100;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Statistiques</h2>
        <p className="text-sm text-muted">Analyse détaillée des performances de {store.name}.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="CA (30 jours)" value={formatFcfa(9_840_000)} delta={14} hint="vs mois passé" icon={<Wallet className="h-5 w-5" />} />
        <KpiCard label="Commandes" value="2 148" delta={9} hint="30 jours" icon={<ShoppingBag className="h-5 w-5" />} />
        <KpiCard label="Panier moyen" value={formatFcfa(store.avgPrice)} delta={3} hint="30 jours" icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard label="Taux de conversion" value="6,4 %" delta={-1} hint="visites → commandes" icon={<Percent className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenus (30 jours)</CardTitle>
          <CardDescription>Évolution du chiffre d'affaires quotidien.</CardDescription>
        </CardHeader>
        <div className="px-2 pb-4">
          <AreaTrend data={revenue} height={260} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventes par catégorie</CardTitle>
            <CardDescription>Répartition des commandes.</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>Heures de pointe</CardTitle>
            <CardDescription>Commandes reçues par tranche horaire.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <BarSeries data={hourly} height={220} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classement des produits</CardTitle>
          <CardDescription>Vos meilleures ventes du mois.</CardDescription>
        </CardHeader>
        <div className="divide-y divide-line border-t border-line">
          {topProducts.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-5 text-center text-sm font-black text-muted">{i + 1}</span>
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-shell">
                <Image src={p.image} alt={p.name} fill sizes="44px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress value={(p.popularity / maxPop) * 100} className="max-w-[180px]" />
                  <span className="text-[12px] text-muted">{formatCompact(p.reviewCount)} ventes</span>
                </div>
              </div>
              <span className="text-sm font-bold text-ink">{formatFcfa(p.price)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
