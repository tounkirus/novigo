# SP4 — API REST métier complète (niveau production) — RAPPORT

**Statut : ✅ TERMINÉ & VÉRIFIÉ** — 2026-07-09

## Objectif
Exposer tous les domaines métier en REST versionné (`/api/v1`) avec CRUD complet,
pagination/tri/recherche/filtres, validation, RBAC, et documentation Swagger/OpenAPI —
sans modifier le Frontend.

## Périmètre livré — 85 chemins, 130 opérations
`56 GET · 34 POST · 12 PUT · 9 PATCH · 19 DELETE`

| Domaine | Base path | Points clés |
|---|---|---|
| Catégories | `/api/v1/categories` | CRUD, recherche, filtre vertical |
| Boutiques / Commerçants | `/api/v1/stores` | CRUD, `slug`, filtres catégorie/statut/ouvert |
| Produits & Menus | `/api/v1/products`, `/stores/{id}/menu` | CRUD, filtres, menu groupé par section |
| Restaurants | `/api/v1/restaurants` | profil 1:1 boutique |
| Commandes | `/api/v1/orders` | création multi-lignes (calcul subtotal/total), `PATCH /status`, assignation livreur, `ref` |
| Coupons | `/api/v1/coupons` | CRUD, filtre actif |
| Avis | `/api/v1/reviews` | publication (authentifié), filtres cible |
| Utilisateurs | `/api/v1/users` | CRUD ADMIN, `PUT /roles`, recherche |
| Livreurs / Véhicules | `/api/v1/drivers`, `/vehicles` | CRUD, `PATCH /location`, KYC/dispo |
| Prestataires | `/api/v1/providers` | CRUD, recherche vertical/ville |
| Réservations | `/api/v1/bookings` | création, `PATCH /status`, `ref` |
| Wallet | `/api/v1/wallets` | `credit`/`debit` (transaction + solde), historique, gel |
| Caisse (Cash) | `/api/v1/cash/sessions` | ouverture, mouvements, clôture + rapprochement (écart) |
| Notifications | `/api/v1/notifications` | liste, non-lus, `read`/`read-all`, envoi ADMIN |
| Favoris | `/api/v1/favorites` | ajout idempotent, liste, retrait (entité + `V5`) |
| Publicités | `/api/v1/ads` | bannières actives (public) + CRUD ADMIN |
| Paramètres | `/api/v1/settings` | lecture publique, upsert ADMIN |
| Médiathèque | `/api/v1/media` | enregistrement/liste par propriétaire |
| KYC | `/api/v1/kyc` | soumission, revue ADMIN |
| Documents | `/api/v1/documents` | téléversement, validation ADMIN |
| Abonnements | `/api/v1/subscriptions` | souscription, annulation |
| Géo | `/api/v1/geo/{countries,cities,zones}` | référentiel public + création ADMIN |
| Analytics / Dashboard | `/api/v1/analytics` | overview (compteurs, revenu, répartition, top boutiques) |

## Architecture & bonnes pratiques
- **Couches** : Controller → Service → Repository → Entity, DTO (records) + validation Jakarta.
- **Mapping** : MapStruct (`Category`, `Store`, `Product`, `Order` — extraction des `*Id` de relations) ;
  mapping manuel pour les domaines simples.
- **Pagination/tri** : `Pageable` (`?page&size&sort`) + enveloppe `PageResponse` standard.
- **Recherche/filtres** : `JpaSpecificationExecutor` + helper `Specs` (like/eq/search multi-champs/joinEq).
- **RBAC** : `@PreAuthorize` par opération ; **GET vitrine public** (catalogue, prestataires, avis, ads,
  settings, géo) via `SecurityConfig`, écritures protégées.
- **Erreurs** : `GlobalExceptionHandler` (404/409/400/401/403/422 normalisés en `ApiError`).
- **Swagger** : `@Tag`/`@Operation` sur tous les contrôleurs, exposés dans `/v3/api-docs` & `/swagger-ui`.

## Portail de vérification (gate SP4)

| Contrôle | Résultat |
|---|---|
| `mvn -o clean test` | ✅ **9/9** (dont `Sp4EndpointsTest` : 4 tests d'intégration bout-en-bout) |
| Boot **demo** (H2) | ✅ **31 repositories**, contexte complet chargé |
| Vitrine publique (GET sans jeton) | ✅ categories/stores/products/restaurants/providers/reviews/ads/settings/geo → **200** |
| Endpoints protégés sans jeton | ✅ users/wallets/drivers/analytics/notifications/favorites → **401** |
| CRUD ADMIN | ✅ création catégorie/boutique/produit → **201**, menu → **200** |
| RBAC | ✅ CLIENT→create catégorie **403**, ADMIN **201/200** |
| Pagination/tri | ✅ `?size&sort=name,desc`, enveloppe `content/totalElements/...` |
| Analytics overview | ✅ compteurs + revenu **6000** + répartition + top boutiques |
| Wallet | ✅ crédit 60000, débit 57000, surdébit → **422**, historique 2 tx |
| Caisse | ✅ ouverture → mouvement +12000 → clôture, **écart = 0** |
| Boot **dev** (Postgres 16) | ✅ Flyway **V5 (favorites)** appliquée ; register + RBAC 403 + favori persisté |
| **Frontend intact** | ✅ 68 pages ; 21/21 routes échantillon (6 portails) → **200** |

### Contraintes respectées
- ❌ Aucune modification du Frontend. ❌ Aucune donnée démo supprimée. ❌ Aucune route FE cassée.

## Corrections automatiques appliquées
- `OrderItemCreate.unitPrice` : `@Positive` → `@PositiveOrZero` (prix dérivé du produit quand omis → évitait un 400).
- `WalletRepository` / `CashSessionRepository` : ajout `JpaSpecificationExecutor` (filtrage).
- Test d'intégration : `SimpleClientHttpRequestFactory.setOutputStreaming(false)` + sonde 401 via GET protégé
  (contournement du retry d'auth `HttpURLConnection` sur POST).

## Suite — SP5
Wallet/Cash avancés (commission, cashback, retrait, reversement inter-rôles) et
providers de paiement modulaires (Orange Money, Wave, Moov, Stripe…) activables/désactivables.
