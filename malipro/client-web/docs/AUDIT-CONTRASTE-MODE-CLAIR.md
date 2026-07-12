# NOVIGO — Audit & correction du contraste en mode clair (WCAG AA)

Objectif : interface **parfaitement lisible en mode clair**, sans modifier le design.
Périmètre : `client-web` front only. Aucun backend/API/DB/Docker/paiement/wallet/sécurité/auth/géoloc/
notifications/catalogue/architecture touché. Build vert obligatoire ✅.

## Méthode d'audit
L'app est **pilotée par jetons sémantiques** (`globals.css` + Tailwind). Audit de tout le front :
- `text-white` : **127 occurrences / 66 fichiers** → toutes posées sur des surfaces **rouge / dégradé /
  image** (hero, bannières, en-têtes, boutons, cartes sur photo, menu mobile) → correctes dans les deux modes.
- `bg-white/xx`, `text-white/xx` : idem, uniquement sur fonds colorés/dégradés/images.
- Gris codés en dur (`text-gray-400`…) : **0** trouvé.
- Inputs/selects/textarea : déjà `text-ink` + `border-line` + `placeholder:text-muted`.

**Conclusion : aucun texte blanc sur blanc réel.** Les défauts de contraste venaient des **valeurs de jetons
du thème clair** et des **placeholders**.

## Corrections (niveau jetons — re-skinne les 67 pages sans toucher au design ni au mode sombre)

| Jeton clair | Avant | Après | Raison |
|---|---|---|---|
| `--ink` (titres) | #1A1D26 | **#111827** | titres presque noirs, ~16:1 |
| `--muted` (secondaires) | #5A6372 (~5:1) | **#4B5563** (~7:1) | gris foncé lisible |
| `--line` (bordures cartes) | #E0E3E9 | **#E5E7EB** | bordure légère demandée |
| `--gray` (remplissage) | #E8EBF0 | #F3F4F6 | neutre clair cohérent |
| `--success` | #16A34A (~3:1) | **#15803D** | AA sur blanc/soft |
| `--warning` | #D97706 (~3:1) | **#B45309** | AA sur blanc/soft |
| `--info` | #2563EB | **#1D4ED8** | AA renforcé |
| `--error` | #DC2626 | **#B91C1C** | AA renforcé |
| `--gold-dark` (texte) | #D68F14 (~2,4:1) | **#A16207** | AA sur blanc/soft |

> Les couleurs sémantiques ne changent que d'**intensité** (mêmes teintes vert/orange/bleu/rouge/ambre),
> uniquement en clair : le design est préservé, le mode sombre **inchangé**.

### Placeholders (#6B7280)
`input.tsx` (input + textarea) et `select.tsx` : `placeholder:text-muted` → **`placeholder:text-muted/80`**
→ en clair ≈ **#6F7782** (≈ #6B7280 demandé, distinct du texte secondaire #4B5563) ; reste lisible en sombre.

## Points contrôlés (checklist)
| Élément | État après correction |
|---|---|
| Titres / sous-titres / paragraphes | `text-ink #111827` / `text-muted #4B5563` — AA ✅ |
| Boutons (primary/secondary/outline/ghost/danger/success) | texte blanc **uniquement** sur fonds colorés ; `text-ink` sur clairs ✅ |
| Cartes | `bg-surface` blanc + **bordure #E5E7EB** + `shadow-card` discrète ✅ |
| Inputs / selects / textarea | `text-ink`, bordure `line`, focus ring rouge ✅ |
| Placeholders | ≈ #6B7280, AA ✅ |
| Icônes | `text-muted` (#4B5563) / `text-brand` — visibles ✅ |
| Badges (brand/success/error/info/warning/gold/neutral) | texte sémantique **assombri → AA** sur teintes `-soft` ✅ |
| Menus / Navbar / header verre | `glass` (surface 72 %) + `text-ink` sombre ✅ |
| Hero Banner | texte blanc sur dégradé rouge / images (les deux modes) ✅ |
| Footer / bottom-nav | actif = rouge, inactif = `text-muted` foncé ✅ |
| Dialogues / modales / sheets / tooltips | `bg-surface` + `text-ink` + `border-line` ✅ |
| États hover / active / disabled / focus | hover tokens, `active:scale`, `disabled:opacity-50`, `focus-visible:ring-brand` ✅ |
| Responsive | jetons globaux → identiques desktop → mobile ✅ |

## Vérification — build vert
| Contrôle | Résultat |
|---|---|
| `npm run build` | ✅ Compiled, **67 pages** |
| Conteneur `web` (compose stack) | ✅ rebuild + :3000 → HTTP 200 |
| Mode sombre | ✅ **inchangé** (bloc `.dark` non modifié) |
| Backend / API / DB / architecture | ✅ inchangés (front only) |

## Fichiers modifiés (front uniquement)
`src/app/globals.css` (jetons `:root` clair) · `src/components/ui/input.tsx` · `src/components/ui/select.tsx`
