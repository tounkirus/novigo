"use client";

import * as React from "react";
import type { CartLine, Product, Coupon } from "@/types";

interface CartState {
  storeId: string | null;
  storeName: string | null;
  lines: CartLine[];
  coupon: Coupon | null;
}

interface CartCtx extends CartState {
  count: number;
  subtotal: number;
  discount: number;
  add: (
    product: Product,
    store: { id: string; name: string },
    opts?: { quantity?: number; options?: CartLine["options"]; note?: string },
  ) => { replaced: boolean };
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  applyCoupon: (coupon: Coupon | null) => void;
  isForStore: (storeId: string) => boolean;
}

const Ctx = React.createContext<CartCtx | null>(null);
const KEY = "novigo.cart.v1";

const EMPTY: CartState = { storeId: null, storeName: null, lines: [], coupon: null };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CartState>(EMPTY);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const add: CartCtx["add"] = React.useCallback((product, store, opts) => {
    let replaced = false;
    setState((prev) => {
      const quantity = opts?.quantity ?? 1;
      const optionsPrice = (opts?.options ?? []).reduce((s, o) => s + o.price, 0);
      const line: CartLine = {
        productId: product.id,
        name: product.name,
        image: product.image,
        unitPrice: product.price + optionsPrice,
        quantity,
        options: opts?.options,
        note: opts?.note,
      };
      // Panier mono-commerce : changer de boutique réinitialise le panier.
      if (prev.storeId && prev.storeId !== store.id) {
        replaced = true;
        return { storeId: store.id, storeName: store.name, lines: [line], coupon: null };
      }
      const existing = prev.lines.find((l) => l.productId === product.id && !l.options?.length);
      const lines =
        existing && !opts?.options?.length
          ? prev.lines.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + quantity } : l))
          : [...prev.lines, line];
      return { ...prev, storeId: store.id, storeName: store.name, lines };
    });
    return { replaced };
  }, []);

  const setQuantity: CartCtx["setQuantity"] = React.useCallback((productId, quantity) => {
    setState((prev) => {
      const lines = prev.lines
        .map((l) => (l.productId === productId ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0);
      return lines.length ? { ...prev, lines } : EMPTY;
    });
  }, []);

  const remove: CartCtx["remove"] = React.useCallback((productId) => {
    setState((prev) => {
      const lines = prev.lines.filter((l) => l.productId !== productId);
      return lines.length ? { ...prev, lines } : EMPTY;
    });
  }, []);

  const clear = React.useCallback(() => setState(EMPTY), []);
  const applyCoupon = React.useCallback((coupon: Coupon | null) => setState((p) => ({ ...p, coupon })), []);

  const subtotal = state.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const discount = React.useMemo(() => {
    if (!state.coupon) return 0;
    if (state.coupon.type === "PERCENT") return Math.round((subtotal * state.coupon.value) / 100 / 50) * 50;
    if (state.coupon.type === "AMOUNT") return Math.min(subtotal, state.coupon.value);
    return 0;
  }, [state.coupon, subtotal]);

  const value: CartCtx = {
    ...state,
    count: state.lines.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    discount,
    add,
    setQuantity,
    remove,
    clear,
    applyCoupon,
    isForStore: (storeId) => state.storeId === storeId,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
