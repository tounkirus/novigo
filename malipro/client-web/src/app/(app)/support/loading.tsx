import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-3.5 w-72" />
      </div>

      {/* Recherche */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Catégories */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <Skeleton className="h-64 w-full rounded-2xl" />

      {/* Nous contacter */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
