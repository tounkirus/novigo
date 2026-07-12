# SP9 — Adaptateur Frontend (client API + repli mock automatique)

**Statut : ✅ Terminé et vérifié**

Objectif : permettre au frontend Next.js (`_stack/novigo/client-web`) de consommer le **vrai backend
Spring** (:8081) au lieu du mock, **sans modifier aucune page, route ni composant**. La bascule se fait
par variable d'environnement, avec **repli automatique sur le mock** si le backend est indisponible.

## 1. Principe — un seul point de couplage

Toute l'app cliente accède aux données asynchrones via l'objet `api` de `src/mock/api.ts`
(consommé par TanStack Query). C'est **le seul fichier existant modifié** : son export `api` est
désormais enveloppé par `withBackendAdapter(...)`. Les 65 pages / 6 portails, les features et les
composants restent **inchangés**.

```
mode mock (défaut)  →  api = mockApi (identique à avant, zéro surcoût)
mode live           →  api = mockApi + sous-ensemble redirigé vers Spring, repli mock sur erreur
```

## 2. Fichiers livrés (client-web)

```
src/services/backend/
  config.ts        NEXT_PUBLIC_API_MODE (mock défaut) / _API_BASE_URL / _API_TIMEOUT_MS
  token-store.ts   jetons JWT (localStorage navigateur, cache mémoire SSR)
  http.ts          fetch : base URL, Bearer, timeout AbortController, BackendError normalisée
  dto.ts           miroirs TS des DTO Spring (Page, Store, Product, Category, Provider, Token, Otp)
  mappers.ts       DTO → types front (Store/Product/Category/PaymentProvider) + complétion déterministe
  live-api.ts      stores / storeBySlug / popular / categories / search / paymentProviders / health
  auth.ts          session réelle : login / requestOtp / verifyOtp / me / logout (JWT stocké)
  index.ts         withBackendAdapter(mock) : switch + repli mock automatique
  adapter.test.ts  6 tests (mappers déterministes + wrapper mock inchangé)
src/mock/api.ts    (modif minimale : mockApi + export api = withBackendAdapter(mockApi))
.env.example       variables documentées
```

## 3. Endpoints branchés en live (repli mock si indisponible)

| Méthode front (`api.*`) | Endpoint Spring | Mapping |
|-------------------------|-----------------|---------|
| `stores(query)` | `GET /stores` (q, category, open, page, size, sort) | `StoreView[]` → `Store[]` |
| `storeBySlug(slug)` | `GET /stores/slug/{slug}` | `StoreView` → `Store` |
| `popular(n)` | `GET /stores?sort=rating,desc` | `StoreView[]` → `Store[]` |
| `categories()` | `GET /categories` | `CategoryView[]` → `Category[]` |
| `search(q)` | `GET /stores?q=` + `GET /products?q=` | → `{stores, products}` |
| `paymentProviders()` | `GET /payments/providers` | `ProviderView[]` → `PaymentProvider[]` |
| `backendAuth.login / verifyOtp / me` | `POST /auth/login`, `/auth/otp/*`, `GET /auth/me` | session JWT réelle |

Le backend expose un modèle plus compact que les types riches du front (`Store` a ~30 champs).
Les champs absents (`distanceKm`, `orderCount`, `avgPrice`, images, badges dérivés…) sont **complétés
de façon déterministe** (hash FNV-1a de l'identifiant) — conforme à la règle « aucun `Math.random` /
`Date.now` » et stable entre deux requêtes. Toutes les autres méthodes `api.*` restent servies par le
mock (domaines non encore couverts par le backend, ou trop riches pour le jeu de démo).

## 4. Repli automatique

Chaque méthode live est enveloppée : `try { live() } catch { mock() }`. Un backend éteint, un timeout
(6 s), un 5xx ou une réponse invalide → **repli silencieux sur le mock** (avertissement console). L'app
ne casse jamais, quel que soit l'état du backend. En mode mock, `withBackendAdapter` renvoie l'objet
mock **par référence** (aucun surcoût).

## 5. Vérification (gate SP9)

| Contrôle | Résultat |
|----------|----------|
| `vitest run` (suite complète) | ✅ **60/60** (54 existants + 6 nouveaux) |
| `npm run build` (Next.js) | ✅ Compiled successfully, **65 pages** générées, toutes les routes présentes |
| Aucune page / route / composant modifié | ✅ seul `src/mock/api.ts` touché (+ fichiers neufs) |
| Mode mock = comportement d'origine | ✅ `api === mockApi` (test) |
| Contrat live réel (backend démo booté) | ✅ `/categories`, `/stores`, `/payments/providers`, `/auth/login` renvoient les formes attendues par les DTO/mappers |
| Repli mock si backend absent | ✅ `withFallback` testé + garanti par conception |

## 6. Utilisation

```bash
# Frontend contre le backend réel (backend Spring démarré sur :8081)
NEXT_PUBLIC_API_MODE=live npm run dev          # dans client-web
# Défaut (mock, zéro infra) : ne rien définir
npm run dev
```

## 7. Suite possible (SP10, optionnel)

- Étendre le mapping live aux domaines commande/wallet/notifications (nécessite d'enrichir le seed
  backend pour un rendu aussi dense que le mock).
- Brancher la vraie session JWT (`backendAuth`) sur le sélecteur de rôle `@/features/auth/session`.
- Déploiement (compose complet + variables live).

---
*Phase 4 terminée : SP1 (scaffold) → SP8 (tests/CI/docs) côté backend, SP9 (adaptateur FE) côté client.
Le frontend peut désormais fonctionner en mock (démo) ou en live (backend Spring) sans changer une
seule page.*
