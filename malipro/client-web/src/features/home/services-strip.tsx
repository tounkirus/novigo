"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/shared/icon";
import { staggerContainer, staggerItem, tap } from "@/lib/motion";

// Charte NOVIGO : Rouge (marque) + graphite (gris/noir). Wallet & Moto portent l'accent rouge,
// les services utilitaires adoptent des dégradés graphite neutres — plus de vert/violet/ambre.
const SERVICES = [
  { href: "/ride", label: "Taxi", icon: "Car", grad: "from-neutral-700 to-neutral-900" },
  { href: "/ride", label: "Moto", icon: "Bike", grad: "from-brand to-brand-dark" },
  { href: "/parcel", label: "Colis", icon: "Package", grad: "from-zinc-700 to-zinc-900" },
  { href: "/wallet", label: "Wallet", icon: "Wallet", grad: "from-brand to-brand-dark" },
  { href: "/bills", label: "Factures", icon: "Receipt", grad: "from-neutral-700 to-neutral-900" },
  { href: "/recharge", label: "Recharge", icon: "Smartphone", grad: "from-zinc-700 to-zinc-900" },
  { href: "/loyalty", label: "Fidélité", icon: "Award", grad: "from-stone-600 to-stone-800" },
  { href: "/services", label: "Tout", icon: "LayoutGrid", grad: "from-slate-600 to-slate-800" },
];

export function ServicesStrip() {
  return (
    <motion.div
      variants={staggerContainer(0.05)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className="grid grid-cols-4 gap-2 sm:grid-cols-8"
    >
      {SERVICES.map((s) => (
        <motion.div key={s.label} variants={staggerItem}>
          <motion.div whileTap={tap}>
            <Link href={s.href} className="flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center transition hover:bg-surface">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.grad} text-white shadow-card`}>
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold text-ink">{s.label}</span>
            </Link>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}
