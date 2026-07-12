"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingDown, Eye, MousePointerClick } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { QueryState } from "@/components/ui/async-state";
import { KpiRowSkeleton } from "@/components/ui/skeletons";
import { api } from "@/mock/api";
import { formatFcfa, formatCompact } from "@/lib/utils";

export function AdsKpis() {
  const q = useQuery({ queryKey: ["adCampaigns"], queryFn: () => api.adCampaigns() });

  return (
    <QueryState query={q} skeleton={<KpiRowSkeleton count={4} />}>
      {(campaigns) => {
        const budget = campaigns.reduce((s, c) => s + c.budget, 0);
        const spent = campaigns.reduce((s, c) => s + c.spent, 0);
        const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
        const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
        const ctr = impressions ? (clicks / impressions) * 100 : 0;
        const spentPct = budget ? Math.round((spent / budget) * 100) : 0;

        return (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Budget total"
              value={formatFcfa(budget)}
              hint={`${campaigns.length} campagnes`}
              icon={<Wallet className="h-5 w-5" />}
            />
            <KpiCard
              label="Dépensé"
              value={formatFcfa(spent)}
              delta={spentPct}
              hint="du budget engagé"
              icon={<TrendingDown className="h-5 w-5" />}
            />
            <KpiCard
              label="Impressions"
              value={formatCompact(impressions)}
              delta={12}
              hint="cumulées"
              icon={<Eye className="h-5 w-5" />}
            />
            <KpiCard
              label="CTR moyen"
              value={`${ctr.toFixed(2)}%`}
              delta={5}
              hint={`${formatCompact(clicks)} clics`}
              icon={<MousePointerClick className="h-5 w-5" />}
            />
          </div>
        );
      }}
    </QueryState>
  );
}
