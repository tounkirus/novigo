"use client";

import * as React from "react";
import {
  BrainCircuit, Route, Coins, Layers, ShieldCheck, ShieldAlert, Building2, GraduationCap,
  Activity, Gauge, BookOpen, Zap,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCompact } from "@/lib/utils";
import {
  BRAIN_ENGINES, brainCityInsights, brainDashboard, brainDecisions,
  type BrainCityInsights, type BrainDashboard, type BrainDecision,
} from "@/services/backend/brain";

/** Icône associée à chaque moteur, dans l'ordre du chapitre 15. */
const ENGINE_ICONS = [BrainCircuit, Coins, Route, Layers, ShieldCheck, ShieldAlert, Building2, GraduationCap];

const KIND_TONE: Record<BrainDecision["kind"], "brand" | "gold" | "success" | "error" | "info" | "violet"> = {
  ASSIGNMENT: "brand",
  PRICING: "gold",
  ROUTE: "info",
  BATCH: "violet",
  TRUST: "success",
  FRAUD: "error",
  LEARNING: "info",
};

const KIND_LABEL: Record<BrainDecision["kind"], string> = {
  ASSIGNMENT: "Attribution",
  PRICING: "Tarification",
  ROUTE: "Itinéraire",
  BATCH: "Regroupement",
  TRUST: "Confiance",
  FRAUD: "Fraude",
  LEARNING: "Apprentissage",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  DISPATCHING: "Recherche prestataire",
  ASSIGNED: "Attribuée",
  ACCEPTED: "Acceptée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  FAILED: "Échec",
};

