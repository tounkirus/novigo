import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeletons";

/** Squelette générique d'une section back-office (en-tête + KPIs + graphes + table). */
export function SectionLoading({ withCharts = true }: { withCharts?: boolean }) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <KpiRowSkeleton count={4} />
      {withCharts && (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartSkeleton height={260} />
          <ChartSkeleton height={260} />
          <ChartSkeleton height={260} />
        </div>
      )}
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
