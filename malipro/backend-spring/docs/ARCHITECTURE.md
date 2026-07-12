# NOVIGO Backend — Architecture

## Vue d'ensemble
```
                 ┌─────────────────────────────┐
   Navigateur ───▶  Frontend Next.js (client-web)  :5173
                 └───────────────┬─────────────┘
                                 │  (SP10 : adaptateur API + fallback mock)
                                 ▼
                 ┌─────────────────────────────┐
                 │  API Spring Boot (novigo-api) :8081
                 │  Controller → Service → Repository → Entity
                 │  DTO ⇄ Entity via MapStruct
                 └───┬───────┬───────┬───────┬──┘
                     │       │       │       │
              PostgreSQL   Redis  RabbitMQ  MinIO
               :5433      :6380    :5672    :9002
              (Flyway)   (cache) (events)  (media)
```

## Principes
- **Architecture en couches** : `Controller` (REST, validation, Swagger) → `Service` (métier, transactions)
  → `Repository` (Spring Data JPA) → `Entity` (JPA). Conversion `DTO ⇄ Entity` par **MapStruct**.
- **API versionnée** `/api/v1/**`, pagination/tri/filtres standardisés (`PageResponse<T>`).
- **Erreurs normalisées** via `GlobalExceptionHandler` → `ApiError`.
- **Stateless + JWT** (SP3). RBAC porté par `roles` / `permissions` / `role_permissions`.
- **Rétrocompatibilité Frontend** : aucun contrat cassant ; le mock reste le mode démo.

## Couches par domaine (gabarit répété SP4+)
```
domain/<module>/
├─ web/<Module>Controller.java     REST + @Valid + @Tag Swagger
├─ dto/…Request.java / …Response.java
├─ mapper/<Module>Mapper.java      MapStruct
├─ service/<Module>Service.java    @Transactional
├─ repo/<Module>Repository.java    Spring Data JPA + Specifications (filtres)
└─ entity/<Module>.java            JPA
```

## Feuille de route Phase 4 (sous-phases)
| SP | Contenu | État |
|----|---------|------|
| **SP1** | Fondations : scaffold, config multi-profil, Security/CORS, Swagger, Actuator, Flyway baseline, exception handling, docker-compose, `.env`, Dockerfile, docs | ✅ **fait** |
| SP2 | 25 entités JPA + relations normalisées + migrations Flyway V3+ + seeders démo | ⏳ |
| SP3 | Auth : JWT access/refresh, OTP email/tel, Spring Security filters, RBAC | ⏳ |
| SP4 | Domaines cœur : users, stores/restaurants/products/categories, orders (CRUD + pagination/tri/recherche/filtres) | ⏳ |
| SP5 | Wallet (5 rôles, commission, cashback, retrait, recharge, reversement) + Cash management (remise, rapprochement, journal, audit) | ⏳ |
| SP6 | Payments modulaires : `PaymentProvider` (OM, Wave, Moov, Visa, MC, Stripe), activation/désactivation | ⏳ |
| SP7 | `LocationProvider` (Maps/Mapbox/OSM, ETA, tracking, zones), `NotificationProvider` (push/SMS/email/WhatsApp/in-app), `MediaProvider` (Local/Cloudinary/S3/MinIO), Chat WebSocket | ⏳ |
| SP8 | Observabilité (health/metrics/logs/tracing/audit), sécurité (rate limiting, headers, CORS, XSS/SQLi), cache Redis, events RabbitMQ | ⏳ |
| SP9 | Tests (unit/API/intégration/sécurité, Testcontainers) + CI/CD GitHub Actions + docs (ERD, guides déploiement/dev) | ⏳ |
| SP10 | Adaptateur Frontend : client API + **fallback mock automatique** (`NEXT_PUBLIC_API_MODE`), sans modifier un seul écran | ⏳ |

## Entités cibles (SP2) — normalisées
`users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `refresh_tokens` (SP1) ·
`stores`, `restaurants`, `products`, `categories`, `orders`, `order_items` ·
`wallets`, `transactions`, `cash_sessions`, `cash_movements` ·
`drivers`, `vehicles`, `providers`, `bookings` ·
`notifications`, `reviews`, `coupons`, `ads`, `subscriptions`, `settings` ·
`countries`, `cities`, `delivery_zones`, `documents`, `kyc`, `media`.

## Ports (cohabitation avec le stack NestJS existant)
| Service | NestJS existant | Spring (nouveau) |
|---|---|---|
| API | 8080 | **8081** |
| PostgreSQL | interne | **5433** |
| Redis | 6379 | **6380** |
| RabbitMQ | — | **5672 / 15672** |
| MinIO | 9000/9001 | **9002/9003** |
