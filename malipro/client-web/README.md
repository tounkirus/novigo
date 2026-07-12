# NOVIGO — Application Web Client

Refonte Front-End premium de la Super App malienne (repas, supermarchés, pharmacies,
marchés, colis, taxis, services). Interface mobile-first, animée, accessible, avec **mode sombre** complet.

## Stack
- **Next.js 14** (App Router) · **React 18** · **TypeScript strict**
- **Tailwind CSS** (design system par variables CSS → dark mode automatique)
- **Framer Motion** (animations) · **Radix UI** (primitives accessibles) · **Lucide** (icônes)
- **TanStack Query** (prêt pour l'API) · **Recharts** (dashboards)

## Démarrer
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de production
npm run typecheck  # vérification TypeScript
npm run seed       # régénère un instantané JSON du jeu de démo (src/data/generated/)
```

## Architecture
```
src/
  app/            Routes Next (App Router)
    (app)/        Espace client (Home, restaurants, vitrine, panier, checkout, suivi, compte…)
    driver/       Espace livreur (dashboard)
    merchant/     Espace commerçant (dashboard + vitrine)
    admin/        Administration
  components/
    ui/           Design system réutilisable (Button, Card, Sheet, Charts, KPI…)
    shared/       Composants métier (StoreCard, ProductCard, badges, sections…)
    layout/       Shell (header, bottom nav, drawer panier, menu mobile)
    dashboard/    Shell des espaces pro
  features/       Logique par domaine (cart, favorites, home, store, checkout, orders…)
  mock/           Générateurs de données de démonstration (déterministes)
  types/          Modèle de domaine partagé
  constants/      Constantes (verticales, statuts, paiements, quartiers de Bamako…)
  lib/            Utilitaires (format FCFA, dates, cn…)
```

## Données de démonstration
Toutes les données sont **fictives, réalistes et déterministes** (générateur `mulberry32`
+ graines stables) : aucun rendu aléatoire → pas d'erreur d'hydratation SSR/CSR.

Le catalogue (1 450 commerces) est généré en mémoire ; menus, avis et détails lourds
sont **paresseux et mémoïsés** pour rester rapides malgré la volumétrie cible :

| Entité | Cible | Entité | Cible |
|---|---|---|---|
| Restaurants | 500 | Commandes | 30 000 |
| Supermarchés | 200 | Avis | 100 000 |
| Pharmacies | 100 | Produits | 20 000+ |
| Boulangeries | 150 | Coupons | 500 |
| Boucheries | 100 | Promotions | 1 000 |
| Marchés | 100 | Notifications | 5 000 |
| Boutiques | 300 | Adresses | 10 000 |
| Livreurs | 500 | Clients | 5 000 |

### Brancher les vraies API
Remplacez les sélecteurs de `src/mock/` par des appels API (via TanStack Query).
Les composants ne dépendent que des **types** de `src/types/` — aucun changement d'UI requis.

## Images
Placeholders déterministes : `picsum.photos` (photos) et `ui-avatars.com` (avatars).
Remplaçables par vos visuels réels sans toucher au code (voir `src/mock/images.ts`).
