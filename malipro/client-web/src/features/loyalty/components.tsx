"use client";

import * as React from "react";
import { Gift, Sparkles, Check, Lock, TrendingUp, Award } from "lucide-react";
import type { LoyaltyState, LoyaltyTier, Reward } from "@/types/modules";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HScroll } from "@/components/ui/carousel";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useCountUp } from "@/hooks";
import { formatDate, cn } from "@/lib/utils";

/* --------------------------- Carte de statut --------------------------- */
export function StatusCard({ state }: { state: LoyaltyState }) {
  const animated = useCountUp(state.points);
  const remaining = state.nextTier ? Math.max(0, state.nextTier.minPoints - state.points) : 0;
  const span = state.nextTier ? state.nextTier.minPoints - state.tier.minPoints : 1;
  const progress = state.nextTier
    ? ((state.points - state.tier.minPoints) / span) * 100
    : 100;

  return (
    <Card className="overflow-hidden p-0">
      <div className={cn("relative bg-gradient-to-br p-5 text-white", state.tier.color)}>
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-medium opacity-90">
              <Award className="h-4 w-4" /> Palier {state.tier.name}
            </p>
            <p className="mt-2 text-4xl font-black tabular-nums leading-none">{animated.toLocaleString("fr-FR")}</p>
            <p className="mt-1 text-[13px] font-medium opacity-90">points disponibles</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25 backdrop-blur">
            <Sparkles className="h-6 w-6" />
          </span>
        </div>

        {state.nextTier && (
          <div className="relative mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[12px] font-medium opacity-90">
              <span>{state.tier.name}</span>
              <span>{state.nextTier.name}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="mt-2 text-[13px] font-semibold">
              Plus que {remaining.toLocaleString("fr-FR")} points pour atteindre {state.nextTier.name}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <TrendingUp className="h-4 w-4 text-brand" />
          Points à vie
        </div>
        <p className="text-base font-bold tabular-nums text-ink">{state.lifetimePoints.toLocaleString("fr-FR")}</p>
      </div>
    </Card>
  );
}

/* --------------------------- Rangée de paliers -------------------------- */
export function TiersRow({ tiers, current, points }: { tiers: LoyaltyTier[]; current: string; points: number }) {
  return (
    <HScroll>
      {tiers.map((tier) => {
        const reached = points >= tier.minPoints;
        const isCurrent = tier.id === current;
        return (
          <div
            key={tier.id}
            className={cn(
              "flex w-[230px] flex-col rounded-2xl border bg-surface p-4 shadow-card transition",
              isCurrent ? "border-brand ring-2 ring-brand/30" : "border-line",
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white", tier.color)}>
                <Award className="h-5 w-5" />
              </span>
              {isCurrent ? (
                <Badge tone="brand">Palier actuel</Badge>
              ) : reached ? (
                <Badge tone="success">Atteint</Badge>
              ) : (
                <Badge tone="neutral">
                  <Lock className="h-3 w-3" /> {tier.minPoints.toLocaleString("fr-FR")} pts
                </Badge>
              )}
            </div>
            <p className="mt-3 text-base font-bold text-ink">{tier.name}</p>
            <p className="text-[12px] text-muted">Dès {tier.minPoints.toLocaleString("fr-FR")} points</p>
            <ul className="mt-3 space-y-1.5">
              {tier.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-1.5 text-[12px] text-ink">
                  <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", reached ? "text-success" : "text-muted")} />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </HScroll>
  );
}

/* --------------------------- Carte de récompense ------------------------ */
export function RewardCard({ reward, points }: { reward: Reward; points: number }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const affordable = points >= reward.cost;

  function redeem() {
    setOpen(false);
    toast({
      title: "Récompense échangée",
      description: `« ${reward.title} » a été ajoutée à votre compte.`,
      tone: "success",
    });
  }

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-shell">
        <SmartImage src={reward.image} alt={reward.title} fill sizes="(max-width:640px) 100vw, 320px" className="object-cover" />
        <Badge tone="solid" className="absolute left-3 top-3">{reward.category}</Badge>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm font-bold text-ink">{reward.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">{reward.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-[13px] font-bold text-gold-dark">
            <Sparkles className="h-3.5 w-3.5" />
            {reward.cost.toLocaleString("fr-FR")} pts
          </span>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant={affordable ? "primary" : "secondary"} size="sm" block disabled={!affordable} className="mt-3">
              {affordable ? "Échanger" : `Il manque ${(reward.cost - points).toLocaleString("fr-FR")} pts`}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer l&apos;échange</DialogTitle>
              <DialogDescription>
                Vous allez échanger <strong className="text-ink">{reward.cost.toLocaleString("fr-FR")} points</strong> contre « {reward.title} ». Il vous restera {(points - reward.cost).toLocaleString("fr-FR")} points.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 rounded-xl bg-shell p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Gift className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{reward.title}</p>
                <p className="text-[12px] text-muted">{reward.description}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <DialogClose asChild>
                <Button variant="secondary" block>Annuler</Button>
              </DialogClose>
              <Button block onClick={redeem}>Confirmer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}

/* --------------------------- Historique des points --------------------- */
export function HistoryList({ history }: { history: LoyaltyState["history"] }) {
  return (
    <Card className="divide-y divide-line p-0">
      {history.map((h) => (
        <div key={h.id} className="flex items-center gap-3 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-success">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">{h.label}</p>
            <p className="text-[12px] text-muted">{formatDate(h.createdAt)}</p>
          </div>
          <span className="text-sm font-bold tabular-nums text-success">+{h.points}</span>
        </div>
      ))}
    </Card>
  );
}

/* ------------------------------ Squelette ------------------------------ */
export function LoyaltySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-[230px] shrink-0 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/* ------------------- Vue assemblée (données chargées) ------------------ */
export function LoyaltyView({ state, tiers }: { state: LoyaltyState; tiers: LoyaltyTier[] }) {
  return (
    <div className="space-y-8">
      <Reveal>
        <StatusCard state={state} />
      </Reveal>

      <section>
        <Reveal>
          <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Les paliers de fidélité</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <TiersRow tiers={tiers} current={state.tier.id} points={state.points} />
        </Reveal>
      </section>

      <section>
        <Reveal>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold tracking-tight text-ink">Boutique de récompenses</h2>
            <p className="text-[13px] text-muted">Échangez vos points</p>
          </div>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.rewards.map((r) => (
            <RevealItem key={r.id}>
              <RewardCard reward={r} points={state.points} />
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section>
        <Reveal>
          <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Historique des points gagnés</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <HistoryList history={state.history} />
        </Reveal>
      </section>
    </div>
  );
}
