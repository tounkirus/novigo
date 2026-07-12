import type { Metadata } from "next";
import { Compass, Store as StoreIcon } from "lucide-react";
import type { StoreCategory, Vertical } from "@/types";
import { queryStores, categories } from "@/mock";
import { VERTICALS } from "@/constants";
import { NoResults } from "@/components/ui/states";
import { CatalogFilters } from "@/features/catalog/filters";
import { CatalogResults } from "@/features/catalog/results";

export const metadata: Metadata = {
  title: "Explorer les commerces — NOVIGO",
  description: "Restaurants, supermarchés, pharmacies et boutiques livrés à Bamako.",
};

const SORTS = ["popular", "rating", "delivery", "distance"] as const;
type Sort = (typeof SORTS)[number];

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function RestaurantsPage({ searchParams }: { searchParams: SearchParams }) {
  const cats = categories();

  const rawCategory = first(searchParams.category);
  const rawVertical = first(searchParams.vertical);
  const rawSort = first(searchParams.sort);
  const q = first(searchParams.q)?.trim() || undefined;
  const freeDelivery = first(searchParams.freeDelivery) === "1";
  const openNow = first(searchParams.openNow) === "1";

  const category = cats.some((c) => c.id === rawCategory)
    ? (rawCategory as StoreCategory)
    : undefined;
  const vertical = VERTICALS.some((v) => v.key === rawVertical)
    ? (rawVertical as Vertical)
    : undefined;
  const sort: Sort = (SORTS as readonly string[]).includes(rawSort ?? "")
    ? (rawSort as Sort)
    : "popular";

  const { items, total } = queryStores({
    category,
    vertical,
    q,
    sort,
    freeDelivery,
    openNow,
    pageSize: 72,
  });

  const activeCat = category ? cats.find((c) => c.id === category) : undefined;
  const activeVert = vertical ? VERTICALS.find((v) => v.key === vertical) : undefined;

  let title = "Explorer les commerces";
  if (q) title = `Résultats pour « ${q} »`;
  else if (activeCat) title = `${activeCat.label} à Bamako`;
  else if (activeVert) title = `${activeVert.label} à Bamako`;

  const resetKey = [category ?? "", vertical ?? "", q ?? "", sort, freeDelivery, openNow].join("|");

  return (
    <div className="px-4 py-4 space-y-6">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[12px] font-semibold text-brand">
          <Compass className="h-3.5 w-3.5" />
          Exploration
        </span>
        <h1 className="text-2xl font-black tracking-tight text-ink">{title}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <StoreIcon className="h-4 w-4" />
          <span className="font-semibold text-ink">{total.toLocaleString("fr-FR")}</span>
          {total > 1 ? " commerces disponibles" : " commerce disponible"}
        </p>
      </header>

      <CatalogFilters
        categories={cats}
        category={category}
        sort={sort}
        freeDelivery={freeDelivery}
        openNow={openNow}
      />

      {items.length === 0 ? (
        <NoResults query={q} />
      ) : (
        <CatalogResults key={resetKey} stores={items} />
      )}
    </div>
  );
}
