"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Store } from "@/types";
import { StoreCard } from "@/components/shared/store-card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/features/favorites/use-favorites";
import { favoriteStores, storeById } from "@/mock";

export default function FavoritesPage() {
  const { ids } = useFavorites();

  // Union des favoris pré-remplis (profil) et des favoris locaux (localStorage).
  const preset = favoriteStores();
  const unionIds = Array.from(new Set([...preset.map((s) => s.id), ...ids]));
  const stores = unionIds.map((id) => storeById(id)).filter(Boolean) as Store[];

  return (
    <div className="px-4 py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Favoris</h1>
        <p className="text-[13px] text-muted">
          {stores.length} commerce{stores.length > 1 ? "s" : ""} enregistré{stores.length > 1 ? "s" : ""}
        </p>
      </div>

      {stores.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8" />}
          title="Aucun favori pour l'instant"
          description="Ajoutez des commerces à vos favoris pour les retrouver ici."
          action={
            <Button asChild>
              <Link href="/restaurants">Découvrir les commerces</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>
      )}
    </div>
  );
}
