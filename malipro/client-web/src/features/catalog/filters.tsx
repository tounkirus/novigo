"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Truck, Clock } from "lucide-react";
import type { Category, StoreCategory } from "@/types";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "popular", label: "Populaires" },
  { value: "rating", label: "Mieux notés" },
  { value: "delivery", label: "Livraison rapide" },
  { value: "distance", label: "Plus proches" },
];

export function CatalogFilters({
  categories,
  category,
  sort,
  freeDelivery,
  openNow,
}: {
  categories: Category[];
  category?: StoreCategory;
  sort: string;
  freeDelivery: boolean;
  openNow: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const setParam = React.useCallback(
    (key: string, value?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className={pending ? "opacity-70 transition-opacity" : "transition-opacity"}>
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
        <Chip active={!category} onClick={() => setParam("category")}>
          Tous
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            active={category === c.id}
            count={c.count}
            onClick={() => setParam("category", c.id)}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-muted">Trier par</span>
          <Select
            value={sort}
            onValueChange={(v) => setParam("sort", v === "popular" ? undefined : v)}
          >
            <SelectTrigger className="h-10 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex cursor-pointer items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <Truck className="h-4 w-4 text-success" />
              Livraison gratuite
            </span>
            <Switch
              checked={freeDelivery}
              onCheckedChange={(v) => setParam("freeDelivery", v ? "1" : undefined)}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <Clock className="h-4 w-4 text-brand" />
              Ouvert maintenant
            </span>
            <Switch
              checked={openNow}
              onCheckedChange={(v) => setParam("openNow", v ? "1" : undefined)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
