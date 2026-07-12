"use client";

import * as React from "react";
import { Boxes, CheckCircle2, Tag, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Reveal } from "@/components/ui/reveal";
import { stores, productsOf, menuOf } from "@/mock";
import type { Product, MenuSection, StorePromotion, ProductOptionGroup } from "@/types";
import { ProductsTab } from "@/features/merchant/catalog/products-tab";
import { CategoriesTab } from "@/features/merchant/catalog/categories-tab";
import { PromotionsTab } from "@/features/merchant/catalog/promotions-tab";
import { OptionsTab } from "@/features/merchant/catalog/options-tab";
import { isLowStock } from "@/features/merchant/catalog/types";

export default function MerchantCatalogPage() {
  const store = React.useMemo(() => stores()[0], []);

  const [products, setProducts] = React.useState<Product[]>(() => productsOf(store));
  const [menus, setMenus] = React.useState<MenuSection[]>(() => menuOf(store));
  const [promotions, setPromotions] = React.useState<StorePromotion[]>(() => store.promotions);

  const exampleOptions = React.useMemo<ProductOptionGroup[]>(
    () => productsOf(store).find((p) => p.options?.length)?.options ?? [],
    [store],
  );

  const kpis = React.useMemo(
    () => ({
      total: products.length,
      available: products.filter((p) => p.available).length,
      promo: products.filter((p) => p.oldPrice != null && p.oldPrice > p.price).length,
      low: products.filter(isLowStock).length,
    }),
    [products],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Catalogue</h2>
        <p className="text-sm text-muted">{store.name} — gérez vos produits, menus, promotions et options en autonomie.</p>
      </div>

      <Reveal>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Produits" value={String(kpis.total)} icon={<Boxes className="h-5 w-5" />} hint="au catalogue" />
          <KpiCard label="Disponibles" value={String(kpis.available)} icon={<CheckCircle2 className="h-5 w-5" />} hint="visibles en boutique" />
          <KpiCard label="En promo" value={String(kpis.promo)} icon={<Tag className="h-5 w-5" />} hint="prix réduits" />
          <KpiCard label="Stock faible" value={String(kpis.low)} icon={<AlertTriangle className="h-5 w-5" />} hint="à réapprovisionner" />
        </div>
      </Reveal>

      <Tabs defaultValue="products">
        <TabsList className="flex-wrap">
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="categories">Catégories &amp; Menus</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsTab products={products} setProducts={setProducts} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab menus={menus} setMenus={setMenus} />
        </TabsContent>
        <TabsContent value="promotions">
          <PromotionsTab promotions={promotions} setPromotions={setPromotions} />
        </TabsContent>
        <TabsContent value="options">
          <OptionsTab initialGroups={exampleOptions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
