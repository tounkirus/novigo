"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, X, TrendingUp } from "lucide-react";
import type { Store } from "@/types";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Icon } from "@/components/shared/icon";
import { StoreCard, StoreCardCompact } from "@/components/shared/store-card";
import { ProductCard } from "@/components/shared/product-card";
import { SectionHeader } from "@/components/shared/section";
import { NoResults } from "@/components/ui/states";
import { HScroll } from "@/components/ui/carousel";
import { search, popularStores, categories, storeById } from "@/mock";

const TRENDING = ["Tiéboudienne", "Pizza", "Pharmacie", "Riz", "Poulet Yassa", "Attiéké", "Burger", "Paracétamol"];

export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(id);
  }, [query]);

  const cats = React.useMemo(() => categories(), []);
  const popular = React.useMemo(() => popularStores(8), []);
  const results = React.useMemo(() => search(debounced), [debounced]);

  const products = React.useMemo(
    () =>
      results.products
        .map((p) => ({ product: p, store: storeById(p.storeId) }))
        .filter((x): x is { product: (typeof results.products)[number]; store: Store } => Boolean(x.store)),
    [results.products],
  );

  const hasQuery = debounced.length > 0;
  const isEmpty = results.stores.length === 0 && products.length === 0;

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="sticky top-0 z-10 -mx-4 bg-shell/85 px-4 pb-2 pt-1 backdrop-blur">
        <h1 className="mb-3 text-2xl font-black tracking-tight text-ink">Rechercher</h1>
        <Input
          icon={<Search className="h-5 w-5 text-brand" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Un plat, un commerce, un produit…"
          autoFocus
          className="h-12"
          suffix={
            query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-shell text-muted transition hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            ) : undefined
          }
        />
      </div>

      {hasQuery ? (
        isEmpty ? (
          <NoResults query={debounced} />
        ) : (
          <Tabs defaultValue="stores">
            <TabsList>
              <TabsTrigger value="stores">Commerces · {results.stores.length}</TabsTrigger>
              <TabsTrigger value="products">Produits · {products.length}</TabsTrigger>
            </TabsList>

            <TabsContent value="stores">
              {results.stores.length === 0 ? (
                <NoResults query={debounced} />
              ) : (
                <div className="divide-y divide-line rounded-2xl border border-line bg-surface p-1.5 shadow-card">
                  {results.stores.map((s) => (
                    <StoreCardCompact key={s.id} store={s} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="products">
              {products.length === 0 ? (
                <NoResults query={debounced} />
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {products.map(({ product, store }) => (
                    <ProductCard key={product.id} product={product} store={store} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <SectionHeader title="Recherches populaires" subtitle="Ce que Bamako commande en ce moment" />
            <div className="flex flex-wrap gap-2.5">
              {TRENDING.map((t) => (
                <Chip
                  key={t}
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                  onClick={() => setQuery(t)}
                >
                  {t}
                </Chip>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader title="Catégories" subtitle="Explorez par type de commerce" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cats.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                >
                  <Link
                    href={`/restaurants?category=${c.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition hover:border-brand/40 hover:shadow-lifted"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
                      <Icon name={c.icon} className="h-5 w-5 text-brand" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{c.label}</p>
                      <p className="text-[12px] text-muted">{c.count} commerces</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Restaurants populaires"
              subtitle="Les plus commandés"
              href="/restaurants?sort=popular"
            />
            <HScroll>
              {popular.map((s, i) => (
                <StoreCard key={s.id} store={s} className="w-[280px]" priority={i < 2} />
              ))}
            </HScroll>
          </section>
        </div>
      )}
    </div>
  );
}
