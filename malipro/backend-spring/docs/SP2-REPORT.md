# SP2 — Modèle de données (Data Model) — RAPPORT

**Statut : ✅ TERMINÉ & VÉRIFIÉ** — 2026-07-09

## Objectif
Poser le modèle de domaine complet (entités JPA + repositories + migrations Flyway)
sur les fondations SP1, sans toucher au Frontend ni aux données de démonstration.

## Livrables

### 1. Entités JPA (20 entités métier + 2 classes de base)
| Domaine | Package | Entités |
|---|---|---|
| Common | `domain.common` | `BaseEntity`, `AuditedEntity` (déjà SP1/étendues) |
| Identité | `domain.identity` | `User`, `Role`, `Permission`, `RefreshToken` (SP1) |
| Géo | `domain.geo` | `Country`, `City`, `DeliveryZone` |
| Catalogue | `domain.catalog` | `Category`, `Store`, `Restaurant`, `Product` |
| Commerce | `domain.commerce` | `Order`, `OrderItem`, `Coupon`, `Review` |
| Logistique | `domain.logistics` | `Driver`, `Vehicle` |
| Wallet | `domain.wallet` | `Wallet`, `Transaction` |
| Cash | `domain.cash` | `CashSession`, `CashMovement` |
| Services à domicile | `domain.services` | `Provider`, `Booking` |
| Plateforme | `domain.platform` | `Notification`, `Ad`, `Subscription`, `Setting`, `Document`, `Kyc`, `Media` |

- PK `uuid` via `@GeneratedValue(strategy = UUID)` ; `created_at`/`updated_at` via `@CreationTimestamp`/`@UpdateTimestamp`.
- FKs en `@ManyToOne(LAZY)` / `@OneToOne(LAZY)` ; montants en `long` (entier XOF) ; notes en `numeric(3,2)`.

### 2. Repositories Spring Data (27 interfaces détectées au boot)
Un repository par agrégat racine, avec finders paginés (`Page<T> findByXId(UUID, Pageable)`)
et lookups métier (`findBySlug`, `findByRef`, `findByCode`, `findByOwnerId`, `countByUserIdAndReadFalse`, …).

### 3. Migration Flyway `V3__domain_model.sql`
- 30 tables métier + index sur toutes les FKs et colonnes de filtre.
- SQL Postgres 16 natif (`gen_random_uuid()`, `timestamptz`, `numeric`, `double precision`).

### 4. Seeder démo `bootstrap/DemoSeeder` (`@Profile("demo")`)
Amorçage idempotent sous H2 : 6 rôles, 2 users (client@/merchant@novigo.ml, mdp `123456`),
Mali/Bamako, 3 catégories, 1 store + 2 produits, 1 wallet, 1 commande à 2 lignes.

## Portail de vérification (gate SP2)

| Contrôle | Commande | Résultat |
|---|---|---|
| Compilation | `mvn -o clean compile` | ✅ BUILD SUCCESS |
| Tests | `mvn -o clean test` | ✅ 1/1 (0 échec, 0 erreur) |
| Packaging | `mvn -o package` | ✅ `novigo-api.jar` (78 Mo) |
| Boot **demo** (H2, zéro infra) | `--spring.profiles.active=demo` | ✅ **27 JPA repositories** trouvées ; seeder OK (6 rôles, 2 users, 1 store, 2 produits, 1 order, 1 wallet) |
| Endpoints demo | curl | ✅ `/api/v1/health` `/api/v1/info` `/actuator/health` `/v3/api-docs` `/swagger-ui` → **200** |
| Boot **dev** (Postgres 16 Docker) | `--spring.profiles.active=dev` | ✅ Flyway **V1→V2→V3** appliquées (3 migrations, 0.315 s) |
| Schéma Postgres | `psql \dt` | ✅ **33 tables** (32 métier + `flyway_schema_history`) |
| Seed rôles V2 | `select code from roles` | ✅ ADMIN, CLIENT, DRIVER, MERCHANT, PROVIDER, SUPER_ADMIN |
| **Frontend intact** | probe `:5173` | ✅ **68 pages** ; 22/22 routes échantillonnées (6 portails) → **200** |

### Contraintes respectées
- ❌ Aucune modification du Frontend (tous les écrits SP2 sous `backend-spring/`).
- ❌ Aucune suppression de données de démonstration (mock FE inchangé).
- ❌ Aucune route cassée (68 pages toujours servies).

## Corrections automatiques appliquées
- **Collision de noms** `org.springframework.core.annotation.Order` ↔ entité `commerce.Order`
  dans `DemoSeeder` → suppression de l'annotation `@Order` (superflue). Recompilé ✅.

## Suite — SP3
Auth JWT (access/refresh) + Spring Security lockdown + OTP (email/phone) + RBAC appliqué
aux endpoints, sur la base des entités identité/rôles/permissions désormais complètes.
