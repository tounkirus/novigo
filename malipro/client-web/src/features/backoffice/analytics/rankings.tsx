"use client";

import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { Progress } from "@/components/ui/misc";
import { STORE_CATEGORY_LABEL } from "@/constants";
import { formatCompact, formatFcfa } from "@/lib/utils";
import type { Store } from "@/types";

/** Classement des meilleurs commerces (note + volume). */
export function TopStoresRanking({ stores }: { stores: Store[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top commerces</CardTitle>
        <CardDescription>Classement par note et volume de commandes.</CardDescription>
      </CardHeader>
      <div className="divide-y divide-line border-t border-line">
        {stores.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 px-5 py-3">
            <span
              className={
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-black " +
                (i === 0
                  ? "bg-gold-soft text-gold-dark"
                  : i < 3
                    ? "bg-brand-soft text-brand"
                    : "bg-shell text-muted")
              }
            >
              {i + 1}
            </span>
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-shell">
              <Image src={s.logo} alt={s.name} fill sizes="40px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
              <p className="truncate text-[12px] text-muted">
                {STORE_CATEGORY_LABEL[s.category]} · {s.district}
              </p>
            </div>
            <Rating value={s.rating} />
            <span className="hidden w-20 shrink-0 text-right text-sm font-bold text-ink sm:block">
              {formatCompact(s.orderCount)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export interface DistrictRevenue {
  name: string;
  revenue: number;
  orders: number;
}

/** Classement des quartiers de Bamako par revenus (barres Progress). */
export function TopDistrictsRanking({ districts }: { districts: DistrictRevenue[] }) {
  const max = Math.max(...districts.map((d) => d.revenue), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top quartiers</CardTitle>
        <CardDescription>Revenus générés par zone de livraison à Bamako.</CardDescription>
      </CardHeader>
      <div className="space-y-3.5 p-5 pt-0">
        {districts.map((d) => (
          <div key={d.name}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
              <span className="truncate font-medium text-ink">{d.name}</span>
              <span className="shrink-0 font-semibold text-muted">{formatFcfa(d.revenue)}</span>
            </div>
            <Progress value={(d.revenue / max) * 100} />
          </div>
        ))}
      </div>
    </Card>
  );
}
