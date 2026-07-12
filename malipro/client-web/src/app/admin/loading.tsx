import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>

      <KpiRowSkeleton count={5} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartSkeleton height={300} />
        </div>
        <ChartSkeleton height={300} />
      </div>

      <ChartSkeleton height={240} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TableSkeleton rows={8} cols={5} />
        </div>
        <ChartSkeleton height={340} />
      </div>
    </div>
  );
}
