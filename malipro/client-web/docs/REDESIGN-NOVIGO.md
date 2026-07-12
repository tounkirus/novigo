# Refonte visuelle NOVIGO — retour à l'esprit premium (accent rouge)

Objectif : conserver le design premium MALIPRO (thème sombre, accent rouge) en gardant le nom
**NOVIGO**. **Aucune** modification backend / API / REST / base de données / modèle métier / logique.
Périmètre : `client-web` uniquement (CSS, jetons, assets, médiathèque). Build vert obligatoire ✅.

## 1. Charte graphique appliquée (jetons `globals.css`)

L'app est **entièrement pilotée par jetons sémantiques** (variables CSS + Tailwind) : repeindre les
jetons re-skinne les 67 pages, le header, le hero, les cartes, boutons et badges **sans toucher un
seul composant** → zéro régression, zéro doublon.

**Mode sombre (référence premium, défaut) :**
| Jeton | Couleur | Usage |
|-------|---------|-------|
| `--shell` | `#0F1117` | fond principal |
| `--paper` | `#171A22` | fond secondaire |
| `--surface` | `#1C202A` | cartes |
| `--line` | `#313743` | séparateurs |
| `--gray` | `#2E3440` | gris |
| `--ink` | `#FFFFFF` | texte principal |
| `--muted` | `#B8BDC9` | texte secondaire |
| `--brand` | `#E53935` | rouge accent |
| `--brand-light` | `#FF5A5F` | rouge clair |
| `--brand-dark` | `#C62828` | dégradé profond |
| `--success` / `--warning` / `--info` / `--violet` | `#2ECC71` / `#FF9800` / `#2196F3` / `#7C4DFF` | sémantiques |

Le header conserve **exactement** sa disposition (logo · adresse · recherche · notifications ·
panier · profil · bascule sombre) — effet verre translucide sur `#0F1117` (≈ `#141821`).

**Mode clair (corrigé WCAG AA) :** surfaces blanches, `--ink #1A1D26` (contraste ~16:1),
`--muted #5A6372` (~5:1), accent rouge, sémantiques assombries pour la lisibilité sur blanc.
Ombres portées via un canal `--shadow` dédié (noir en sombre → profondeur des cartes ; plus de
halo blanc).

Thème **par défaut = sombre** (`providers.tsx`), le clair reste accessible via la bascule du header.

## 2. Logo premium

- **Cercle rouge + « N » blanc** dans le header, le login (cercle blanc + N rouge sur le hero rouge)
  et le `DashboardShell`.
- Assets régénérés en identité rouge : `icon.svg` (favicon), `logo.svg` (lockup), `logo-mark.svg`,
  `apple-touch-icon` (iOS PNG), `android-icon-192/512` (PWA maskable PNG), `og` (1200×630).
- `manifest` : `theme_color #E53935`, `background_color #0F1117` → splash Android cohérent.

## 3. Vraies images HD cohérentes (`mock/media.ts`)

Source principale passée à **Unsplash HD** (photos curées, **chaque URL vérifiée HTTP 200**), en
gardant **les mêmes signatures** (`productImage` / `storeImage` / `themedImage` / `fallbackImage`) →
aucun impact sur les consommateurs. Repli loremflickr pour les produits spécifiques
(épicerie/pharmacie/tech), puis picsum via `<MediaImage>`.

**Concepts curés HD :** pizza, burger, poulet (grillé/braisé), shawarma/kebab, tacos, sandwich,
frites, salade, riz, poisson, viande, glace, jus, café, pâtisserie, pain, gâteau, légumes —
couvertures commerces (restaurant, supermarché, pharmacie, boulangerie, boucherie, marché, boutique)
— services (taxi, moto, livreur, plombier, électricien, menuisier, maçon, coiffeur). Toutes
cohérentes avec leur catégorie et déterministes (hash du seed).

## 4. Mode clair / contraste

Audit complet : les 115 `text-white` et 45 `bg-white` sont **tous contextuellement corrects**
(sur surfaces rouges/dégradés/images, puces translucides, QR code, thumb de switch, barres de
progression) avec variantes `dark:` appropriées. **Aucun blanc-sur-blanc, aucun bouton invisible.**
Les boutons utilisent tous les jetons (`primary` = dégradé rouge + texte blanc, etc.).

## 5. Animations (déjà présentes — pas de doublon)

Vérifié : hover/lift premium existant (`whileHover y:-4` spring sur les cartes, `hover:shadow-lifted`,
zoom image `group-hover:scale-105`), `active:scale-[0.97]` sur les boutons, `<Reveal>` au scroll,
skeletons `animate-shimmer`, transitions d'accordéon. Conformément à la consigne « éviter les
doublons », **rien n'a été recréé**.

## 6. Design system

Uniformisé **par construction** : boutons, badges, cartes, inputs, tableaux, dashboard, wallet,
checkout, catalogue, panier, commandes, portails livreur/commerçant/prestataire/admin/super-admin
consomment tous les mêmes jetons → cohérence rouge/sombre instantanée. Responsive conservé
(breakpoints `md:`/`sm:` desktop → mobile).

## 7. Vérification — build vert

| Contrôle | Résultat |
|----------|----------|
| `vitest run` | ✅ **60/60** (3 assertions d'image mises à jour vers la source HD) |
| `npm run build` | ✅ Compiled, **67 pages**, standalone |
| Images Unsplash | ✅ toutes vérifiées HTTP 200 avant intégration |
| Backend / API / DB / logique | ✅ **inchangés** (aucun fichier hors `client-web`) |

## 8. Hors périmètre (à confirmer si souhaité)
- Console admin séparée `web/` (app legacy distincte) : conserve encore l'indigo — non incluse car
  la référence premium concerne la Super App `client-web`.