export default function AdminBrainPage() {
  const [dashboard, setDashboard] = React.useState<BrainDashboard | null>(null);
  const [decisions, setDecisions] = React.useState<{ items: BrainDecision[]; live: boolean } | null>(null);
  const [city, setCity] = React.useState<BrainCityInsights | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [d, dec, c] = await Promise.all([brainDashboard(), brainDecisions(12), brainCityInsights()]);
      if (cancelled) return;
      setDashboard(d);
      setDecisions(dec);
      setCity(c);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const live = dashboard?.live ?? false;
  const totalMissions = dashboard?.missions ?? 0;
  const maxStatus = Math.max(1, ...(dashboard?.byStatus ?? []).map((s) => s.count));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">NOVIGO Brain</h1>
            <Badge tone={live ? "success" : "neutral"}>
              {live ? "Décisions réelles" : "Jeu de démonstration"}
            </Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Le cerveau de la plateforme : il observe, comprend, décide, fait exécuter et apprend.
            Toutes les applications — web, client, livreur, commerçant — exécutent ses décisions,
            aucune n’en produit (principes n°1 et n°2).
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Missions pilotées"
          value={formatCompact(totalMissions)}
          icon={<Activity className="h-5 w-5" />}
          hint="tous services confondus"
        />
        <KpiCard
          label="Décisions enregistrées"
          value={formatCompact(dashboard?.decisions ?? 0)}
          icon={<Zap className="h-5 w-5" />}
          hint="chacune explicable"
          tone="gold"
        />
        <KpiCard
          label="Connaissances apprises"
          value={formatCompact(dashboard?.knowledge.entries ?? 0)}
          icon={<BookOpen className="h-5 w-5" />}
          hint="Livre de Connaissances"
          tone="violet"
        />
        <KpiCard
          label="Observations cumulées"
          value={formatCompact(dashboard?.knowledge.observations ?? 0)}
          icon={<Gauge className="h-5 w-5" />}
          hint="missions analysées"
          tone="success"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Les huit moteurs</CardTitle>
            <CardDescription>
              Un métier nouveau se déclare par configuration : les moteurs, eux, ne changent pas
              (principes n°5 et n°6).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {BRAIN_ENGINES.map((engine, i) => {
              const Icon = ENGINE_ICONS[i] ?? BrainCircuit;
              const version = dashboard?.engines[i]?.version;
              return (
                <div key={engine.name} className="flex gap-3 rounded-xl border border-line bg-shell p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {engine.name}
                      {version ? <span className="text-[11px] font-medium text-muted">v{version}</span> : null}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{engine.role}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missions par statut</CardTitle>
            <CardDescription>Cycle de vie piloté par le Brain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard?.byStatus ?? []).map((s) => (
              <div key={s.status}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{STATUS_LABEL[s.status] ?? s.status}</span>
                  <span className="font-semibold text-ink tabular-nums">{s.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full brand-gradient"
                    style={{ width: `${Math.round((s.count / maxStatus) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {!dashboard?.byStatus.length ? (
              <p className="text-sm text-muted">Aucune mission enregistrée pour l’instant.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Décisions récentes</CardTitle>
            <CardDescription>
              Chaque décision porte son moteur, ses raisons et son temps de calcul (principe n°3).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(decisions?.items ?? []).map((d) => (
              <article key={d.id} className="rounded-xl border border-line bg-shell p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={KIND_TONE[d.kind]}>{KIND_LABEL[d.kind] ?? d.kind}</Badge>
                  <span className="text-sm font-semibold text-ink">{d.engine}</span>
                  {d.serviceKey ? <span className="text-xs text-muted">{d.serviceKey}</span> : null}
                  <span className="ml-auto text-xs text-muted tabular-nums">
                    {d.latencyMs != null ? `${d.latencyMs} ms` : "—"}
                    {d.confidence != null ? ` · confiance ${Math.round(d.confidence * 100)} %` : ""}
                  </span>
                </div>
                <ul className="mt-2.5 space-y-1">
                  {d.reasons.slice(0, 4).map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand" />
                      {r}
                    </li>
                  ))}
                </ul>
                {d.balance ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        ["Client", d.balance.client],
                        ["Prestataire", d.balance.provider],
                        ["Partenaire", d.balance.partner],
                        ["NOVIGO", d.balance.novigo],
                      ] as const
                    ).map(([label, value]) => (
                      <span
                        key={label}
                        className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-muted"
                      >
                        {label} <span className="font-semibold text-ink tabular-nums">{value}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {!decisions?.items.length ? (
              <p className="text-sm text-muted">Aucune décision journalisée pour l’instant.</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pouls de la ville</CardTitle>
              <CardDescription>
                {city ? `${city.pulse.zone} · ${city.hour} h` : "Chargement…"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {city ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {(
                      [
                        ["Demande", city.pulse.demandIndex],
                        ["Offre", city.pulse.supplyIndex],
                        ["Tension", city.pulse.tension],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-line bg-shell p-3">
                        <p className="text-[11px] font-medium text-muted">{label}</p>
                        <p className="mt-1 text-lg font-bold text-ink tabular-nums">{value.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted">
                    Heures de pointe : {city.pulse.peakHours.map((h) => `${h} h`).join(" · ")}
                  </p>
                  <ul className="space-y-1">
                    {city.pulse.reasons.map((r, i) => (
                      <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quartiers</CardTitle>
              <CardDescription>Activité observée et zones à renforcer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Les plus actifs</p>
                <ul className="mt-2 space-y-1.5">
                  {(city?.busiest ?? []).map((z) => (
                    <li key={z.zone} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{z.zone}</span>
                      <span className="text-muted tabular-nums">{formatCompact(z.missions)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Manque de prestataires
                </p>
                <ul className="mt-2 space-y-1.5">
                  {(city?.underServed ?? []).map((z) => (
                    <li key={z.zone} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{z.zone}</span>
                      <Badge tone="warning">+{z.overrunMinutes} min</Badge>
                    </li>
                  ))}
                  {!city?.underServed.length ? (
                    <li className="text-sm text-muted">Aucun retard structurel détecté.</li>
                  ) : null}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
