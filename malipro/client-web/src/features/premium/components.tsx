"use client";

import * as React from "react";
import { Crown, Check, X, Sparkles, Truck, Percent, Headphones, Zap, Users } from "lucide-react";
import type { PremiumPlan } from "@/types/modules";
import { api } from "@/mock/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/misc";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatFcfa, cn } from "@/lib/utils";

type Period = "MONTH" | "YEAR";

const COMPARISON: { icon: typeof Truck; label: string; free: string | boolean; premium: string | boolean }[] = [
  { icon: Truck, label: "Livraison gratuite", free: "Dès 15 000 FCFA", premium: "Illimitée" },
  { icon: Percent, label: "Réduction partenaires", free: false, premium: "−10% permanent" },
  { icon: Sparkles, label: "Points de fidélité", free: "Standard", premium: "×2" },
  { icon: Headphones, label: "Support prioritaire 24/7", free: false, premium: true },
  { icon: Zap, label: "Accès anticipé aux nouveautés", free: false, premium: true },
  { icon: Crown, label: "Offres exclusives Premium", free: false, premium: true },
];

const FAQ = [
  { q: "Puis-je annuler à tout moment ?", a: "Oui. Votre abonnement Premium est sans engagement : vous pouvez l'annuler quand vous le souhaitez depuis votre profil, et vous conservez vos avantages jusqu'à la fin de la période en cours." },
  { q: "Comment fonctionne la livraison gratuite illimitée ?", a: "Avec Premium, les frais de livraison sont offerts sur toutes vos commandes éligibles à Bamako, sans montant minimum et sans limite de commandes par mois." },
  { q: "Quels moyens de paiement sont acceptés ?", a: "Vous pouvez régler par Orange Money, Moov Money, carte bancaire ou depuis votre portefeuille NOVIGO. Le paiement est sécurisé et le renouvellement automatique." },
  { q: "La réduction de −10% est-elle cumulable ?", a: "La réduction Premium s'applique automatiquement chez les partenaires participants et reste cumulable avec la plupart des coupons et promotions en cours." },
  { q: "Que se passe-t-il si je passe à l'abonnement annuel ?", a: "L'offre annuelle vous fait bénéficier de 2 mois offerts par rapport au mensuel, d'un cadeau de bienvenue et d'un accès anticipé aux nouvelles fonctionnalités." },
];

function periodLabel(p: Period) {
  return p === "MONTH" ? "/mois" : "/an";
}

/* ----------------------------- Hero premium ---------------------------- */
function PremiumHero() {
  return (
    <div className="premium-gradient relative overflow-hidden rounded-2xl p-6 text-white shadow-lifted sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-gold/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-brand/30 blur-2xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-[12px] font-bold text-gold">
          <Crown className="h-3.5 w-3.5" /> NOVIGO Premium
        </span>
        <h2 className="mt-3 max-w-lg text-3xl font-black leading-tight sm:text-4xl">
          Passez au niveau supérieur de la livraison
        </h2>
        <p className="mt-2 max-w-md text-sm font-medium opacity-80">
          Livraison gratuite illimitée, réductions permanentes et avantages exclusifs. Économisez sur chaque commande à Bamako.
        </p>
      </div>
    </div>
  );
}

