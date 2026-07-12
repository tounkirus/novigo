import { Skeleton } from "@/components/ui/skeleton";
import { RailSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      <section className="space-y-3">
        <Skeleton className="h-5 w-52" />
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-5 w-56" />
        <RailSkeleton card="store" count={4} />
      </section>
    </div>
  );
}
