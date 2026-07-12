"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  UtensilsCrossed, Info, Star, Images, HelpCircle, MapPin, Phone, Mail, Globe,
  Clock, ThumbsUp, Flame, Store as StoreIcon,
} from "lucide-react";
import type { Store, MenuSection, Review, Product } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Avatar, Progress } from "@/components/ui/misc";
import { Rating } from "@/components/ui/rating";
import { HScroll } from "@/components/ui/carousel";
import { ProductRow, ProductCard } from "@/components/shared/product-card";
import { ReviewDialog } from "./review-dialog";
import { formatCompact, timeAgo, cn } from "@/lib/utils";
import { NOW } from "@/constants";

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const TABS = [
  { value: "menu", label: "Menu", icon: UtensilsCrossed },
  { value: "about", label: "À propos", icon: Info },
  { value: "reviews", label: "Avis", icon: Star },
  { value: "photos", label: "Photos", icon: Images },
  { value: "faq", label: "FAQ", icon: HelpCircle },
] as const;

export function Vitrine({
  store,
  menu,
  reviews,
  populars,
}: {
  store: Store;
  menu: MenuSection[];
  reviews: Review[];
  populars: Product[];
}) {
  const [tab, setTab] = React.useState<string>("menu");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-shell/85 px-4 py-2.5 backdrop-blur">
        <TabsList className="w-full max-w-full justify-start overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="menu">
        <MenuTab store={store} menu={menu} populars={populars} onJump={() => setTab("menu")} />
      </TabsContent>
      <TabsContent value="about">
        <AboutTab store={store} />
      </TabsContent>
      <TabsContent value="reviews">
        <ReviewsTab store={store} reviews={reviews} />
      </TabsContent>
      <TabsContent value="photos">
        <PhotosTab store={store} />
      </TabsContent>
      <TabsContent value="faq">
        <FaqTab store={store} />
      </TabsContent>
    </Tabs>
  );
}

/* ------------------------------------------------------------------ Menu */