/* ------------------------- Bouton d'abonnement ------------------------- */
function SubscribeDialog({ plan }: { plan: PremiumPlan }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function subscribe() {
    setLoading(true);
    await api.pay(plan.price);
    setLoading(false);
    setOpen(false);
    toast({
      title: "Bienvenue chez Premium !",
      description: `Votre abonnement ${plan.name} est actif. Profitez de tous vos avantages.`,
      tone: "success",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={plan.highlight ? "gold" : "secondary"}
        block
        className="mt-5"
        onClick={() => setOpen(true)}
      >
        S&apos;abonner
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer votre abonnement</DialogTitle>
          <DialogDescription>
            Vous allez souscrire à l&apos;offre <strong className="text-ink">{plan.name}</strong> pour{" "}
            <strong className="text-ink">{formatFcfa(plan.price)}</strong> {periodLabel(plan.period)}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-xl bg-shell p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-gold-dark">
            <Crown className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{plan.name}</p>
            <p className="text-[12px] text-muted">Renouvellement automatique, sans engagement</p>
          </div>
          <p className="text-sm font-bold text-ink">{formatFcfa(plan.price)}</p>
        </div>
        <div className="flex gap-3">
          <DialogClose asChild>
            <Button variant="secondary" block disabled={loading}>Annuler</Button>
          </DialogClose>
          <Button block loading={loading} onClick={subscribe}>
            Payer {formatFcfa(plan.price)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Carte de plan --------------------------- */
function PlanCard({ plan }: { plan: PremiumPlan }) {
  const isFree = plan.price === 0;
  return (
    <Card
      className={cn(
        "relative flex flex-col p-6",
        plan.highlight && "border-brand shadow-lifted ring-1 ring-brand/30",
      )}
    >
      {plan.badge && (
        <Badge tone={plan.highlight ? "solid" : "gold"} className="absolute right-5 top-5">
          {plan.badge}
        </Badge>
      )}
      <p className="text-base font-bold text-ink">{plan.name}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-black tracking-tight text-ink">{isFree ? "Gratuit" : formatFcfa(plan.price)}</span>
        {!isFree && <span className="text-[13px] font-medium text-muted">{periodLabel(plan.period)}</span>}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-[13px] text-ink">
            <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", plan.highlight ? "bg-brand text-white" : "bg-brand-soft text-brand")}>
              <Check className="h-3 w-3" />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      {isFree ? (
        <Button variant="outline" block className="mt-5" disabled>
          Votre offre actuelle
        </Button>
      ) : (
        <SubscribeDialog plan={plan} />
      )}
    </Card>
  );
}

/* -------------------------- Tableau comparatif ------------------------- */
function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-line bg-shell px-4 py-3 text-[13px] font-semibold text-ink sm:gap-6">
        <span>Avantage</span>
        <span className="w-16 text-center text-muted sm:w-24">Gratuit</span>
        <span className="w-16 text-center text-brand sm:w-24">Premium</span>
      </div>
      {COMPARISON.map((row) => (
        <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-0 sm:gap-6">
          <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <row.icon className="h-4 w-4 shrink-0 text-muted" />
            {row.label}
          </span>
          <span className="flex w-16 justify-center sm:w-24">{renderCell(row.free, false)}</span>
          <span className="flex w-16 justify-center sm:w-24">{renderCell(row.premium, true)}</span>
        </div>
      ))}
    </div>
  );
}

function renderCell(value: string | boolean, highlight: boolean) {
  if (value === true) {
    return (
      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", highlight ? "bg-success-soft text-success" : "bg-shell text-muted")}>
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-shell text-muted">
        <X className="h-4 w-4" />
      </span>
    );
  }
  return <span className={cn("text-center text-[12px] font-semibold", highlight ? "text-brand" : "text-muted")}>{value}</span>;
}

/* -------------------------------- Bandeau ------------------------------ */
function MembersBanner() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-brand-soft p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
        <Users className="h-6 w-6" />
      </span>
      <div>
        <p className="text-base font-black text-ink">Déjà 12 000 membres Premium à Bamako</p>
        <p className="text-[13px] text-muted">Rejoignez la communauté qui économise sur chaque commande.</p>
      </div>
    </div>
  );
}

/* ------------------------------ Squelette ------------------------------ */
export function PremiumSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-52 w-full rounded-2xl" />
      <Skeleton className="mx-auto h-10 w-56 rounded-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}

/* ------------------- Vue assemblée (données chargées) ------------------ */
export function PremiumView({ plans }: { plans: PremiumPlan[] }) {
  const [period, setPeriod] = React.useState<Period>("MONTH");
  const visible = plans.filter((p) => p.price === 0 || p.period === period);

  return (
    <div className="space-y-8">
      <Reveal>
        <PremiumHero />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex justify-center">
          <Segmented
            options={[
              { value: "MONTH", label: "Mensuel" },
              { value: "YEAR", label: "Annuel · 2 mois offerts" },
            ]}
            value={period}
            onChange={(v) => setPeriod(v as Period)}
          />
        </div>
      </Reveal>

      <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((plan) => (
          <RevealItem key={plan.id}>
            <PlanCard plan={plan} />
          </RevealItem>
        ))}
      </RevealGroup>

      <section>
        <Reveal>
          <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Gratuit vs Premium</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <ComparisonTable />
        </Reveal>
      </section>

      <Reveal>
        <MembersBanner />
      </Reveal>

      <section>
        <Reveal>
          <h2 className="mb-1 text-lg font-bold tracking-tight text-ink">Questions fréquentes</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="px-5 py-1">
            <Accordion type="single" collapsible>
              {FAQ.map((item, i) => (
                <AccordionItem key={item.q} value={`faq-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
