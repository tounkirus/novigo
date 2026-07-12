import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-40 rounded-2xl" />
      </div>

      <KpiRowSkeleton count={4} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartSkeleton height={300} />
        </div>
        <ChartSkeleton height={300} />
      </div>

      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
