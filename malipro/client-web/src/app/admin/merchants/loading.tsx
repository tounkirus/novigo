import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <KpiRowSkeleton count={3} />

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 max-w-sm flex-1 rounded-xl" />
        <Skeleton className="h-11 w-48 rounded-xl" />
      </div>

      <TableSkeleton rows={12} cols={7} />

      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}
