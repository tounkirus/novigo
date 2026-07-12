"use client";

import type { ReactNode } from "react";
import { PackageOpen, SearchX, WifiOff, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        {icon ?? <PackageOpen className="h-8 w-8" />}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function NoResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<SearchX className="h-8 w-8" />}
      title="Aucun résultat"
      description={query ? `Rien trouvé pour « ${query} ». Essayez un autre mot-clé.` : "Essayez d'élargir votre recherche."}
    />
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-8 w-8 text-error" />}
      title="Une erreur est survenue"
      description="Impossible de charger le contenu pour le moment."
      action={onRetry && <Button variant="secondary" onClick={onRetry}>Réessayer</Button>}
    />
  );
}

export function OfflineState() {
  return (
    <EmptyState
      icon={<WifiOff className="h-8 w-8" />}
      title="Hors connexion"
      description="Vérifiez votre connexion internet puis réessayez."
    />
  );
}
