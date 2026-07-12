"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/orders", label: "Commandes" },
  { href: "/payments", label: "Paiements" },
  { href: "/drivers", label: "Livreurs" },
  { href: "/merchants", label: "Commerçants" },
  { href: "/moderation", label: "Modération" },
  { href: "/artisans", label: "Artisans" },
  { href: "/users", label: "Utilisateurs" },
  { href: "/support", label: "Support" },
  { href: "/coupons", label: "Coupons" },
  { href: "/notifications", label: "Notifications" },
  { href: "/commissions", label: "Commissions" },
  { href: "/audit", label: "Audit" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-shell text-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-mono text-sm font-bold">
          M
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">NOVIGO</p>
          <p className="text-[11px] text-white/50">Console admin</p>
        </div>
      </div>
      <nav className="mt-2 flex flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-white/5 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r bg-brand" style={{ width: 3 }} />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-5 py-4 text-[11px] text-white/40">
        v1.0 · Vision 2050
      </div>
    </aside>
  );
}
