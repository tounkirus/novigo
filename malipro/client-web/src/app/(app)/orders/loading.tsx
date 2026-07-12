import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      <Skeleton className="h-8 w-52" />

      {/* Commande en cours */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-line bg-brand-soft/40 px-5 py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-10 w-16" />
          </div>
          <Skeleton className="mt-4 h-2 w-full rounded-full" />
          <Skeleton className="mt-4 h-11 w-full rounded-xl" />
        </div>
      </div>

      {/* Historique */}
      <div className="divide-y divide-line rounded-2xl border border-line bg-surface px-4 shadow-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
