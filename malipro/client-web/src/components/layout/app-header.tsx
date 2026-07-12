"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, MapPin, Menu as MenuIcon, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/features/cart/cart-store";
import { useUI } from "./app-shell";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar } from "@/components/ui/misc";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { user, notifications } from "@/mock";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const cart = useCart();
  const { openCart } = useUI();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [addr, setAddr] = React.useState(user.addresses[0]);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-line">
        <div className="flex h-16 items-center gap-3 px-4 md:h-[72px] md:gap-4 md:px-6">
          <button onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-shell md:hidden" aria-label="Menu">
            <MenuIcon className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-base font-black text-white shadow-glow">N</span>
            <span className="hidden text-xl font-black tracking-tight text-ink sm:block">
              NOVI<span className="text-brand">GO</span>
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 hidden max-w-[220px] items-center gap-1.5 rounded-full px-2.5 py-1.5 text-left transition hover:bg-shell md:flex">
              <MapPin className="h-4 w-4 shrink-0 text-brand" />
              <span className="min-w-0">
                <span className="block text-[11px] leading-none text-muted">Livrer à</span>
                <span className="block truncate text-[13px] font-semibold text-ink">{addr.label} · {addr.district}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel>Mes adresses</DropdownMenuLabel>
              {user.addresses.map((a) => (
                <DropdownMenuItem key={a.id} onClick={() => setAddr(a)}>
                  <MapPin className="h-4 w-4 text-brand" />
                  <span className="min-w-0">
                    <span className="block font-medium">{a.label}</span>
                    <span className="block truncate text-[12px] text-muted">{a.line}, {a.district}</span>
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/addresses"><MapPin className="h-4 w-4" /> Gérer mes adresses</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/search"
            className="ml-auto flex h-11 flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-muted transition hover:border-brand/40 hover:shadow-card md:ml-4 md:max-w-md"
          >
            <Search className="h-4 w-4" />
            <span className="truncate">Rechercher un plat, un commerce…</span>
          </Link>

          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <ThemeToggle className="hidden sm:flex" />

            <Link href="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-shell" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />}
            </Link>

            <button onClick={openCart} className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-shell" aria-label="Panier">
              <ShoppingBag className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                  {cart.count}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 hidden rounded-full outline-none ring-brand focus-visible:ring-2 md:block" aria-label="Profil">
                <Avatar src={user.avatar} alt={user.firstName} size={36} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="flex items-center gap-3 px-2.5 py-2">
                  <Avatar src={user.avatar} alt={user.firstName} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user.firstName} {user.lastName}</p>
                    <p className="truncate text-[12px] text-muted">{user.phone}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {NAV_LINKS.map((l) => (
                  <DropdownMenuItem key={l.href} asChild>
                    <Link href={l.href}>{l.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Onglets verticales (desktop) */}
        <nav className="hidden items-center gap-1 border-t border-line px-4 md:flex md:px-6">
          {TOP_TABS.map((t) => {
            const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "relative px-3.5 py-3 text-[13px] font-semibold transition",
                  active ? "text-brand" : "text-muted hover:text-ink",
                )}
              >
                {t.label}
                {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </nav>
      </header>

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}

const TOP_TABS = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/ride", label: "Taxi" },
  { href: "/wallet", label: "Portefeuille" },
  { href: "/premium", label: "Premium" },
  { href: "/coupons", label: "Coupons" },
  { href: "/orders", label: "Commandes" },
];

const NAV_LINKS = [
  { href: "/profile", label: "Mon profil" },
  { href: "/wallet", label: "Portefeuille" },
  { href: "/orders", label: "Mes commandes" },
  { href: "/loyalty", label: "Fidélité" },
  { href: "/referral", label: "Parrainage" },
  { href: "/premium", label: "Premium" },
  { href: "/favorites", label: "Favoris" },
  { href: "/settings", label: "Paramètres" },
  { href: "/support", label: "Aide & support" },
];
