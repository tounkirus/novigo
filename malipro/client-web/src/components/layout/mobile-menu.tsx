"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/misc";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Icon } from "@/components/shared/icon";
import { VERTICALS } from "@/constants";
import { user } from "@/mock";

const MODULES = [
  { href: "/services", label: "Tous les services", icon: "LayoutGrid" },
  { href: "/ride", label: "Taxi & Moto", icon: "Car" },
  { href: "/parcel", label: "Envoi de colis", icon: "Package" },
  { href: "/wallet", label: "Portefeuille", icon: "Wallet" },
  { href: "/bills", label: "Payer une facture", icon: "Receipt" },
  { href: "/recharge", label: "Recharge téléphone", icon: "Smartphone" },
  { href: "/chat", label: "Messages", icon: "MessageCircle" },
];

const LINKS = [
  { href: "/orders", label: "Mes commandes", icon: "ClipboardList" },
  { href: "/loyalty", label: "Fidélité", icon: "Award" },
  { href: "/referral", label: "Parrainage", icon: "Gift" },
  { href: "/premium", label: "Premium", icon: "Crown" },
  { href: "/favorites", label: "Favoris", icon: "Heart" },
  { href: "/coupons", label: "Coupons & offres", icon: "Ticket" },
  { href: "/addresses", label: "Mes adresses", icon: "MapPin" },
  { href: "/notifications", label: "Notifications", icon: "Bell" },
  { href: "/support", label: "Aide & support", icon: "LifeBuoy" },
  { href: "/settings", label: "Paramètres", icon: "Settings" },
];

const SPACES = [
  { href: "/login", label: "Changer d'espace", icon: "RefreshCw" },
  { href: "/driver", label: "Espace livreur", icon: "Bike" },
  { href: "/merchant", label: "Espace commerçant", icon: "Store" },
  { href: "/admin", label: "Administration", icon: "ShieldCheck" },
];

export function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0">
        <div className="brand-gradient p-5 pt-6 text-white">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatar} alt={user.firstName} size={52} className="ring-2 ring-white/40" />
            <div className="min-w-0">
              <p className="truncate text-base font-bold">{user.firstName} {user.lastName}</p>
              <p className="truncate text-[13px] text-white/80">{user.phone}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="text-[11px] text-white/80">Portefeuille</p>
              <p className="text-sm font-bold">{user.walletBalance.toLocaleString("fr-FR")} F</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="text-[11px] text-white/80">Points fidélité</p>
              <p className="text-sm font-bold">{user.loyaltyPoints}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Verticales</p>
          <div className="grid grid-cols-4 gap-2">
            {VERTICALS.map((v) => (
              <SheetClose asChild key={v.key}>
                <Link href={`/restaurants?vertical=${v.key}`} className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition hover:bg-shell">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${v.accent} text-white`}>
                    <Icon name={v.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-medium text-ink">{v.label}</span>
                </Link>
              </SheetClose>
            ))}
          </div>

          <p className="px-2 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">Services</p>
          <div className="space-y-0.5">
            {MODULES.map((l) => (
              <SheetClose asChild key={l.href}>
                <Link href={l.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-shell">
                  <Icon name={l.icon} className="h-5 w-5 text-brand" />
                  {l.label}
                </Link>
              </SheetClose>
            ))}
          </div>

          <p className="px-2 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">Mon compte</p>
          <div className="space-y-0.5">
            {LINKS.map((l) => (
              <SheetClose asChild key={l.href}>
                <Link href={l.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-shell">
                  <Icon name={l.icon} className="h-5 w-5 text-muted" />
                  {l.label}
                </Link>
              </SheetClose>
            ))}
          </div>

          <p className="px-2 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">Espaces pro</p>
          <div className="space-y-0.5">
            {SPACES.map((l) => (
              <SheetClose asChild key={l.href}>
                <Link href={l.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-shell">
                  <Icon name={l.icon} className="h-5 w-5 text-brand" />
                  {l.label}
                </Link>
              </SheetClose>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-shell px-3 py-2">
            <span className="text-sm font-medium text-ink">Mode sombre</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
