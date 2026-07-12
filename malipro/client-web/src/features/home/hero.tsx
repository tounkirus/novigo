"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Sparkles, Star, Clock, MapPin, Bike } from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";
import { Icon } from "@/components/shared/icon";
import { VERTICALS } from "@/constants";
import { themedImage } from "@/mock/media";

// Mosaïque de héros : composition HD (Unsplash curé) évoquant livreur·moto·sac, plats africains,
// pizza et hamburger — servie via <MediaImage> (repli automatique).
const HERO = {
  delivery: themedImage("delivery", "hero-delivery", 900, 560), // livreur, moto, sac de livraison
  african: themedImage("chicken,african,food", "hero-african", 420, 420), // plats africains
  pizza: themedImage("pizza", "hero-pizza", 420, 420),
  burger: themedImage("burger", "hero-burger", 420, 420),
};

// Apparition en cascade des tuiles de la mosaïque (animation légère).
const TILE_VARIANTS = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

export function HomeHero() {
  return (
    // Le dégradé rouge est posé DIRECTEMENT sur la section (background propre) : il ne peut plus
    // passer derrière le fond clair du conteneur parent (bg-shell) → texte blanc toujours lisible,
    // en clair comme en sombre. Les halos restent des calques décoratifs au-dessus du fond.
    <section className="brand-gradient relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-black/20 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-8 text-white lg:grid-cols-[1.05fr_0.95fr] lg:pb-14 lg:pt-12">
        {/* Colonne texte */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Bienvenue sur la Super App du Mali
          </span>
          <h1 className="mt-4 text-3xl font-black leading-[1.1] text-balance sm:text-4xl lg:text-[2.7rem]">
            Tout Bamako livré<br className="hidden sm:block" /> chez vous, en minutes.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85 sm:text-base">
            Repas africains, fast-food, courses, pharmacie, colis et bien plus — livrés au meilleur prix.
          </p>

          <Link
            href="/search"
            className="mt-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm text-muted shadow-lifted transition hover:shadow-xl"
          >
            <Search className="h-5 w-5 text-brand" />
            <span className="line-clamp-1">Rechercher un plat, un restaurant, un produit…</span>
          </Link>

          {/* Accès rapide aux verticales (tuiles verre) */}
          <div className="no-scrollbar mt-6 flex gap-2.5 overflow-x-auto pb-1">
            {VERTICALS.map((v, i) => (
              <motion.div
                key={v.key}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <Link
                  href={`/restaurants?vertical=${v.key}`}
                  className="flex w-[74px] shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-white/12 p-2.5 text-center backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand shadow-card">
                    <Icon name={v.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-white">{v.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Colonne visuelle : mosaïque HD + cartes flottantes animées (smartphone-like) */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
          className="relative mt-2 lg:mt-0"
        >
          <div className="grid grid-cols-6 gap-2.5">
            {/* Tuile large : livreur · moto · sac de livraison + repère Bamako */}
            <motion.div
              variants={TILE_VARIANTS}
              className="relative col-span-6 aspect-[16/9] overflow-hidden rounded-3xl border border-white/20 shadow-2xl"
            >
              <MediaImage src={HERO.delivery} alt="Livreur NOVIGO à moto, Bamako" fill priority sizes="(max-width: 1024px) 90vw, 500px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                <MapPin className="h-3.5 w-3.5 text-brand-light" /> Bamako
              </span>
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-[12px] font-bold text-white shadow-card">
                <Bike className="h-4 w-4" /> Livraison express
              </span>
            </motion.div>

            {/* Trois vignettes : plats africains · pizza · hamburger */}
            {[
              { src: HERO.african, alt: "Plats africains", label: "Local" },
              { src: HERO.pizza, alt: "Pizza", label: "Pizza" },
              { src: HERO.burger, alt: "Hamburger", label: "Burger" },
            ].map((t) => (
              <motion.div
                key={t.alt}
                variants={TILE_VARIANTS}
                className="group relative col-span-2 aspect-square overflow-hidden rounded-2xl border border-white/15 shadow-lifted"
              >
                <MediaImage src={t.src} alt={t.alt} fill sizes="(max-width: 1024px) 30vw, 160px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                <span className="absolute bottom-1.5 left-2 text-[11px] font-bold text-white drop-shadow">{t.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Carte flottante : note (widget façon smartphone) — desktop */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, opacity: { delay: 0.7 } }}
            className="absolute -left-4 top-6 hidden items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2.5 text-ink shadow-lifted backdrop-blur dark:bg-paper/95 dark:text-white lg:flex"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Star className="h-5 w-5 fill-brand" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-black">4,8 / 5</p>
              <p className="text-[11px] text-muted">+120 000 avis</p>
            </div>
          </motion.div>

          {/* Carte flottante : délai de livraison — desktop */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: [0, 6, 0] }}
            transition={{ y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }, opacity: { delay: 0.9 } }}
            className="absolute -right-3 bottom-4 hidden items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2.5 text-ink shadow-lifted backdrop-blur dark:bg-paper/95 dark:text-white lg:flex"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Clock className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-black">~28 min</p>
              <p className="text-[11px] text-muted">Livraison moyenne</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Raccord courbe vers le fond de la page */}
      <div className="h-6 rounded-t-3xl bg-shell" />
    </section>
  );
}
