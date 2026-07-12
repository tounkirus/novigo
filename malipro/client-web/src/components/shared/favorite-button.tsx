"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/features/favorites/use-favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  storeId,
  className,
  size = 18,
}: {
  storeId: string;
  className?: string;
  size?: number;
}) {
  const { has, toggle } = useFavorites();
  const active = has(storeId);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(storeId);
      }}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn(
        "focus-ring flex items-center justify-center rounded-full bg-white/90 p-2.5 text-ink shadow-card backdrop-blur transition active:scale-90 dark:bg-black/40 dark:text-white",
        className,
      )}
    >
      <Heart
        style={{ width: size, height: size }}
        className={cn("transition-colors", active ? "fill-brand text-brand" : "text-ink dark:text-white")}
      />
    </button>
  );
}
