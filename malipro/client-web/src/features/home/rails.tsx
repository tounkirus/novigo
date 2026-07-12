"use client";

import { motion } from "framer-motion";
import type { Store, Product } from "@/types";
import { HScroll } from "@/components/ui/carousel";
import { StoreCard } from "@/components/shared/store-card";
import { ProductCard } from "@/components/shared/product-card";

const item = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.05, 0.4), duration: 0.4 } }),
};

export function StoreRail({ stores }: { stores: Store[] }) {
  return (
    <HScroll>
      {stores.map((s, i) => (
        <motion.div key={s.id} variants={item} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
          <StoreCard store={s} className="w-[280px]" priority={i < 2} />
        </motion.div>
      ))}
    </HScroll>
  );
}

export function ProductRail({ products, stores }: { products: Product[]; stores: Record<string, Store> }) {
  return (
    <HScroll>
      {products.map((p, i) => {
        const store = stores[p.storeId];
        if (!store) return null;
        return (
          <motion.div key={p.id} variants={item} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
            <ProductCard product={p} store={store} className="w-[170px]" />
          </motion.div>
        );
      })}
    </HScroll>
  );
}

export function StoreGrid({ stores }: { stores: Store[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((s, i) => (
        <motion.div key={s.id} variants={item} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
          <StoreCard store={s} />
        </motion.div>
      ))}
    </div>
  );
}
