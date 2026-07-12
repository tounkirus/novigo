"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCompact } from "@/lib/utils";

export interface FunnelStage {
  label: string;
  value: number;
  hint: string;
}

const BAR_COLORS = [
  "rgb(var(--brand))",
  "rgb(var(--brand) / 0.8)",
  "rgb(var(--brand) / 0.62)",
  "rgb(var(--gold-dark))",
];

/** Entonnoir de conversion : Visiteurs → Paniers → Commandes → Livrées. */
export function ConversionFunnel({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.value || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entonnoir de conversion</CardTitle>
        <CardDescription>Du visiteur à la commande livrée sur la période.</CardDescription>
      </CardHeader>
      <div className="space-y-3 p-5 pt-0">
        {stages.map((s, i) => {
          const pct = (s.value / top) * 100;
          const rate = i === 0 ? 100 : (s.value / stages[i - 1].value) * 100;
          return (
            <div key={s.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-ink">{s.label}</span>
                <span className="text-[13px] font-bold text-ink">{formatCompact(s.value)}</span>
              </div>
              <div className="relative h-9 overflow-hidden rounded-xl bg-shell">
                <div
                  className="flex h-full items-center rounded-xl px-3 text-[11px] font-semibold text-white transition-all duration-500"
                  style={{ width: `${Math.max(pct, 12)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                >
                  {i > 0 && <span>{rate.toFixed(0)}%</span>}
                </div>
              </div>
              <p className="mt-1 text-[11px] text-muted">{s.hint}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
