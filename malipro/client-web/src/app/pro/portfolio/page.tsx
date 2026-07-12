"use client";

import { useQuery } from "@tanstack/react-query";
import { MediaImage } from "@/components/ui/media-image";
import { Plus, ImagePlus } from "lucide-react";
import { api } from "@/mock/api";
import { QueryState } from "@/components/ui/async-state";
import { GridSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function ProPortfolioPage() {
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["me-provider"], queryFn: () => api.meProvider() });

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="text-xl font-bold tracking-tight text-ink">Portfolio</h2>
          <p className="text-sm text-muted">Mettez en valeur vos réalisations pour rassurer vos clients.</p>
        </div>
        <Button size="sm" onClick={() => toast({ title: "Ajouter une photo", description: "Sélectionnez une image depuis votre appareil.", tone: "info" })}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      <QueryState query={query} skeleton={<GridSkeleton count={6} card="product" />} isEmpty={(d) => d == null}>
        {(me) => (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {me!.portfolio.map((item) => (
              <figure key={item.id} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                <div className="relative aspect-[4/3] w-full bg-shell">
                  <MediaImage src={item.image} alt={item.title} fill sizes="(max-width:640px) 50vw, 240px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <figcaption className="truncate px-3 py-2 text-[12px] font-medium text-muted">{item.title}</figcaption>
              </figure>
            ))}
            <button
              onClick={() => toast({ title: "Ajouter une photo", description: "Sélectionnez une image depuis votre appareil.", tone: "info" })}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-muted transition hover:border-brand hover:text-brand"
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-[13px] font-medium">Ajouter une réalisation</span>
            </button>
          </div>
        )}
      </QueryState>
    </div>
  );
}
