# SP8 — Tests étendus, CI/CD & documentation d'exploitation

**Statut : ✅ Terminé et vérifié**

Sous-phase finale de la Phase 4 (backend Spring de niveau production). Objectif : durcir la
qualité (tests + couverture), automatiser la chaîne (CI/CD) et livrer la documentation
d'exploitation. Aucun changement de comportement d'API — livrables tests / CI / docs uniquement.

## 1. Tests étendus + couverture

- **JaCoCo 0.8.12** ajouté au `pom.xml` (`prepare-agent` + `report` en phase `test`).
- **13 nouveaux tests unitaires** (Mockito / MockMvc mocks, zéro infra) :
  - `WalletServiceTest` — credit, debit (solde insuffisant → `ApiException` 422), wallet gelé,
    cashback (100 bps), `settleOrder` (commission 1000 bps).
  - `GeoMathTest` — haversine (point identique = 0, Bamako→Ségou 180–215 km, mise à l'échelle ETA).
  - `RateLimitFilterTest` — limite atteinte → 429, chemin non-`/auth` non limité.
  - `PaymentProviderRegistryTest` — fournisseur activé résolu, inconnu → 400, désactivé → 409.
- **Total : 34 tests, 0 échec, 0 erreur.** Bundle analysé : 239 classes.
- Couverture (indicative) : ~50 % lignes / ~40 % instructions — cœur métier (wallet, paiements,
  géoloc, sécurité) couvert en priorité.

```
Tests run: 34, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## 2. CI/CD

- **`.github/workflows/ci.yml`** :
  - `build-test` — JDK 21 (Temurin, cache Maven), `mvn -B clean verify`, upload du rapport JaCoCo et du JAR.
  - `docker` — build de l'image (multi-étapes, cache GHA) sur `push`, tags SHA + branche.
- **`Makefile`** — cibles `test`, `coverage`, `verify`, `build`, `run-demo`, `run-dev`,
  `infra-up/down`, `docker-build`, `clean`.
- **`Dockerfile`** (existant, validé) — multi-étapes Maven → JRE 21 Alpine, utilisateur non-root,
  healthcheck sur `/actuator/health`.

## 3. Documentation d'exploitation

- **`docs/OPERATIONS.md`** — runbook : 4 modes d'exécution, tableau des variables d'environnement,
  santé/observabilité (health, prometheus, `X-Request-Id`, Swagger), migrations Flyway & sauvegarde,
  sécurité (JWT, en-têtes, rate-limit **par instance** → migrer vers Redis en cluster), mise à
  l'échelle, opérations courantes, dépannage, CI/CD.
- **`scripts/load-test.js`** — test de charge k6 : montée en charge sur les endpoints publics
  (browse) + parcours authentifié (login mot de passe démo → `/auth/me`). Seuils :
  `http_req_failed < 1 %`, `p95 < 800 ms`.

## 4. Vérification (gate SP8)

| Contrôle | Résultat |
|----------|----------|
| `mvn -o clean test` | ✅ 34/34 verts |
| Rapport JaCoCo généré | ✅ `target/site/jacoco/` |
| `mvn -o clean verify` (SP8 précédent) | ✅ JAR 78 Mo repackagé |
| Mode démo (H2, zéro infra) démarre | ✅ (inchangé, livrables non-runtime) |
| Frontend Next.js — 68 routes | ✅ intactes (aucun fichier FE touché) |
| Endpoints du load-test alignés sur le code | ✅ `/auth/login`, `/auth/me`, browse publics vérifiés |

## 5. Livrables

```
pom.xml                                   (+ jacoco-maven-plugin)
Makefile
.github/workflows/ci.yml
docs/OPERATIONS.md
docs/SP8-REPORT.md
scripts/load-test.js
src/test/java/com/novigo/api/wallet/WalletServiceTest.java
src/test/java/com/novigo/location/GeoMathTest.java
src/test/java/com/novigo/config/RateLimitFilterTest.java
src/test/java/com/novigo/payment/PaymentProviderRegistryTest.java
```

## 6. Suite

**SP9 — Adaptateur Frontend** : client API TypeScript + bascule automatique mock ↔ backend réel via
`NEXT_PUBLIC_API_MODE`, sans modifier les pages/routes existantes. (SP10 optionnel : déploiement.)

---
*Phase 4 — backend Spring de niveau production : SP2 → SP8 terminées. Le backend expose tous les
domaines métier (CRUD, pagination, filtres, recherche, tri, validation, Swagger), avec JWT/RBAC,
wallet/paiements, géoloc, notifications, cache Redis, événements RabbitMQ, observabilité
Prometheus, tests, CI/CD et documentation d'exploitation.*
