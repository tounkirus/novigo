"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard, ClipboardList, CalendarDays, Images, Star, Wallet, UserCog,
} from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";

const NAV: DashboardNavItem[] = [
  { href: "/pro", label: "Tableau de bord", icon: LayoutDashboard, group: "Activité" },
  { href: "/pro/interventions", label: "Interventions", icon: ClipboardList, group: "Activité" },
  { href: "/pro/calendar", label: "Disponibilités", icon: CalendarDays, group: "Activité" },
  { href: "/pro/portfolio", label: "Portfolio", icon: Images, group: "Profil" },
  { href: "/pro/reviews", label: "Avis clients", icon: Star, group: "Profil" },
  { href: "/pro/profile", label: "Profil & KYC", icon: UserCog, group: "Profil" },
  { href: "/pro/wallet", label: "Portefeuille", icon: Wallet, group: "Finances" },
];

export default function ProLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell title="Espace Prestataire" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
