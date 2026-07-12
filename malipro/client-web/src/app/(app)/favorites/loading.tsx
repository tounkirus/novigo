import { Skeleton } from "@/components/ui/skeleton";
import { GridSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-3.5 w-48" />
      </div>

      <GridSkeleton card="store" count={6} />
    </div>
  );
}
