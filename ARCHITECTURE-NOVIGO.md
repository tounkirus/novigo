# Architecture NOVIGO — Plateforme unique (Web · Android · iOS · Admin)

> Document faisant autorité. Décisions validées par le propriétaire produit le 2026-07-12.
> Objectif : une seule plateforme, un seul point d'entrée, synchronisation temps réel,
> évolutive vers plusieurs millions d'utilisateurs **sans réécriture future**.

## 0. Principe directeur

Le **Web (`client-web`) reste la référence fonctionnelle**. Android et iOS doivent atteindre
la parité, avec une UI adaptée mobile. Toutes les interfaces consomment **une seule API publique**
(NOVIGO API Gateway) et partagent **une seule base logique**, les **mêmes utilisateurs, commandes,
produits, commerçants, livreurs**.

On **ne fusionne pas** les deux backends : on les **spécialise** derrière la passerelle.

## 1. Décisions d'architecture (ADR condensées)

| # | Décision | Statut |
|---|----------|--------|
| ADR-1 | Deux backends spécialisés derrière **un** API Gateway (pas de fusion) | ✅ validé |
| ADR-2 | **NestJS :8080** = auth OTP, identité, commandes, livraison, tracking, chat, notifications, géoloc temps réel livreurs, Socket.IO | ✅ validé |
| ADR-3 | **Spring :8081** = wallet, paiements, facturation, comptabilité, promotions, coupons, fidélité, administration, rapports, intégrations externes | ✅ validé |
| ADR-4 | **1 cluster PostgreSQL, 1 schéma par service, 1 table = 1 seul écrivain** ; références croisées par ID ; cohérence via bus d'événements | ✅ validé |
| ADR-5 | Bus d'événements **RabbitMQ** (`novigo.events`, topic) entre Nest et Spring | ✅ (défaut, corrigible) |
| ADR-6 | **JWT unique** à secret partagé (HS256) : NestJS émet, Spring et Gateway valident le même token | ✅ (défaut, corrigible) |
| ADR-7 | Gateway = reverse-proxy edge **Nginx** (routage + WebSocket + TLS), montée en charge vers Kong/Traefik si besoin | ✅ (défaut, corrigible) |
| ADR-8 | Services à domicile **fusionnés dans l'app Client** (comme le web `/home-services`) ; portail pro = web pour l'instant | ✅ (défaut, corrigible) |
| ADR-9 | iOS non buildable sous Windows → **Android buildé localement**, iOS via CI Codemagic (`codemagic.yaml`) | ✅ (défaut, corrigible) |

## 2. Topologie

```
 Web · Android · iOS · Admin · Super-Admin
                 │  (1 seule URL : https://api.novigo.ml)
                 ▼
        ┌──────────────────────┐
        │  NOVIGO API GATEWAY  │  Nginx — TLS, rate-limit, routage, WS passthrough
        └───────┬──────────────┘
      ops/temps réel│      │finance/admin
                    ▼      ▼
   ┌────────────────────┐ ┌────────────────────┐
   │  NestJS :8080      │ │  Spring :8081      │
   │  schéma « ops »    │ │  schéma « finance »│
   └─────────┬──────────┘ └─────────┬──────────┘
             │  RabbitMQ novigo.events (topic)  │
             └───────────────┬──────────────────┘
                             ▼
              PostgreSQL (1 cluster, base « novigo »)
              schéma ops (Nest) │ schéma finance (Spring)
              Redis (cache/sessions/denylist) · MinIO (fichiers)
```

## 3. Table de routage du Gateway

Le Gateway est **le seul endroit** qui décide du propriétaire d'un chemin. Règle Nginx :
les préfixes **finance** ci-dessous sont routés explicitement vers Spring ; **tout le reste**
(identité, ops, temps réel) tombe vers NestJS.

| Préfixe (`/api/v1/…`) | Cible | Domaine |
|---|---|---|
| `auth`, `users`, `customers` | Nest | Identité / OTP / profil |
| `orders`, `deliveries`, `drivers`, `public/orders` | Nest | Commandes / livraison / tracking |
| `stores`, `catalog`, `merchants`, `artisans` | Nest | Catalogue / commerçants |
| `chat`, `notifications`, `support`, `reviews`, `referrals`, `favorites` | Nest | Social / support |
| `brain` | Nest | **NOVIGO Brain** — décisions (tarif, délai, attribution, apprentissage) |
| `socket.io/` **(WebSocket)** | Nest | Temps réel Socket.IO `/realtime` |
| `wallet`, `wallets`, `payments` | **Spring** | Portefeuille / paiements |
| `invoices`, `billing`, `reports`, `analytics` | **Spring** | Facturation / compta / rapports |
| `promotions`, `coupons`, `loyalty`, `subscriptions`, `ads` | **Spring** | Marketing / fidélité |
| `cash` | **Spring** | Caisse / POS |
| _(défaut : tout autre chemin)_ | Nest | — |

