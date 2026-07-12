import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 px-4 py-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-[280px] shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
