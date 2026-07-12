"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bell, Menu as MenuIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogOut, RefreshCw } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar } from "@/components/ui/misc";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { useSession } from "@/features/auth/session";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
}

/** Retourne le href du lien de navigation le plus spécifique correspondant au chemin. */
function useActiveHref(pathname: string, nav: DashboardNavItem[]): string {
  return React.useMemo(() => {
    const matches = nav
      .filter((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))
      .sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.href ?? nav[0]?.href ?? "";
  }, [pathname, nav]);
}

function SidebarContent({
  title,
  nav,
  activeHref,
  onNavigate,
}: {
  title: string;
  nav: DashboardNavItem[];
  activeHref: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-black text-white shadow-glow">
          N
        </span>
        <div className="min-w-0">
          <span className="block text-base font-black leading-none tracking-tight text-ink">
            NOVI<span className="text-brand">GO</span>
          </span>
          <span className="mt-1 block truncate text-[11px] font-medium text-muted">{title}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map((item, i) => {
          const active = item.href === activeHref;
          const Icon = item.icon;
          const showGroup = item.group && item.group !== nav[i - 1]?.group;
          return (
            <div key={item.href}>
              {showGroup && (
                <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted first:pt-1">
                  {item.group}
                </p>
              )}
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-brand-soft text-brand" : "text-muted hover:bg-shell hover:text-ink",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-shell hover:text-ink"
        >
          <ArrowLeft className="h-[18px] w-[18px] shrink-0" />
          Retour à l'app
        </Link>
      </div>
    </div>
  );
}

export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: DashboardNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const activeHref = useActiveHref(pathname, nav);
  const pageTitle = nav.find((n) => n.href === activeHref)?.label ?? title;
  const { user, logout } = useSession();

  return (
    <div className="flex min-h-screen bg-shell">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface lg:block">
        <SidebarContent title={title} nav={nav} activeHref={activeHref} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0" hideClose>
          <SidebarContent
            title={title}
            nav={nav}
            activeHref={activeHref}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-shell lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <h1 className="truncate text-lg font-bold tracking-tight text-ink">{pageTitle}</h1>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle className="hidden sm:flex" />
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-shell"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-0.5 rounded-full outline-none ring-brand focus-visible:ring-2" aria-label="Compte">
                <Avatar src={user.avatar} alt={user.name} size={36} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="flex items-center gap-3 px-2.5 py-2">
                  <Avatar src={user.avatar} alt={user.name} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-[12px] text-muted">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/login"><RefreshCw className="h-4 w-4" /> Changer d'espace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/" onClick={logout}><LogOut className="h-4 w-4" /> Se déconnecter</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