> **Doublons à réconcilier (P1)** : `payments`, `coupons`, `notifications`, `reviews`, `favorites`
> existent dans les DEUX backends (Spring a tout réimplémenté). Le Gateway impose l'unique
> propriétaire ; le backend non-propriétaire **retire progressivement** ses endpoints doublons.
> `admin/*` opérationnel (commandes/livreurs/commerçants) reste sur Nest car les données y vivent ;
> `admin` financier + rapports/analytics → Spring.

## 4. Base logique unique (ADR-4)

- **1 instance PostgreSQL**, base `novigo`.
- **Schéma `ops`** : possédé par Nest (Prisma) — `DATABASE_URL=…/novigo?schema=ops`.
- **Schéma `finance`** : possédé par Spring — `currentSchema=finance`, `flyway.schemas=finance`.
- **Séparation obligatoire** : les deux définissent des tables `users`, `orders`, `products`… ;
  sans schémas séparés elles entreraient en collision. Les schémas garantissent « 1 table = 1 écrivain ».
- **Identité canonique** : la table `users` **de Nest** (schéma `ops`) fait foi. Spring cesse d'être
  émetteur d'identité et référence l'utilisateur par `userId` (UUID) + valide le JWT de Nest.
- **Cross-domain** : jamais d'écriture croisée. Ex. : Spring a besoin d'une commande → il la connaît
  par `orderId` (reçu via événement) et ne lit/écrit que ses propres tables finance.

## 5. Cohérence temps réel via événements (ADR-5)

Bus **RabbitMQ**, exchange topic `novigo.events`. Flux de référence :

```
Client commande (Web/Android/iOS)
  └─ Nest crée l'ordre → Socket.IO `order.new` au commerçant
       └─ publie AMQP `order.created`  ──▶ Spring (réserve/valide paiement)
Commerçant accepte → Nest `order.updated` (client + livreur)
Livreur accepte/roule → Nest `order.tracking` (position live au client)
Paiement confirmé (Spring) → AMQP `payment.confirmed`
  └─ Spring crédite wallets (client/commerçant/livreur) + facture + compta
  └─ Nest reçoit `payment.confirmed` → Socket.IO `order.updated` + `notification.push`
```

Événements Socket.IO déjà présents côté Nest : `order.new`, `order.updated`, `order.tracking`,
`chat.message`, `chat.typing`, `notification.push`. Événements AMQP déjà présents côté Spring :
`payment.confirmed`, `notification.dispatched`. **À ajouter** : publisher AMQP côté Nest +
consumer AMQP côté Nest (P0-4).

## 6. Auth unifiée (ADR-6)

