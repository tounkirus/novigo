"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard, Store, Bike, ClipboardList, Users, Contact, FileText, Boxes,
  Megaphone, BarChart3, ShieldCheck, Wallet, Banknote, Wrench, BrainCircuit,
} from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";

const NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, group: "Opérations" },
  { href: "/admin/orders", label: "Commandes", icon: ClipboardList, group: "Opérations" },
  { href: "/admin/merchants", label: "Commerçants", icon: Store, group: "Opérations" },
  { href: "/admin/drivers", label: "Livreurs", icon: Bike, group: "Opérations" },
  { href: "/admin/services", label: "Services à domicile", icon: Wrench, group: "Opérations" },
  { href: "/admin/users", label: "Utilisateurs", icon: Users, group: "Opérations" },
  { href: "/admin/brain", label: "NOVIGO Brain", icon: BrainCircuit, group: "Opérations" },
  { href: "/admin/finance", label: "Centre financier", icon: Wallet, group: "Finances" },
  { href: "/admin/cash", label: "Gestion caisse", icon: Banknote, group: "Finances" },
  { href: "/admin/crm", label: "CRM Clients", icon: Contact, group: "Croissance" },
  { href: "/admin/ads", label: "Publicité", icon: Megaphone, group: "Croissance" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, group: "Croissance" },
  { href: "/admin/cms", label: "CMS Contenus", icon: FileText, group: "Gestion" },
  { href: "/admin/erp", label: "ERP", icon: Boxes, group: "Gestion" },
  { href: "/admin/system", label: "Super Admin", icon: ShieldCheck, group: "Système" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell title="Back-office" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
