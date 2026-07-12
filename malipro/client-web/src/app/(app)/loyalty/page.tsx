"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { api } from "@/mock/api";
import { LOYALTY_TIERS } from "@/mock/modules";
import { QueryState } from "@/components/ui/async-state";
import { LoyaltyView, LoyaltySkeleton } from "@/features/loyalty/components";

export default function LoyaltyPage() {
  const query = useQuery({ queryKey: ["loyalty"], queryFn: () => api.loyalty() });

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Fidélité NOVIGO</h1>
          <p className="text-[13px] text-muted">Gagnez des points, débloquez des paliers et échangez vos récompenses</p>
        </div>
      </div>

      <QueryState query={query} skeleton={<LoyaltySkeleton />}>
        {(state) => <LoyaltyView state={state} tiers={LOYALTY_TIERS} />}
      </QueryState>
    </div>
  );
}
