import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>

      <KpiRowSkeleton count={4} />

      <ChartSkeleton height={280} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton height={260} />
        <ChartSkeleton height={260} />
      </div>

      <TableSkeleton rows={8} cols={4} />
    </div>
  );
}
