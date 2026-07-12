import Link from "next/link";
import { Ticket, Search, ShoppingBag, PartyPopper, Gift } from "lucide-react";
import { CouponCard } from "@/features/account/coupon-card";
import { EmptyState } from "@/components/ui/states";
import { coupons } from "@/mock";

const STEPS: { icon: typeof Search; title: string; desc: string }[] = [
  { icon: Search, title: "Choisissez", desc: "Parcourez vos coupons disponibles et copiez le code." },
  { icon: ShoppingBag, title: "Commandez", desc: "Ajoutez vos articles puis collez le code au paiement." },
  { icon: PartyPopper, title: "Économisez", desc: "La réduction s'applique instantanément au total." },
];

export default function CouponsPage() {
  const active = coupons.filter((c) => !c.used);
  const used = coupons.filter((c) => c.used);

  return (
    <div className="px-4 py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Coupons & offres</h1>
        <p className="text-[13px] text-muted">Vos codes promo à utiliser sur NOVIGO</p>
      </div>

      {/* Bandeau promo */}
      <Link
        href="/restaurants"
        className="relative flex items-center gap-4 overflow-hidden rounded-2xl brand-gradient p-5 text-white shadow-glow transition hover:brightness-105"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/25">
          <Gift className="h-7 w-7" />
        </span>
        <div className="flex-1">
          <p className="text-lg font-black leading-tight">-10% sur votre 1re commande</p>
          <p className="text-[13px] font-medium opacity-90">Utilisez le code MALI10, cumulable avec la livraison offerte.</p>
        </div>
      </Link>

      {/* Coupons actifs */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
          <Ticket className="h-5 w-5 text-brand" />
          Disponibles ({active.length})
        </h2>
        {active.length === 0 ? (
          <EmptyState
            icon={<Ticket className="h-8 w-8" />}
            title="Aucun coupon disponible"
            description="Vos prochains codes promo et offres apparaîtront ici."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {active.map((c) => (
              <CouponCard key={c.id} coupon={c} />
            ))}
          </div>
        )}
      </section>

      {/* Comment ça marche */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="text-lg font-bold tracking-tight text-ink">Comment ça marche ?</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coupons utilisés */}
      {used.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Historique ({used.length})</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {used.map((c) => (
              <CouponCard key={c.id} coupon={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
