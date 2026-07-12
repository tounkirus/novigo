"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard, ClipboardList, ChefHat, Boxes, BookOpen, Store, BarChart3, Wallet, Rocket,
} from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";

const NAV: DashboardNavItem[] = [
  { href: "/merchant", label: "Tableau de bord", icon: LayoutDashboard, group: "Activité" },
  { href: "/merchant/orders", label: "Commandes", icon: ClipboardList, group: "Activité" },
  { href: "/merchant/kitchen", label: "Écran cuisine", icon: ChefHat, group: "Activité" },
  { href: "/merchant/catalog", label: "Catalogue", icon: BookOpen, group: "Catalogue" },
  { href: "/merchant/products", label: "Produits", icon: Boxes, group: "Catalogue" },
  { href: "/merchant/storefront", label: "Vitrine", icon: Store, group: "Catalogue" },
  { href: "/merchant/wallet", label: "Portefeuille", icon: Wallet, group: "Finances" },
  { href: "/merchant/analytics", label: "Statistiques", icon: BarChart3, group: "Finances" },
  { href: "/merchant/onboarding", label: "Inscription", icon: Rocket, group: "Compte" },
];

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell title="Espace Commerçant" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
