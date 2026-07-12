"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ClipboardList, User, ShoppingBag } from "lucide-react";
import { useCart } from "@/features/cart/cart-store";
import { useUI } from "./app-shell";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/services", label: "Services", icon: LayoutGrid },
  { href: "/orders", label: "Commandes", icon: ClipboardList },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const cart = useCart();
  const { openCart } = useUI();

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-5 items-center px-2">
        {TABS.slice(0, 2).map((t) => (
          <Tab key={t.href} {...t} active={isActive(pathname, t.href)} />
        ))}

        <button onClick={openCart} className="flex flex-col items-center justify-center py-1.5" aria-label="Panier">
          <span className="relative -mt-6 flex h-14 w-14 items-center justify-center rounded-full brand-gradient text-white shadow-glow">
            <ShoppingBag className="h-6 w-6" />
            {cart.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink ring-2 ring-surface">
                {cart.count}
              </span>
            )}
          </span>
          <span className="mt-0.5 text-[10px] font-medium text-muted">Panier</span>
        </button>

        {TABS.slice(2).map((t) => (
          <Tab key={t.href} {...t} active={isActive(pathname, t.href)} />
        ))}
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Tab({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className="focus-ring flex flex-col items-center justify-center gap-0.5 rounded-xl py-2.5">
      <Icon className={cn("h-5 w-5 transition", active ? "text-brand" : "text-muted")} />
      <span className={cn("text-[10px] font-medium transition", active ? "text-brand" : "text-muted")}>{label}</span>
    </Link>
  );
}
