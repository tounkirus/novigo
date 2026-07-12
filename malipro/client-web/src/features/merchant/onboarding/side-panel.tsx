"use client";

import { Check, Store, Rocket, Wallet, TrendingUp, ShieldCheck, Headphones } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STEPS } from "./constants";

const BENEFITS: { icon: typeof Wallet; title: string; desc: string }[] = [
  { icon: TrendingUp, title: "Plus de ventes", desc: "Touchez des milliers de clients à Bamako." },
  { icon: Wallet, title: "Reversements rapides", desc: "Encaissez via Orange Money, Wave ou banque." },
  { icon: ShieldCheck, title: "Paiements sécurisés", desc: "Transactions protégées par NOVIGO." },
  { icon: Headphones, title: "Accompagnement dédié", desc: "Une équipe support à votre écoute." },
];

export function SidePanel({ current, valid }: { current: number; valid: boolean[] }) {
  const completed = valid.filter(Boolean).length;
  const pct = Math.round((completed / STEPS.length) * 100);

  return (
    <div className="sticky top-4 space-y-4">
      <Card className="overflow-hidden">
        <div className="brand-gradient relative p-5 text-white">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Rocket className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-lg font-black tracking-tight">Devenez partenaire NOVIGO</h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/85">
            <Store className="h-3.5 w-3.5" /> Rejoignez 2 000+ commerçants
          </p>
        </div>

        <div className="p-5">
          <div className="mb-1.5 flex items-center justify-between text-[13px]">
            <span className="font-semibold text-ink">Avancement du dossier</span>
            <span className="font-bold text-brand">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-shell">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="mt-4 space-y-2">
            {STEPS.map((s, i) => {
              const done = valid[i];
              const active = i === current;
              return (
                <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                      done
                        ? "border-success bg-success text-white"
                        : active
                          ? "border-brand text-brand"
                          : "border-line text-muted",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn(active ? "font-semibold text-ink" : done ? "text-ink" : "text-muted")}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-bold text-ink">Avantages NOVIGO</h3>
        <ul className="space-y-3.5">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <b.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink">{b.title}</p>
                <p className="text-[12px] text-muted">{b.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
