import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="px-4 py-4 pb-28 lg:pb-8">
      <div className="mb-4 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Étapes */}
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Récapitulatif (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-5 h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
