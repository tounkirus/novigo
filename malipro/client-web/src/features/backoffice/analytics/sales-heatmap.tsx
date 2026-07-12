"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { hourlySeries } from "@/mock";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Carte de chaleur déterministe des ventes par jour × heure. */
export function SalesHeatmap() {
  const { grid, max } = React.useMemo(() => {
    // Chaque jour = série horaire déterministe (seed = index du jour + 1).
    const g = DAYS.map((_, d) => hourlySeries(d + 1).map((p) => p.value));
    const m = Math.max(...g.flat(), 1);
    return { grid: g, max: m };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intensité des ventes</CardTitle>
        <CardDescription>Volume de commandes par jour et par heure (heure locale de Bamako).</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto p-5 pt-0">
        <div className="min-w-[640px]">
          <div className="mb-1.5 flex pl-9">
            {HOURS.map((h) => (
              <span key={h} className="flex-1 text-center text-[9px] text-muted">
                {h % 3 === 0 ? `${h}h` : ""}
              </span>
            ))}
          </div>
          <div className="space-y-1">
            {grid.map((row, d) => (
              <div key={d} className="flex items-center">
                <span className="w-9 shrink-0 text-[11px] font-medium text-muted">{DAYS[d]}</span>
                <div className="flex flex-1 gap-1">
                  {row.map((v, h) => {
                    const intensity = v / max;
                    return (
                      <span
                        key={h}
                        title={`${DAYS[d]} ${h}h · ${v} commandes`}
                        className="h-5 flex-1 rounded-[3px]"
                        style={{
                          background:
                            intensity < 0.08
                              ? "rgb(var(--line))"
                              : `rgb(var(--brand) / ${(0.15 + intensity * 0.85).toFixed(3)})`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5">
            <span className="text-[11px] text-muted">Moins</span>
            {[0.12, 0.35, 0.6, 0.85, 1].map((o) => (
              <span
                key={o}
                className="h-3 w-3 rounded-[3px]"
                style={{ background: `rgb(var(--brand) / ${o})` }}
              />
            ))}
            <span className="text-[11px] text-muted">Plus</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