function MenuTab({
  store,
  menu,
  populars,
  onJump,
}: {
  store: Store;
  menu: MenuSection[];
  populars: Product[];
  onJump: () => void;
}) {
  const refs = React.useRef<Record<string, HTMLElement | null>>({});

  const jump = (id: string) => {
    onJump();
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-8 pb-4">
      {populars.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-bold tracking-tight text-ink">Les plus populaires</h2>
          </div>
          <HScroll>
            {populars.map((p) => (
              <ProductCard key={p.id} product={p} store={store} className="w-[170px]" />
            ))}
          </HScroll>
        </section>
      )}

      {menu.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {menu.map((s) => (
            <button
              key={s.id}
              onClick={() => jump(s.id)}
              className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {menu.map((section) => (
        <section
          key={section.id}
          ref={(el) => {
            refs.current[section.id] = el;
          }}
          className="scroll-mt-32"
        >
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight text-ink">{section.name}</h2>
            <span className="text-[12px] text-muted">{section.products.length} articles</span>
          </div>
          <div className="divide-y divide-line">
            {section.products.map((p) => (
              <ProductRow key={p.id} product={p} store={store} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- À propos */

function AboutTab({ store }: { store: Store }) {
  const hours = DAYS_FR.map((label, day) => {
    const h = store.openingHours.find((o) => o.day === day);
    const closed = !h || h.closed;
    return { label, text: closed ? "Fermé" : `${h!.open} — ${h!.close}`, closed };
  });
  const todayIndex = new Date(NOW).getDay();

  const contacts = [
    { icon: MapPin, label: store.address, sub: `${store.district}, ${store.city}` },
    { icon: Phone, label: store.phone, href: `tel:${store.phone}` },
    store.email ? { icon: Mail, label: store.email, href: `mailto:${store.email}` } : null,
    store.website ? { icon: Globe, label: store.website, href: store.website } : null,
  ].filter(Boolean) as { icon: typeof MapPin; label: string; sub?: string; href?: string }[];

  return (
    <div className="grid gap-6 pb-4 lg:grid-cols-2">
      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-lg font-bold tracking-tight text-ink">Présentation</h2>
          <p className="text-[15px] leading-relaxed text-muted">{store.description}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Coordonnées</h2>
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
            {contacts.map((c, i) => {
              const inner = (
                <span className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <c.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{c.label}</span>
                    {c.sub && <span className="block text-[12px] text-muted">{c.sub}</span>}
                  </span>
                </span>
              );
              return c.href ? (
                <a key={i} href={c.href} className="block transition hover:opacity-80">{inner}</a>
              ) : (
                <div key={i}>{inner}</div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Horaires d'ouverture</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            {hours.map((h, i) => (
              <div
                key={h.label}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-sm",
                  i === todayIndex && "bg-brand-soft/60",
                )}
              >
                <span className={cn("font-medium text-ink", i === todayIndex && "text-brand")}>
                  {h.label}
                  {i === todayIndex && <span className="ml-2 text-[11px] font-semibold text-brand">Aujourd'hui</span>}
                </span>
                <span className={cn(h.closed ? "text-muted" : "font-medium text-ink")}>{h.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Localisation</h2>
          <div className="relative h-56 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-emerald-500/15 via-shell to-brand-soft shadow-card">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(0deg, transparent 24%, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.06) 26%, transparent 27%), linear-gradient(90deg, transparent 24%, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.06) 26%, transparent 27%)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-glow">
                <MapPin className="h-6 w-6" />
              </span>
              <span className="mt-2 rounded-full bg-surface/90 px-3 py-1 text-[12px] font-semibold text-ink shadow-card backdrop-blur">
                {store.name}
              </span>
            </div>
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-surface/90 px-3 py-2 text-[12px] text-muted shadow-card backdrop-blur">
              <span className="truncate">{store.address}</span>
              <span className="shrink-0 font-mono tabular-nums">
                {store.location.lat.toFixed(4)}, {store.location.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Avis */

function ReviewsTab({ store, reviews }: { store: Store; reviews: Review[] }) {
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const totalRated = reviews.length || 1;

  return (
    <div className="space-y-6 pb-4">
      <section className="grid gap-6 rounded-2xl border border-line bg-surface p-5 shadow-card sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-center justify-center sm:pr-6">
          <span className="text-5xl font-black tracking-tight text-ink">{store.rating.toFixed(1).replace(".", ",")}</span>
          <Rating value={store.rating} size="md" className="mt-1" />
          <span className="mt-1 text-[13px] text-muted">{formatCompact(store.reviewCount)} avis</span>
        </div>
        <div className="space-y-1.5">
          {dist.map((d) => (
            <div key={d.star} className="flex items-center gap-3">
              <span className="flex w-8 items-center gap-1 text-[13px] font-medium text-muted">
                {d.star} <Star className="h-3 w-3 fill-gold text-gold" />
              </span>
              <Progress value={(d.count / totalRated) * 100} className="flex-1" />
              <span className="w-8 text-right text-[12px] tabular-nums text-muted">{d.count}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-ink">Ce qu'en disent les clients</h2>
        <ReviewDialog storeName={store.name} />
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <motion.article
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-line bg-surface p-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              <Avatar src={r.authorAvatar} alt={r.authorName} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-ink">{r.authorName}</p>
                  <span className="shrink-0 text-[12px] text-muted">{timeAgo(r.createdAt, NOW)}</span>
                </div>
                <Rating value={r.rating} className="mt-0.5" />
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-ink">{r.comment}</p>
            <div className="mt-2 flex items-center gap-1 text-[12px] text-muted">
              <ThumbsUp className="h-3.5 w-3.5" /> {r.likes} personne{r.likes > 1 ? "s" : ""} ont trouvé cet avis utile
            </div>
            {r.reply && (
              <div className="mt-3 rounded-xl bg-shell p-3">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand">
                  <StoreIcon className="h-3.5 w-3.5" /> Réponse de {store.name}
                  <span className="font-normal text-muted">· {timeAgo(r.reply.createdAt, NOW)}</span>
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{r.reply.text}</p>
              </div>
            )}
          </motion.article>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Photos */

function PhotosTab({ store }: { store: Store }) {
  return (
    <div className="pb-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {store.gallery.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-shell">
            <Image
              src={src}
              alt={`${store.name} — photo ${i + 1}`}
              fill
              sizes="(max-width: 640px) 45vw, 240px"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- FAQ */

function FaqTab({ store }: { store: Store }) {
  return (
    <div className="pb-4">
      <div className="rounded-2xl border border-line bg-surface px-5 shadow-card">
        <Accordion type="single" collapsible>
          {store.faq.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="leading-relaxed">{f.a}</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
