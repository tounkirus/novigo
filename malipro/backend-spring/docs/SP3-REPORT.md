# SP3 — Authentification (JWT + Refresh + OTP + RBAC) — RAPPORT

**Statut : ✅ TERMINÉ & VÉRIFIÉ** — 2026-07-09

## Objectif
Sécuriser l'API : JWT (access + refresh avec rotation), connexion par mot de passe
et par OTP (email/SMS), verrouillage Spring Security et RBAC par rôle — sans toucher au Frontend.

## Livrables

### Module `com.novigo.auth`
| Fichier | Rôle |
|---|---|
| `JwtService` | Émission/validation JWT HS256, 2 clés distinctes (access court / refresh long) |
| `Hashing` | SHA-256 hex — hachage des refresh tokens et codes OTP (jamais en clair) |
| `AuthPrincipal` | Identité portée par le `SecurityContext` (userId, email, roles) |
| `JwtAuthFilter` | `OncePerRequestFilter` : Bearer → validation → authorities `ROLE_*` |
| `AuthService` | register / login / refresh (rotation) / logout / me / OTP request+verify |
| `AuthController` | `POST /api/v1/auth/{register,login,otp/request,otp/verify,refresh,logout}` + `GET /me` |
| `otp/OtpService` | Génération (SecureRandom), persistance `OtpChallenge`, vérif (expiration, tentatives) |
| `otp/OtpSender` + `LogOtpSender` | Abstraction d'envoi (vrai provider SMS/Email en SP7) |
| `dto/AuthDtos` | Records + validation (`@NotBlank`, `@Email`, `@Size`) |

### Identité / persistance
- `OtpChallenge` + `OtpChallengeRepository` ; migration Flyway **`V4__auth_otp.sql`** (table `otp_challenges`).
- Réutilise `RefreshToken` (SP1) : hash stocké, révocation, rotation.

### Sécurité
- `SecurityConfig` : `@EnableMethodSecurity`, filtre JWT, `authenticationEntryPoint` → **401**.
  Public : `/api/v1/auth/**`, `/health`, `/info`, `/actuator/**`, doc, H2. Reste `/api/**` → **authenticated**.
- `AccountController` : `/account/ping` (authenticated) et `/admin/ping` (`@PreAuthorize hasAnyRole('ADMIN','SUPER_ADMIN')`).
- `GlobalExceptionHandler` étendu : `ResponseStatusException`→statut réel, `AccessDeniedException`→**403**,
  `HttpMessageNotReadableException`/`IllegalArgumentException`→**400**.
- `NovigoProperties.Otp` (length 6, ttl 10 min, maxAttempts 5) + `isOtpDebugMode()` (code exposé hors prod/preprod).

## Portail de vérification (gate SP3)

| Contrôle | Résultat |
|---|---|
| `mvn -o clean test` | ✅ **5/5** (dont `JwtServiceTest` : round-trip access/refresh, clé refusée, hash) |
| Boot **demo** (H2) | ✅ démarre, 4 users seedés (client/merchant/admin/superadmin @novigo.ml `123456`) |
| Endpoint protégé sans jeton | ✅ `/account/ping` → **401** |
| Login `client@novigo.ml`/`123456` | ✅ access+refresh émis ; `/auth/me` → **200** |
| Login corps vide / mauvais mdp | ✅ **400** / **401** |
| RBAC : client → `/admin/ping` | ✅ **403** ; admin → `/admin/ping` → **200** |
| OTP request (SMS) | ✅ `devCode` renvoyé (mode démo), `otp_challenges` persisté |
| OTP verify (auto-inscription) | ✅ user CLIENT créé, tokens émis ; code erroné → **400** |
| Refresh (rotation) | ✅ nouvelle paire ; **ancien refresh réutilisé → 401** (révoqué) |
| Duplicate register | ✅ **409** |
| OpenAPI | ✅ 7 chemins `/api/v1/auth/*` exposés dans `/v3/api-docs` |
| Boot **dev** (Postgres 16) | ✅ Flyway **V4** appliquée ; register/login/me OK sur Postgres |
| **Frontend intact** | ✅ 68 pages ; 19/19 routes échantillon (6 portails) → **200** |

### Contraintes respectées
- ❌ Aucune modification du Frontend (écrits SP3 sous `backend-spring/` uniquement).
- ❌ Aucune donnée démo supprimée. ❌ Aucune route FE cassée.

## Corrections automatiques appliquées
- `@RestControllerAdvice` catch-all `Exception` transformait `ResponseStatusException` (401/409) et
  `AccessDeniedException` (403) en **500** → ajout de handlers dédiés (401/403/409/400 corrects).
- Collision d'import évitée (aucune ici) ; `HttpStatus` inutilisé retiré de `SecurityConfig`.

## Suite — SP4
Domaines métier exposés en REST (users, stores, products, orders, providers, bookings…) :
Controller/DTO/Mapper (MapStruct)/Service, pagination/tri/filtres, protégés par RBAC désormais actif.
