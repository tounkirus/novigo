"use client";

import type { ReactNode } from "react";
import { LayoutDashboard, Package, TrendingUp, Wallet, Banknote, User } from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";

const NAV: DashboardNavItem[] = [
  { href: "/driver", label: "Tableau de bord", icon: LayoutDashboard, group: "Activité" },
  { href: "/driver/orders", label: "Courses", icon: Package, group: "Activité" },
  { href: "/driver/earnings", label: "Gains", icon: TrendingUp, group: "Activité" },
  { href: "/driver/wallet", label: "Portefeuille", icon: Wallet, group: "Finances" },
  { href: "/driver/cash", label: "Caisse (Cash)", icon: Banknote, group: "Finances" },
  { href: "/driver/profile", label: "Profil", icon: User, group: "Compte" },
];

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell title="Espace Livreur" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
