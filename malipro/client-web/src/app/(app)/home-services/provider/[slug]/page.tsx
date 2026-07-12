"use client";

import * as React from "react";
import Link from "next/link";
import { MediaImage } from "@/components/ui/media-image";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, BadgeCheck, MapPin, Clock, Phone, MessageCircle, CalendarCheck,
  Briefcase, CheckCircle2, Repeat, Languages as LangIcon,
} from "lucide-react";
import { api } from "@/mock/api";
import type { ServiceProvider, ServiceReview } from "@/types/services";
import { Avatar } from "@/components/ui/misc";
import { Rating } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryState } from "@/components/ui/async-state";
import { EmptyState } from "@/components/ui/states";
import { ProviderBadges, KycBadge } from "@/features/services/ui";
import { formatDistance, formatDate } from "@/lib/utils";

const WEEK = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function ProviderProfilePage() {
  const params = useParams<{ slug: string }>();
  const query = useQuery({ queryKey: ["service-provider", params.slug], queryFn: () => api.serviceProvider(params.slug) });

  return (
    <div className="pb-28">
      <QueryState
        query={query}
        skeleton={<ProfileSkeleton />}
        isEmpty={(d) => d == null}
        emptyState={<EmptyState title="Prestataire introuvable" description="Ce profil n'existe pas ou n'est plus disponible." action={<Button asChild><Link href="/home-services">Retour aux services</Link></Button>} />}
      >
        {(provider) => <ProfileContent provider={provider!} />}
      </QueryState>
    </div>
  );
}

function ProfileContent({ provider }: { provider: ServiceProvider }) {
  const reviewsQuery = useQuery({ queryKey: ["service-reviews", provider.id], queryFn: () => api.serviceReviews(provider.id) });

  return (
    <>
      {/* Couverture */}
      <div className="relative h-44 w-full overflow-hidden bg-shell sm:h-56">
        <MediaImage src={provider.coverImage} alt={provider.categoryLabel} fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Link href={`/home-services/${provider.categoryId}`} className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="px-4">
        {/* En-tête */}
        <div className="-mt-12 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Avatar src={provider.avatar} alt={provider.name} size={96} className="border-4 border-surface shadow-lifted" />
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-ink">{provider.name}</h1>
              {provider.verified && <BadgeCheck className="h-5 w-5 text-info" />}
              {provider.online && <span className="flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" />En ligne</span>}
            </div>
            <p className="text-sm text-muted">{provider.categoryLabel} · {provider.district}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
              <Rating value={provider.rating} count={provider.reviewCount} size="md" />
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{formatDistance(provider.distanceKm)}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Répond en ~{provider.responseTimeMin} min</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm font-medium text-ink">{provider.tagline}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <ProviderBadges badges={provider.badges} max={6} />
          <KycBadge status={provider.kycStatus} />
        </div>

        {/* Statistiques */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat icon={Briefcase} label="Missions" value={String(provider.jobsCompleted)} />
          <MiniStat icon={CheckCircle2} label="Taux de réussite" value={`${provider.completionRate}%`} />
          <MiniStat icon={Repeat} label="Clients fidèles" value={`${provider.repeatClientRate}%`} />
          <MiniStat icon={CalendarCheck} label="Expérience" value={`${provider.yearsExperience} ans`} />
        </div>

        {/* Onglets */}
        <Tabs defaultValue="about" className="mt-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="about">À propos</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="reviews">Avis ({provider.reviewCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4">
            <Card className="p-5">
              <h3 className="mb-2 font-semibold text-ink">Présentation</h3>
              <p className="text-sm leading-relaxed text-muted">{provider.bio}</p>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <h3 className="mb-3 font-semibold text-ink">Prestations & atouts</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.skills.map((s) => (
                    <span key={s} className="rounded-full bg-brand-soft px-3 py-1 text-[12px] font-medium text-brand">{s}</span>
                  ))}
                </div>
                <h3 className="mb-2 mt-4 flex items-center gap-1.5 font-semibold text-ink"><LangIcon className="h-4 w-4" />Langues</h3>
                <p className="text-sm text-muted">{provider.languages.join(" · ")}</p>
              </Card>
              <Card className="p-5">
                <h3 className="mb-3 font-semibold text-ink">Disponibilités</h3>
                <ul className="space-y-1.5 text-sm">
                  {provider.availability.map((a) => (
                    <li key={a.day} className="flex items-center justify-between">
                      <span className="text-muted">{WEEK[a.day]}</span>
                      {a.off ? <span className="text-[13px] font-medium text-error">Fermé</span> : <span className="font-medium text-ink">{a.from} – {a.to}</span>}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="portfolio">
            {provider.portfolio.length === 0 ? (
              <EmptyState title="Aucune réalisation" description="Ce prestataire n'a pas encore ajouté de photos." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {provider.portfolio.map((item) => (
                  <figure key={item.id} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                    <div className="relative aspect-[4/3] w-full bg-shell">
                      <MediaImage src={item.image} alt={item.title} fill sizes="(max-width:640px) 50vw, 240px" className="object-cover transition-transform duration-300 hover:scale-105" />
                    </div>
                    <figcaption className="truncate px-3 py-2 text-[12px] font-medium text-muted">{item.title}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <QueryState query={reviewsQuery} skeleton={<ReviewsSkeleton />} isEmpty={(d) => d.length === 0} emptyState={<EmptyState title="Aucun avis" description="Soyez le premier à noter ce prestataire." />}>
              {(reviews) => <ReviewList reviews={reviews} />}
            </QueryState>
          </TabsContent>
        </Tabs>
      </div>

      {/* Barre de réservation fixe */}
      <div className="glass fixed inset-x-0 bottom-16 z-30 border-t border-line px-4 py-3 md:bottom-0">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-muted">Tarif</p>
            <p className="truncate text-base font-black text-ink">{provider.priceLabel}</p>
          </div>
          <Button variant="secondary" size="icon" asChild aria-label="Appeler">
            <a href={`tel:${provider.phone.replace(/\s/g, "")}`}><Phone className="h-5 w-5" /></a>
          </Button>
          <Button variant="secondary" size="icon" asChild aria-label="Message">
            <Link href="/chat"><MessageCircle className="h-5 w-5" /></Link>
          </Button>
          <Button asChild size="lg">
            <Link href={`/home-services/book/${provider.slug}`}><CalendarCheck className="h-5 w-5" /> Réserver</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

function MiniStat({ icon: Ico, label, value }: { icon: typeof Briefcase; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <Ico className="h-5 w-5 text-brand" />
      <p className="mt-2 text-lg font-bold tracking-tight text-ink">{value}</p>
      <p className="text-[12px] text-muted">{label}</p>
    </div>
  );
}

function ReviewList({ reviews }: { reviews: ServiceReview[] }) {
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start gap-3">
            <Avatar src={r.avatar} alt={r.author} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-ink">{r.author}</p>
                <Rating value={r.rating} />
              </div>
              <p className="text-[12px] text-muted">{r.jobType} · {formatDate(r.date)}</p>
              <p className="mt-1.5 text-sm text-ink">{r.comment}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div>
      <Skeleton className="h-44 w-full sm:h-56" />
      <div className="px-4">
        <Skeleton className="-mt-12 h-24 w-24 rounded-full" />
        <Skeleton className="mt-3 h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
    </div>
  );
}
