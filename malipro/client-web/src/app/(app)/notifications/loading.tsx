import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>

      {/* Onglets */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
        ))}
      </div>

      {/* Liste */}
      <div className="divide-y divide-line rounded-2xl border border-line bg-surface px-4 shadow-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
