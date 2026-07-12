# NOVIGO — Refonte UI/UX premium (niveau Uber Eats / Bolt Food / Glovo)

Amélioration **exclusivement visuelle** de `client-web`. **Aucune** modification backend Spring, API REST,
base de données, Docker, paiement, wallet, sécurité, auth, géoloc, notifications, catalogue ou
architecture. Composants existants **réutilisés** (zéro doublon). Build vert obligatoire ✅.

## 1. Charte couleur resserrée — Rouge / Noir / Blanc / Gris
Suppression de **toutes les grandes zones colorées** parasites (vert, violet, ambre, sky, pink, gold) :
- `constants` → `VERTICALS` : FOOD garde l'accent **rouge** de marque, les autres verticales passent en
  dégradés **graphite** (neutral/zinc/stone/slate) — plus d'émeraude/sky/ambre/violet.
- `constants` → `BADGE_LABEL` : deux familles seulement — **rouge** (promo, livraison offerte, express,
  premium, top) et **graphite neutre** (vérifié, nouveau, local). Fini le vert « Livraison offerte / Local ».
- `services-strip` : Wallet & Moto en **rouge**, utilitaires en graphite (fini vert Recharge, violet Colis…).
- `generators.generatePromotions` : accents **rouge + graphite** uniquement.
- `page → CollectionsBanner` : fini émeraude/lime/pink/sky → **vraies photos HD** + voile sombre.
- `page → FreeDeliveryBanner` : fini le dégradé gold → bannière **graphite premium + accent rouge**.
- `store-card` : badge « Livraison offerte » passé de **vert** (`bg-success`) à **rouge** (`bg-brand`).
- Les micro-points de statut « ouvert / en ligne » restent verts (indicateur fonctionnel, pas une zone).

## 2. Hero Banner premium (mosaïque HD + animations légères)
`features/home/hero.tsx` :
- **Mosaïque HD** couvrant tout le brief : tuile large **livreur · moto · sac** (repère **Bamako** + badge
  « Livraison express »), puis 3 vignettes **plats africains · pizza · hamburger** (zoom au hover).
- **Cartes flottantes animées** façon widget smartphone (note 4,8 / 5 · +120 000 avis ; ~28 min) —
  flottement doux en boucle (framer-motion) + apparition en **cascade** des tuiles (stagger).
- Titre fort, sous-titre, barre de recherche large, accès rapide aux verticales (tuiles verre, hover lift).
- Dégradé rouge de marque + halos discrets (Rouge/Noir). Responsive : mosaïque affichée sur mobile
  (reflow sous le texte), cartes flottantes réservées au desktop pour éviter tout débordement.

## 3. Header plus haut & plus premium (disposition conservée à l'identique)
`app-header.tsx` : hauteur `h-16 → md:h-[72px]`, gouttières `px-4 → md:px-6`, logo agrandi
(pastille 40 px, wordmark `text-xl`), barre de recherche `h-11` + ombre au survol, onglets plus aérés
(`py-3`, `font-semibold`). **Aucun élément déplacé, ajouté ou retiré.**

## 4. Cartes de catégories modernes (nouveau — aucun doublon existant)
`page → CategoryCards` : tuiles claires (surface + bordure), **icône rouge** sur pastille `bg-brand-soft`,
**ombre douce**, **hover** discret (lift + scale de l'icône). Les anciennes puces catégories du hero ont
été **retirées** (déplacées ici) pour éviter tout doublon.

## 5. Cartes restaurants façon Uber Eats
`store-card.tsx` : grande photo HD (déjà en place) + dégradé bas pour lisibilité, badges
**Livraison offerte** (rouge) / **Populaire** (forte demande) / **Vérifié**, **temps**, **distance**,
**note + nombre d'avis**, **prix moyen** (`~X FCFA`), animation hover (lift + zoom image) conservée.

## 6. Promotions = vraies bannières publicitaires
`generatePromotions` : offres explicites — **-25 %**, **Livraison offerte**, **2 achetés = 1 offert**,
**Vente Flash -40 %**, **-30 %**, **Week-end gourmand** — sur photos HD, accents rouge/graphite.

## 7. Images réalistes
Médiathèque HD conservée (Unsplash curé + repli) ; le hero et les collections consomment
`themedImage` (livraison, marché/légumes, salade, pâtisserie, pharmacie).

## 8. Espacements / hiérarchie & animations
Section Catégories en tête de page pour structurer l'entrée ; bannières plus lisibles ; animations
**discrètes** (hover cartes/boutons, flottement du hero, transitions) — réutilisation de l'existant
(`whileHover`, `active:scale`, `Reveal`, shimmer), **aucune animation dupliquée**.

## 9. Responsive
Grilles fluides (`grid-cols-3 sm:grid-cols-4 lg:grid-cols-6` catégories ; hero `lg:grid-cols-2`),
visuel hero masqué sous `lg`, header adaptatif — Desktop / Laptop / Tablette / Android / iPhone.

## 10. Vérification — build vert
| Contrôle | Résultat |
|----------|----------|
| `vitest run` | ✅ **60/60** |
| `npm run build` | ✅ Compiled, **67 pages** |
| Zones vertes décoratives (features/home, shared) | ✅ **0** restante |
| Conteneur `web` (compose stack) | ✅ rebuild + :3000 → HTTP 200 (hero, Catégories, NOVIGO) |
| Backend / API / DB / architecture | ✅ **inchangés** (uniquement `client-web` front) |

## Fichiers touchés (front uniquement)
`src/features/home/hero.tsx` · `src/features/home/services-strip.tsx` ·
`src/components/layout/app-header.tsx` · `src/components/shared/store-card.tsx` ·
`src/app/(app)/page.tsx` · `src/constants/index.ts` · `src/mock/generators.ts`
