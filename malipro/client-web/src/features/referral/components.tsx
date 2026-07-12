"use client";

import * as React from "react";
import { Copy, Check, Share2, Users, UserCheck, Wallet, Gift, UserPlus, ShoppingBag, Coins } from "lucide-react";
import type { Referral } from "@/types/modules";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { Avatar } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/states";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCopy } from "@/hooks";
import { formatFcfa, formatDate } from "@/lib/utils";

const STATUS_META: Record<Referral["friends"][number]["status"], { label: string; tone: "success" | "info" | "warning" }> = {
  ORDERED: { label: "A commandé", tone: "success" },
  JOINED: { label: "Inscrit", tone: "info" },
  PENDING: { label: "En attente", tone: "warning" },
};

const STEPS = [
  { icon: Share2, title: "Partagez votre code", desc: "Envoyez votre code unique à vos amis par WhatsApp, SMS ou réseaux sociaux." },
  { icon: UserPlus, title: "Votre ami s'inscrit", desc: "Il crée son compte NOVIGO en saisissant votre code de parrainage." },
  { icon: ShoppingBag, title: "Vous gagnez tous les deux", desc: "À sa première commande, vous recevez 2 000 FCFA chacun." },
];

/* --------------------------------- Hero -------------------------------- */
export function ReferralHero({ referral }: { referral: Referral }) {
  const { toast } = useToast();
  const [copied, copy] = useCopy();

  async function share() {
    const text = `Rejoins-moi sur NOVIGO avec mon code ${referral.code} et gagne 2 000 FCFA sur ta première commande !`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "NOVIGO", text });
        return;
      } catch {
        /* annulé par l'utilisateur */
      }
    }
    await copy(text);
    toast({ title: "Invitation copiée", description: "Le message de partage est dans le presse-papier.", tone: "success" });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl brand-gradient p-6 text-white shadow-glow">
      <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold backdrop-blur">
          <Gift className="h-3.5 w-3.5" /> Programme de parrainage
        </span>
        <h2 className="mt-3 max-w-md text-2xl font-black leading-tight">
          Parrainez, gagnez {formatFcfa(referral.rewardPerFriend)} par ami
        </h2>
        <p className="mt-1 max-w-md text-[13px] font-medium opacity-90">
          Invitez vos proches sur NOVIGO. À chaque première commande, vous êtes récompensés tous les deux.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/30 bg-white/15 px-4 py-3 backdrop-blur sm:min-w-[240px]">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">Votre code</p>
              <p className="text-xl font-black tracking-wider">{referral.code}</p>
            </div>
            <button
              onClick={() => {
                copy(referral.code);
                toast({ title: "Code copié", description: `« ${referral.code} » est prêt à être partagé.`, tone: "success" });
              }}
              aria-label="Copier le code"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/25 transition hover:bg-white/40"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <Button variant="gold" size="lg" onClick={share} className="gap-2">
            <Share2 className="h-4 w-4" /> Partager
          </Button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- KPIs -------------------------------- */
export function ReferralKpis({ referral }: { referral: Referral }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <KpiCard label="Amis invités" value={String(referral.invited)} icon={<Users className="h-5 w-5" />} />
      <KpiCard label="Complétés" value={String(referral.completed)} icon={<UserCheck className="h-5 w-5" />} hint="Ont commandé" />
      <KpiCard
        label="Gains cumulés"
        value={formatFcfa(referral.earned)}
        icon={<Wallet className="h-5 w-5" />}
        hint={`${formatFcfa(referral.pending)} en attente`}
      />
    </div>
  );
}

/* --------------------------- Comment ça marche ------------------------- */
export function HowItWorks() {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-bold tracking-tight text-ink">Comment ça marche ?</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="relative flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="text-2xl font-black text-line">{i + 1}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-0.5 text-[12px] text-muted">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* --------------------------- Liste des filleuls ------------------------ */
export function FriendsList({ friends }: { friends: Referral["friends"] }) {
  if (friends.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="Aucun filleul pour l'instant"
        description="Partagez votre code pour inviter vos premiers amis et commencer à gagner."
      />
    );
  }
  return (
    <Card className="divide-y divide-line p-0">
      {friends.map((f) => {
        const meta = STATUS_META[f.status];
        return (
          <div key={f.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar src={f.avatar} alt={f.name} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{f.name}</p>
              <p className="text-[12px] text-muted">Inscrit le {formatDate(f.joinedAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              {f.reward > 0 && (
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-success">
                  <Coins className="h-3.5 w-3.5" /> +{formatFcfa(f.reward)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ------------------------------ Squelette ------------------------------ */
export function ReferralSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}

/* ------------------- Vue assemblée (données chargées) ------------------ */
export function ReferralView({ referral }: { referral: Referral }) {
  return (
    <div className="space-y-8">
      <Reveal>
        <ReferralHero referral={referral} />
      </Reveal>
      <Reveal delay={0.05}>
        <ReferralKpis referral={referral} />
      </Reveal>
      <Reveal delay={0.05}>
        <HowItWorks />
      </Reveal>
      <section>
        <Reveal>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold tracking-tight text-ink">Vos filleuls</h2>
            <p className="text-[13px] text-muted">{referral.friends.length} ami{referral.friends.length > 1 ? "s" : ""}</p>
          </div>
        </Reveal>
        <RevealGroup>
          <RevealItem>
            <FriendsList friends={referral.friends} />
          </RevealItem>
        </RevealGroup>
      </section>
    </div>
  );
}
