import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { RailSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="px-4 py-4">
      <Skeleton className="mb-4 h-4 w-40" />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Galerie */}
        <div className="space-y-2.5">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Résumé */}
        <div className="space-y-4">
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-32" />
          <SkeletonText lines={4} />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      <section className="mt-10 space-y-3">
        <Skeleton className="h-6 w-48" />
        <RailSkeleton card="product" count={6} />
      </section>
    </div>
  );
}
