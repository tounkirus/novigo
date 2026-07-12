import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-3.5 w-52" />
      </div>

      {/* Bandeau promo */}
      <Skeleton className="h-24 w-full rounded-2xl" />

      {/* Coupons disponibles */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
