import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      {/* Bannière */}
      <Skeleton className="h-56 w-full rounded-none sm:h-72" />

      {/* Barre d'actions */}
      <div className="border-b border-line bg-surface px-4 py-2.5">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <div className="px-4">
        {/* Barre d'infos */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>

        {/* Menu */}
        <div className="mt-6 divide-y divide-line">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
