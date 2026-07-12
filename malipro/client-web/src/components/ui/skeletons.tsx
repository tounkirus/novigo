import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

/** Squelettes de domaine réutilisables — cohérents avec les vraies cartes. */

export function StoreCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-surface", className)}>
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2.5 p-3.5">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-3 w-40" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-surface", className)}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export function RailSkeleton({ count = 4, card = "store" }: { count?: number; card?: "store" | "product" }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) =>
        card === "store" ? (
          <StoreCardSkeleton key={i} className="w-[280px] shrink-0" />
        ) : (
          <ProductCardSkeleton key={i} className="w-[170px] shrink-0" />
        ),
      )}
    </div>
  );
}

export function GridSkeleton({ count = 6, card = "store" }: { count?: number; card?: "store" | "product" }) {
  return (
    <div className={cn("grid gap-4", card === "store" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
      {Array.from({ length: count }).map((_, i) =>
        card === "store" ? <StoreCardSkeleton key={i} /> : <ProductCardSkeleton key={i} />,
      )}
    </div>
  );
}

export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-line bg-surface p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line p-4">
        <Skeleton className="h-4 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-1/4" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return <Skeleton className="w-full rounded-2xl" style={{ height }} />;
}
