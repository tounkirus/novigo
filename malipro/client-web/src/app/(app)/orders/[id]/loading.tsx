import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-4">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
      </div>

      {/* Carte de suivi */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <Skeleton className="h-40 w-full rounded-none" />
      </div>

      {/* Livreur */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Timeline de progression */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <Skeleton className="mb-4 h-5 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
