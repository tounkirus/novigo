"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/features/cart/cart-store";
import { useUI } from "@/components/layout/app-shell";
import { formatFcfa } from "@/lib/utils";

/** Barre d'action flottante : visible seulement si le panier concerne CE commerce. */
export function FloatingCartBar({ storeId }: { storeId: string }) {
  const cart = useCart();
  const { openCart } = useUI();
  const visible = cart.isForStore(storeId) && cart.count > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="pointer-events-none fixed inset-x-0 bottom-20 z-40 px-4 md:bottom-6"
        >
          <div className="pointer-events-auto mx-auto max-w-6xl">
            <button
              onClick={openCart}
              className="brand-gradient flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-white shadow-glow transition hover:brightness-105 active:scale-[0.99]"
            >
              <span className="flex items-center gap-3">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-black text-brand">
                    {cart.count}
                  </span>
                </span>
                <span className="text-[15px] font-bold">Voir le panier</span>
              </span>
              <span className="flex items-center gap-2 text-[15px] font-bold">
                {formatFcfa(cart.subtotal)}
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
