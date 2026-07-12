import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-3.5 w-64" />
      </div>

      {[2, 4, 4].map((rows, s) => (
        <section key={s} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      ))}

      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
