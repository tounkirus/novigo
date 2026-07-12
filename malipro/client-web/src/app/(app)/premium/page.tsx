"use client";

import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { api } from "@/mock/api";
import { QueryState } from "@/components/ui/async-state";
import { PremiumView, PremiumSkeleton } from "@/features/premium/components";

export default function PremiumPage() {
  const query = useQuery({ queryKey: ["premiumPlans"], queryFn: () => api.premiumPlans() });

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-soft text-gold-dark">
          <Crown className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Abonnement Premium</h1>
          <p className="text-[13px] text-muted">Plus d&apos;avantages, plus d&apos;économies sur chaque commande</p>
        </div>
      </div>

      <QueryState query={query} skeleton={<PremiumSkeleton />} isEmpty={(d) => d.length === 0}>
        {(plans) => <PremiumView plans={plans} />}
      </QueryState>
    </div>
  );
}
