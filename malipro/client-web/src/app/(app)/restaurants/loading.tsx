import { Skeleton } from "@/components/ui/skeleton";
import { GridSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </header>

      <div className="flex gap-2.5 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <GridSkeleton card="store" count={9} />
    </div>
  );
}