- Les deux backends lisent **déjà** `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (HS256).
- Cible : **même secret** pour les deux → Spring valide les access tokens émis par Nest.
- À vérifier/aligner (P0-3) : algorithme (HS256), claim sujet (`sub`=userId), claim `roles`,
  et le mapping des rôles (`CLIENT`→`CUSTOMER`, etc.). Une table de correspondance de rôles
  est fournie côté Gateway/Spring pour la transition.

## 7. Applications

| App | Dossier canonique | Base de code active | Cible |
|---|---|---|---|
| Web client (référence) | `_stack/malipro/client-web` | Next.js 14, 68 pages, mock↔live | pointer Gateway, mode live |
| Admin / Super-Admin | `_stack/malipro/client-web` (`/admin`) + `web/` | — | Gateway |
| Android/iOS Client | `_stack/malipro_client` | `lib/novigo/` | + écrans manquants + HTTP/WS live |
| Android/iOS Livreur | `_stack/malipro_driver` | `lib/novigo/` | + cash/chat/notifs + WS géoloc |
| Android/iOS Commerçant | `_stack/malipro_merchant` | `lib/novigo/` | + catalogue/stocks/promos + WS commandes |
| Services à domicile | fusionnés dans l'app Client (ADR-8) | — | — |

**Doublons retirés** (ADR : pas de doublons) le 2026-07-12 : `malipro_demo`, `malipro_livreur`,
`malipro_commercant` supprimés (obsolètes, superseded par les apps NOVIGO natives `lib/novigo/`).

**Base mobile** : le contrat HTTP+WS existe déjà, débranché, dans `lib/core`+`lib/features`
de chaque app. On **réintroduit une couche `lib/novigo/data/` (API client + realtime)** pilotée
par un flag `USE_LIVE` (défaut mock offline pour la démo zéro-infra, `--dart-define` pour live),
en réutilisant les DTO/endpoints déjà écrits. Pas de WebView, pas de Riverpod.

## 8. Feuille de route

- **P0 — Socle** (en cours) : Gateway Nginx + compose unifié infra partagée + schémas séparés
  + secret JWT partagé + bus RabbitMQ + 1 slice temps réel (commander→commerçant→livreur→tracking)
  prouvé Web↔Android sur le **même** backend live.
- **P1 — Réconciliation** (en cours) :
  - ✅ **Rôles alignés** : `JwtAuthFilter` (Spring) accorde les alias inter-backend
    (`CUSTOMER↔CLIENT`, `ARTISAN↔PROVIDER`) → toute autorisation `@PreAuthorize` passe quel que
    soit le nom émis par Nest. Compile + 34 tests verts.
  - ✅ **Dédoublonnage = appliqué au Gateway** : le routage impose un propriétaire unique par
    chemin (§3). Les endpoints doublons du non-propriétaire (Spring `payments/coupons/notifications/
    reviews/favorites`) deviennent internes/obsolètes ; suppression physique différée (non requise,
    le Gateway ne les expose pas).
  - ✅ **Projection d'identité/domaine finance (FAIT + vérifié)** : Nest enrichit `order.created`
    (`merchantUserId`, `subtotal`, `deliveryFee`) ; Spring `DomainEventListener` route vers
    `FinanceSettlementService` qui **projette les identités Nest** dans `finance.users` via
    `UserProjectionService` (upsert SQL natif avec id = UUID Nest, contourne `@GeneratedValue`)
    puis crédite le wallet commerçant (vente − commission 10 %) + transaction `SALE`. Prouvé :
    commande `MLP-2026-000028` (sous-total 2000) → wallet MERCHANT +1800, commission 200,
    users « Commerçant »/« Client » projetés. `mvn test` vert, aucune migration nécessaire.
- **P2 — Parité mobile Client** : ajouter les ~19 écrans manquants (taxi, colis, services domicile,
  factures, recharge, coupons, fidélité, premium, parrainage, chat, notifs, profil…), en live.
- **P3 — Parité Livreur & Commerçant** : cash/chat/notifs (livreur) ; catalogue CRUD, photos,
  stocks, variantes, promos, coupons, factures, analytics (commerçant), en live.
- **P4 — Qualité** : Material 3, dark/light, offline+cache, skeletons, hero, biométrie/Face ID/Touch ID,
  120 FPS ; observabilité (Prometheus/Grafana/Jaeger/Loki déjà présents).
- **P5 — Build & validation** : build Android vérifié ; iOS via Codemagic ; rapport de synchro
  Web/Android/iOS (fonctions, % sync, endpoints/DTO réutilisés, tests) ; zéro régression, build vert.

## 8 bis. NOVIGO Brain (chapitre 15)

Le **NOVIGO Brain** est la couche de décision de la plateforme : `malipro/backend/src/brain/`
(module Nest global, schéma `ops`). Il porte les huit moteurs (attribution, tarification,
itinéraire, regroupement, confiance, fraude, intelligence de la ville, apprentissage), le
journal explicable des décisions et le Livre de Connaissances. Les commandes deviennent des
**missions** ; les applications consomment `/api/v1/brain/*` et **exécutent** ses décisions
(principes n°1 et n°2). Un nouveau métier s'ajoute **par configuration** (`ServicePolicy`),
sans toucher aux moteurs. Détail complet : `_stack/BRAIN-NOVIGO.md`.

## 9. Contraintes honnêtes

- **iOS non buildable sous Windows** (pas de `Podfile`, besoin macOS/Xcode). Build iPhone = CI Codemagic
  ou Mac. Android buildable localement.
- Le temps réel STOMP `/ws` de Spring est **retiré** au profit de Socket.IO (Nest) unique.
- « Millions d'utilisateurs » : l'architecture (gateway stateless, 1 écrivain/table, bus asynchrone,
  cache Redis, WS namespacé) le permet ; la **tenue de charge réelle** exige tests k6 + scaling
  horizontal (répliques Nest/Spring derrière le gateway) — hors périmètre du socle P0.
