"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { ChefHat } from "lucide-react";
import { api } from "@/mock/api";
import type { KitchenTicket } from "@/types/ops";
import { KitchenBoard } from "@/features/merchant/kitchen/kitchen-board";

export default function MerchantKitchenPage() {
  const query = useQuery<KitchenTicket[]>({
    queryKey: ["kitchenTickets"],
    queryFn: () => api.kitchenTickets(),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Écran cuisine</h2>
        <p className="text-sm text-muted">Suivez et faites avancer chaque commande en temps réel.</p>
      </div>

      <QueryState
        query={query}
        isEmpty={(d) => d.length === 0}
        skeleton={<BoardSkeleton />}
        emptyState={
          <EmptyState
            icon={<ChefHat className="h-8 w-8" />}
            title="Aucune commande en cuisine"
            description="Les nouvelles commandes apparaîtront ici automatiquement."
          />
        }
      >
        {(tickets) => <KitchenBoard initialTickets={tickets} />}
      </QueryState>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-40 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="space-y-3 rounded-2xl bg-shell p-2">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
