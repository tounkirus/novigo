"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/misc";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { api } from "@/mock/api";
import type { FeatureFlag } from "@/types/backoffice";

function FlagsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

function FlagsList({ flags }: { flags: FeatureFlag[] }) {
  const { toast } = useToast();
  const [state, setState] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(flags.map((f) => [f.id, f.enabled])),
  );

  const toggle = (f: FeatureFlag, next: boolean) => {
    setState((prev) => ({ ...prev, [f.id]: next }));
    toast({
      title: next ? `${f.label} activé` : `${f.label} désactivé`,
      description: next ? "La fonctionnalité est maintenant visible." : "La fonctionnalité a été coupée.",
      tone: next ? "success" : "info",
    });
  };

  return (
    <div className="space-y-3">
      {flags.map((f) => {
        const on = state[f.id];
        return (
          <Card key={f.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">{f.label}</p>
                <Badge tone={f.env === "PROD" ? "success" : "warning"}>{f.env}</Badge>
                <code className="rounded bg-shell px-1.5 py-0.5 font-mono text-[11px] text-muted">{f.key}</code>
              </div>
              <p className="mt-1 text-[13px] text-muted">{f.description}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <Progress value={f.rollout} className="max-w-[220px]" />
                <span className="shrink-0 text-[12px] font-medium text-muted">{f.rollout}% déployé</span>
              </div>
            </div>
            <Switch checked={on} onCheckedChange={(v) => toggle(f, v)} aria-label={`Activer ${f.label}`} />
          </Card>
        );
      })}
    </div>
  );
}

export function FeatureFlagsTab() {
  const q = useQuery({ queryKey: ["featureFlags"], queryFn: () => api.featureFlags() });
  return (
    <QueryState query={q} skeleton={<FlagsSkeleton />} isEmpty={(d) => d.length === 0}>
      {(flags) => <FlagsList flags={flags} />}
    </QueryState>
  );
}
