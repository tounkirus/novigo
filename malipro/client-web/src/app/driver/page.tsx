"use client";

import * as React from "react";
import Image from "next/image";
import { Bike, Check, MapPin, Package, Star, TrendingUp, Wallet, X } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { AreaTrend, BarSeries } from "@/components/ui/charts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { topRatedStores, drivers, revenueSeries, hourlySeries } from "@/mock";
import { BAMAKO_DISTRICTS } from "@/constants";
import { cn, formatFcfa, formatDistance } from "@/lib/utils";

interface Course {
  id: string;
  store: string;
  logo: string;
  district: string;
  distanceKm: number;
  payout: number;
  items: number;
}

export default function DriverDashboardPage() {
  const { toast } = useToast();
  const driver = drivers()[0];
  const gains = revenueSeries(14, 3);
  const hourly = hourlySeries(21);

  const [online, setOnline] = React.useState(true);
  const [handled, setHandled] = React.useState<Record<string, "accepted" | "refused">>({});

  const courses: Course[] = React.useMemo(
    () =>
      topRatedStores(8).map((s, i) => ({
        id: s.id,
        store: s.name,
        logo: s.logo,
        district: BAMAKO_DISTRICTS[(i * 3 + 2) % BAMAKO_DISTRICTS.length],
        distanceKm: 1.1 + (i % 5) * 0.9,
        payout: 750 + (i % 6) * 250,
        items: 1 + (i % 4),
      })),
    [],
  );

  const act = (c: Course, kind: "accepted" | "refused") => {
    setHandled((h) => ({ ...h, [c.id]: kind }));
    toast({
      title: kind === "accepted" ? "Course acceptée" : "Course refusée",
      description: `${c.store} · ${c.district}`,
      tone: kind === "accepted" ? "success" : "info",
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Bonjour {driver.name.split(" ")[0]}</h2>
          <p className="text-sm text-muted">Voici votre activité du jour à Bamako.</p>
        </div>
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-card transition",
            online ? "border-success/30 bg-success-soft" : "border-line bg-surface",
          )}
        >
          <span className={cn("h-2.5 w-2.5 rounded-full", online ? "bg-success" : "bg-muted")} />
          <span className={cn("text-sm font-semibold", online ? "text-success" : "text-muted")}>
            {online ? "En ligne" : "Hors ligne"}
          </span>
          <Switch checked={online} onCheckedChange={setOnline} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Courses du jour" value="14" delta={8} hint="vs hier" icon={<Package className="h-5 w-5" />} />
        <KpiCard label="Gains du jour" value={formatFcfa(28750)} delta={12} hint="vs hier" icon={<Wallet className="h-5 w-5" />} />
        <KpiCard label="Note moyenne" value={driver.rating.toFixed(1)} hint={`${driver.deliveries} livraisons`} icon={<Star className="h-5 w-5" />} />
        <KpiCard label="Taux d'acceptation" value="92 %" delta={3} hint="7 derniers jours" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gains des 14 derniers jours</CardTitle>
            <CardDescription>Revenus nets encaissés après commission NOVIGO.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <AreaTrend data={gains} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Courses par heure</CardTitle>
            <CardDescription>Répartition sur la journée.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <BarSeries data={hourly} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Courses en attente</CardTitle>
            <CardDescription>Acceptez une course pour démarrer la livraison.</CardDescription>
          </div>
          <Badge tone="brand">
            <Bike className="h-3.5 w-3.5" /> {courses.length} disponibles
          </Badge>
        </CardHeader>
        <div className="divide-y divide-line border-t border-line">
          {courses.map((c) => {
            const state = handled[c.id];
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-shell">
                  <Image src={c.logo} alt={c.store} fill sizes="48px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{c.store}</p>
                  <p className="flex items-center gap-1 truncate text-[13px] text-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" /> {c.district} · {c.items} article(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] text-muted">{formatDistance(c.distanceKm)}</p>
                  <p className="font-bold text-ink">{formatFcfa(c.payout)}</p>
                </div>
                {state ? (
                  <Badge tone={state === "accepted" ? "success" : "neutral"} className="w-28 justify-center py-1.5">
                    {state === "accepted" ? "Acceptée" : "Refusée"}
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="success" onClick={() => act(c, "accepted")} disabled={!online}>
                      <Check className="h-4 w-4" /> Accepter
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => act(c, "refused")}>
                      <X className="h-4 w-4" /> Refuser
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
