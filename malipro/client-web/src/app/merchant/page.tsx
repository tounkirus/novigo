"use client";

import * as React from "react";
import Image from "next/image";
import { Wallet, ShoppingBag, TrendingUp, Star } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { AreaTrend, BarSeries, DonutChart, PIE_COLORS } from "@/components/ui/charts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { person } from "@/components/dashboard/people";
import { stores, productsOf, revenueSeries, hourlySeries, categoryShare } from "@/mock";
import { ORDER_STATUS } from "@/constants";
import type { OrderStatus } from "@/types";
import { formatFcfa, formatCompact, formatRating } from "@/lib/utils";

const RECENT_STATUS: OrderStatus[] = ["PENDING", "PREPARING", "READY", "DELIVERING", "PREPARING", "CONFIRMED"];

export default function MerchantDashboardPage() {
  const store = stores()[0];
  const products = React.useMemo(() => productsOf(store), [store]);
  const revenue = React.useMemo(() => revenueSeries(14, 5), []);
  const hourly = React.useMemo(() => hourlySeries(9), []);
  const share = React.useMemo(() => categoryShare(), []);

  const recent = React.useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const p = person(i * 2);
        const prod = products[(i * 3) % products.length];
        const items = 1 + (i % 4);
        return {
          id: `mo_${i}`,
          ref: `#${8420 + i * 3}`,
          customer: p.name,
          items,
          total: prod.price * items + 1000,
          status: RECENT_STATUS[i % RECENT_STATUS.length],
        };
      }),
    [products],
  );

  const popular = products.slice(0, 6);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-shell">
          <Image src={store.logo} alt={store.name} fill sizes="48px" className="object-cover" />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">{store.name}</h2>
          <p className="text-sm text-muted">{store.district}, Bamako · Tableau de bord commerçant</p>
        </div>
        <Badge tone={store.isOpen ? "success" : "neutral"} className="ml-auto">
          {store.isOpen ? "Ouvert" : "Fermé"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenus du jour" value={formatFcfa(412000)} delta={11} hint="vs hier" icon={<Wallet className="h-5 w-5" />} />
        <KpiCard label="Commandes" value="86" delta={7} hint="aujourd'hui" icon={<ShoppingBag className="h-5 w-5" />} />
        <KpiCard label="Panier moyen" value={formatFcfa(store.avgPrice)} delta={-2} hint="7 jours" icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard label="Note" value={formatRating(store.rating)} hint={`${formatCompact(store.reviewCount)} avis`} icon={<Star className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenus (14 jours)</CardTitle>
            <CardDescription>Chiffre d'affaires quotidien de votre commerce.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <AreaTrend data={revenue} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ventes par catégorie</CardTitle>
            <CardDescription>Répartition du catalogue NOVIGO.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-2">
            <DonutChart data={share} height={200} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pb-5">
            {share.slice(0, 5).map((s, i) => (
              <span key={s.label} className="flex items-center gap-1.5 text-[12px] text-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {s.label}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventes par heure</CardTitle>
          <CardDescription>Identifiez vos heures de pointe.</CardDescription>
        </CardHeader>
        <div className="px-2 pb-4">
          <BarSeries data={hourly} height={200} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dernières commandes</CardTitle>
          </CardHeader>
          <div className="divide-y divide-line border-t border-line">
            {recent.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-[12px] font-bold text-brand">
                  {o.customer.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{o.customer}</p>
                  <p className="text-[12px] text-muted">{o.ref} · {o.items} article(s)</p>
                </div>
                <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                <span className="w-24 text-right text-sm font-bold text-ink">{formatFcfa(o.total)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produits populaires</CardTitle>
          </CardHeader>
          <div className="divide-y divide-line border-t border-line">
            {popular.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 text-center text-sm font-bold text-muted">{i + 1}</span>
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-shell">
                  <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-[12px] text-muted">{p.category}</p>
                </div>
                <span className="text-sm font-bold text-ink">{formatFcfa(p.price)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
