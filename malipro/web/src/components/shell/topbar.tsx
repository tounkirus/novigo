"use client";
import { useAuth } from "@/lib/auth/auth-context";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Topbar({ title }: { title: string }) {
  const { user, signOut } = useAuth();
  return (
    <header className="border-b border-line bg-surface">
      <div className="flex h-14 items-center justify-between px-6">
        <h1 className="text-base font-semibold text-ink">{title}</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-ink">
              {user?.firstName ?? "Opérateur"} {user?.lastName ?? ""}
            </p>
            <p className="text-[11px] text-muted">{user?.roles?.[0] ?? ""}</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft font-mono text-sm font-semibold text-brand-dark">
            {initials(user?.firstName, user?.lastName, user?.phone)}
          </span>
          <Button variant="ghost" onClick={signOut}>
            Déconnexion
          </Button>
        </div>
      </div>
      <div className="h-px bg-gold/60" />
    </header>
  );
}
