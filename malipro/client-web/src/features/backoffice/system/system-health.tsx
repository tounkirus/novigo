"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, Activity, Gauge, ServerCog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/ui/kpi-card";
import { QueryState } from "@/components/ui/async-state";
import { KpiRowSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/mock/api";
import { cn } from "@/lib/utils";
import type { SystemService } from "@/types/backoffice";

const STATUS_META: Record<SystemService["status"], { label: string; tone: "success" | "warning" | "error"; dot: string }> = {
  OPERATIONAL: { label: "Opérationnel", tone: "success", dot: "bg-success" },
  DEGRADED: { label: "Dégradé", tone: "warning", dot: "bg-warning" },
  DOWN: { label: "Hors service", tone: "error", dot: "bg-error" },
};

function HealthSkeleton() {
  return (
    <div className="space-y-6">
      <KpiRowSkeleton count={4} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function SystemHealthTab() {
  const q = useQuery({ queryKey: ["systemServices"], queryFn: () => api.systemServices() });

  return (
    <QueryState query={q} skeleton={<HealthSkeleton />} isEmpty={(d) => d.length === 0}>
      {(services) => {
        const degraded = services.filter((s) => s.status !== "OPERATIONAL");
        const avgUptime = services.reduce((a, s) => a + s.uptime, 0) / services.length;
        const avgLatency = Math.round(services.reduce((a, s) => a + s.latencyMs, 0) / services.length);
        const okCount = services.filter((s) => s.status === "OPERATIONAL").length;
        const allOk = degraded.length === 0;

        return (
          <div className="space-y-6">
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4",
                allOk ? "border-success/30 bg-success-soft" : "border-warning/30 bg-warning-soft",
              )}
            >
              {allOk ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              )}
              <div>
                <p className="text-sm font-semibold text-ink">
                  {allOk ? "Tous les systèmes sont opérationnels" : `${degraded.length} service(s) nécessitent votre attention`}
                </p>
                <p className="text-[13px] text-muted">
                  {allOk
                    ? "Aucun incident en cours sur la plateforme."
                    : degraded.map((d) => d.name).join(", ")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <KpiCard label="Uptime moyen" value={`${avgUptime.toFixed(2)}%`} hint="30 derniers jours" icon={<Activity className="h-5 w-5" />} />
              <KpiCard label="Latence moyenne" value={`${avgLatency} ms`} hint="temps de réponse" icon={<Gauge className="h-5 w-5" />} />
              <KpiCard label="Services OK" value={`${okCount}/${services.length}`} hint="opérationnels" icon={<ServerCog className="h-5 w-5" />} />
              <KpiCard label="Incidents" value={String(degraded.length)} hint="en cours" icon={<AlertTriangle className="h-5 w-5" />} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => {
                const meta = STATUS_META[s.status];
                return (
                  <Card key={s.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} />
                        <p className="text-sm font-semibold text-ink">{s.name}</p>
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[13px]">
                      <div>
                        <p className="text-muted">Uptime</p>
                        <p className="font-bold text-ink">{s.uptime.toFixed(2)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted">Latence</p>
                        <p className="font-bold text-ink">{s.latencyMs} ms</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}
