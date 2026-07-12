"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/mock/api";
import { cn, formatFcfa, formatCompact } from "@/lib/utils";

function SegmentsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-2xl" />
      ))}
    </div>
  );
}

export function CrmSegments() {
  const q = useQuery({ queryKey: ["crmSegments"], queryFn: () => api.crmSegments() });

  return (
    <QueryState query={q} skeleton={<SegmentsSkeleton />}>
      {(segments) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((seg) => {
            const up = seg.trend >= 0;
            return (
              <div
                key={seg.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-card",
                  seg.color,
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-white/80">{seg.label}</p>
                    <p className="mt-2 text-3xl font-black tabular-nums">{formatCompact(seg.count)}</p>
                    <p className="text-[13px] text-white/80">clients</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Users className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3">
                  <div>
                    <p className="text-[12px] text-white/70">Revenu</p>
                    <p className="text-sm font-bold">{formatFcfa(seg.revenue)}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-1 text-[12px] font-semibold",
                    )}
                  >
                    {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {Math.abs(seg.trend)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </QueryState>
  );
}
