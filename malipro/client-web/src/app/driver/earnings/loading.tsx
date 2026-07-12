import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <KpiRowSkeleton count={4} />

      <ChartSkeleton height={280} />

      <div className="space-y-3">
        <Skeleton className="h-5 w-56" />
        <TableSkeleton rows={9} cols={6} />
      </div>
    </div>
  );
}
