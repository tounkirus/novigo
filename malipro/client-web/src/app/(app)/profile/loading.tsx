import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-6 shadow-card">
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>

      {/* Portefeuille & fidélité */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>

      {/* Statistiques */}
      <KpiRowSkeleton count={2} />

      {/* Raccourcis */}
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
