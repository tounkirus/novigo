import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="ml-auto h-6 w-16 rounded-full" />
      </div>

      <KpiRowSkeleton count={4} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartSkeleton height={280} />
        </div>
        <ChartSkeleton height={280} />
      </div>

      <ChartSkeleton height={220} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TableSkeleton rows={6} cols={3} />
        <TableSkeleton rows={6} cols={3} />
      </div>
    </div>
  );
}
