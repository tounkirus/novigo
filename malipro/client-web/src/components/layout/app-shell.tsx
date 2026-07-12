"use client";

import * as React from "react";
import { CartDrawer } from "./cart-drawer";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";

interface UICtx {
  openCart: () => void;
}
const Ctx = React.createContext<UICtx | null>(null);

export function useUI() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useUI hors AppShell");
  return ctx;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = React.useState(false);
  const value = React.useMemo(() => ({ openCart: () => setCartOpen(true) }), []);

  return (
    <Ctx.Provider value={value}>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-shell">
        <AppHeader />
        <main className="flex-1 pb-24 md:pb-8">{children}</main>
        <BottomNav />
        <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      </div>
    </Ctx.Provider>
  );
}
