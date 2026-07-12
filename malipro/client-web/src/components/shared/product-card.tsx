"use client";

import * as React from "react";
import { MediaImage } from "@/components/ui/media-image";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Product, Store } from "@/types";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { ProductSheet } from "./product-sheet";
import { useCart } from "@/features/cart/cart-store";
import { useToast } from "@/components/ui/toast";
import { discountPercent, cn } from "@/lib/utils";

function useAdd(product: Product, store: Store) {
  const { add } = useCart();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const handle = () => {
    if (product.options?.length) {
      setOpen(true);
    } else {
      add(product, store);
      toast({ title: "Ajouté au panier", description: product.name, tone: "success" });
    }
  };
  return { open, setOpen, handle };
}

/** Carte produit verticale (rails « populaires », « offres »…). */
export function ProductCard({ product, store, className }: { product: Product; store: Store; className?: string }) {
  const { open, setOpen, handle } = useAdd(product, store);
  const pct = product.oldPrice ? discountPercent(product.oldPrice, product.price) : 0;
  return (
    <>
      <motion.div
        whileHover={{ y: -3 }}
        className={cn("group w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-card", className)}
      >
        <button onClick={handle} className="block w-full text-left">
          <div className="relative aspect-square overflow-hidden bg-shell">
            <MediaImage src={product.image} alt={product.name} fill sizes="180px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            {pct > 0 && <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">-{pct}%</span>}
            {product.isBestSeller && <span className="absolute right-2 top-2"><Badge tone="gold">Top vente</Badge></span>}
            <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-glow transition group-hover:scale-110">
              <Plus className="h-5 w-5" />
            </span>
          </div>
          <div className="p-3">
            <p className="line-clamp-1 text-sm font-semibold text-ink">{product.name}</p>
            <p className="line-clamp-1 text-[12px] text-muted">{store.name}</p>
            <Price value={product.price} oldValue={product.oldPrice} className="mt-1.5" />
          </div>
        </button>
      </motion.div>
      {product.options?.length ? <ProductSheet product={product} store={store} open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}

/** Ligne produit horizontale (menu d'un commerce). */
export function ProductRow({ product, store }: { product: Product; store: Store }) {
  const { open, setOpen, handle } = useAdd(product, store);
  const pct = product.oldPrice ? discountPercent(product.oldPrice, product.price) : 0;
  return (
    <>
      <div className="flex gap-3 py-3">
        <button onClick={handle} disabled={!product.available} className="flex flex-1 gap-3 text-left disabled:opacity-50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="line-clamp-1 font-semibold text-ink">{product.name}</p>
              {product.isNew && <Badge tone="info">Nouveau</Badge>}
            </div>
            <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{product.description}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Price value={product.price} oldValue={product.oldPrice} size="sm" />
              {pct > 0 && <Badge tone="brand">-{pct}%</Badge>}
              {!product.available && <Badge tone="neutral">Épuisé</Badge>}
            </div>
          </div>
        </button>
        <div className="relative">
          <button onClick={handle} disabled={!product.available} className="block disabled:opacity-50">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-shell">
              <MediaImage src={product.image} alt={product.name} fill sizes="96px" className="object-cover" />
            </div>
            <span className="absolute -bottom-2 right-1/2 flex h-8 w-8 translate-x-1/2 items-center justify-center rounded-full border-2 border-surface bg-brand text-white shadow-card transition active:scale-90">
              <Plus className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
      {product.options?.length ? <ProductSheet product={product} store={store} open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
