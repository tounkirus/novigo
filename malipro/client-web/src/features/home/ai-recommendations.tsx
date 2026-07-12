"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { api, type RecommendationWithStore } from "@/mock/api";
import { StoreCard } from "@/components/shared/store-card";
import { HScroll } from "@/components/ui/carousel";
import { RailSkeleton } from "@/components/ui/skeletons";
import { QueryState } from "@/components/ui/async-state";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

/**
 * Rail de recommandations générées par « l'IA NOVIGO ».
 * Réutilisable partout sans props (consomme `api.recommendations` via TanStack Query).
 */
export function AiRecommendations() {
  const query = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.recommendations(),
  });

  return (
    <section className="space-y-3">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl brand-gradient text-white shadow-glow">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight text-ink">Recommandé par l&apos;IA NOVIGO</h2>
          <p className="text-[13px] text-muted">Une sélection personnalisée selon vos habitudes</p>
        </div>
      </header>

      <QueryState
        query={query}
        skeleton={<RailSkeleton count={4} card="store" />}
        isEmpty={(d) => d.length === 0}
        emptyState={
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title="Aucune recommandation"
            description="Passez une première commande pour recevoir des suggestions personnalisées."
          />
        }
      >
        {(items) => (
          <HScroll>
            {items.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.4 }}
                className="w-[280px]"
              >
                <RecoCard rec={rec} priority={i < 2} />
              </motion.div>
            ))}
          </HScroll>
        )}
      </QueryState>
    </section>
  );
}

function RecoCard({ rec, priority }: { rec: RecommendationWithStore; priority?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge tone="solid" className="min-w-0 flex-1">
          <span className="line-clamp-1">🤖 {rec.reason}</span>
        </Badge>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand"
          title="Score de pertinence"
        >
          {rec.score}% match
        </span>
      </div>
      <StoreCard store={rec.store} priority={priority} />
    </div>
  );
}
