# NOVIGO Backend — Guide d'exploitation (Runbook)

Backend Spring Boot 3 / Java 21 — API sur le port **8081**, indépendante du stack NestJS.

## 1. Modes d'exécution

| Mode | Profil | Infra requise | Usage |
|------|--------|---------------|-------|
| **Démo** | `demo` | Aucune (H2 en mémoire) | Démonstration, tests, CI — `java -jar novigo-api.jar` |
| **Développement** | `dev` | Postgres 5433 + Redis 6380 + RabbitMQ 5672 (docker-compose) | Développement local |
| **Préproduction** | `preprod` | Infra dédiée, secrets injectés | Recette |
| **Production** | `prod` | Infra managée, secrets via coffre | Exploitation |

```bash
# Démo (zéro infra)
java -jar target/novigo-api.jar --spring.profiles.active=demo
# Dev (démarrer l'infra d'abord)
make infra-up && java -jar target/novigo-api.jar --spring.profiles.active=dev
```

## 2. Variables d'environnement clés

| Variable | Défaut | Description |
|----------|--------|-------------|
| `SPRING_PROFILES_ACTIVE` | `demo` | Profil actif |
| `SERVER_PORT` | `8081` | Port HTTP |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | *(à surcharger)* | Secrets HS256 (**≥ 32 octets**, obligatoires en prod) |
| `JWT_ACCESS_TTL_MIN` / `JWT_REFRESH_TTL_DAYS` | `15` / `30` | Durées de vie des jetons |
| `DB_URL` / `DB_USER` / `DB_PASSWORD` | — | Datasource Postgres (dev/preprod/prod) |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6380` | Cache Redis |
| `RABBITMQ_HOST` / `RABBITMQ_PORT` / `RABBITMQ_USER` / `RABBITMQ_PASSWORD` | — | Bus d'événements |
| `CORS_ORIGINS` | `localhost:5173,3000,5000` | Origines Frontend autorisées |
| `NOVIGO_SECURITY_AUTH_REQUESTS_PER_MINUTE` | `60` | Limite de débit sur `/auth/**` |
| `NOVIGO_LOCATION_PROVIDER` | `OSM` | Fournisseur géoloc actif (OSM/GOOGLE/MAPBOX) |
| `NOVIGO_STORAGE_PROVIDER` | `LOCAL` | Fournisseur stockage actif (LOCAL/CLOUDINARY/S3/MINIO) |
| `NOVIGO_PAYMENTS_COMMISSION_BPS` / `NOVIGO_PAYMENTS_CASHBACK_BPS` | `1000` / `100` | Commission (10 %) / cashback (1 %) |

## 3. Santé & observabilité

- **Liveness/Readiness** : `GET /actuator/health` (public), groupes `liveness` / `readiness` pour Kubernetes.
- **Métriques Prometheus** : `GET /actuator/prometheus` (public) — inclut compteurs métier
  `novigo_orders_total`, `novigo_payments_confirmed_total`, `novigo_notifications_dispatched_total`.
- **Autres endpoints Actuator** : réservés aux rôles `ADMIN`/`SUPER_ADMIN`.
- **Traçabilité** : chaque requête porte un `X-Request-Id` (généré ou repris), présent dans tous les logs (`[requestId]`).
- **Swagger/OpenAPI** : `GET /swagger-ui.html` et `GET /v3/api-docs`.

## 4. Base de données & migrations

- Schéma géré par **Flyway** (`src/main/resources/db/migration/V1..V7`). `ddl-auto=none` en dev/preprod/prod
  (Flyway est la source de vérité) ; H2 `update` en démo.
- **Ne jamais éditer une migration appliquée** : créer un nouveau `V{n+1}__*.sql`.
- Sauvegarde : `pg_dump` régulier de la base Postgres. Restauration testée avant montée de version.

## 5. Sécurité

- API **stateless** (JWT). Rotation des refresh tokens à chaque `/auth/refresh` (l'ancien est révoqué).
- En-têtes durcis : HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`.
- Limitation de débit sur `/auth/**` : **en mémoire par instance**. En cluster multi-instances,
  migrer vers un compteur Redis partagé (point d'extension `RateLimitFilter`).
- Secrets : jamais commités ; injectés par l'environnement / coffre en preprod/prod.

## 6. Mise à l'échelle

- L'API est **stateless** → scalable horizontalement derrière un load balancer.
- Cache **Redis** partagé entre instances (dev/preprod/prod).
- Événements **RabbitMQ** (échange topic `novigo.events`) : ajouter des consommateurs pour les effets
  asynchrones (push, réconciliation) sans coupler l'API.
- Sessions WebSocket (chat) : broker simple in-memory ; pour le multi-instance, activer un relais STOMP externe.

## 7. Opérations courantes

- **Activer/désactiver un moyen de paiement** : `PATCH /api/v1/payments/providers/{code}?enabled=false` (ADMIN)
  — évince le cache `paymentProviders` automatiquement.
- **Changer le fournisseur géoloc/stockage** : variable d'env `NOVIGO_LOCATION_PROVIDER` / `NOVIGO_STORAGE_PROVIDER` + redéploiement.
- **Diffuser une notification** : `POST /api/v1/notifications/dispatch` (ADMIN).

## 8. Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| `/actuator/health` 503 au démarrage | Readiness pas encore ACCEPTING | Attendre quelques secondes (probe) |
| Boot échoue en dev | Infra absente | `make infra-up`, vérifier ports 5433/6380/5672 |
| `401` sur endpoints protégés | Jeton absent/expiré | Rafraîchir via `/auth/refresh` |
| `429` sur `/auth` | Limite de débit atteinte | Attendre 1 min ou augmenter `AUTH_REQUESTS_PER_MINUTE` |
| Cache non rafraîchi | TTL Redis (10 min) | Attendre l'expiration ou évincer via l'opération dédiée |

## 9. CI/CD

- Pipeline : `.github/workflows/ci.yml` — `mvn -B clean verify` (tests + couverture JaCoCo) puis build image Docker.
- Image : `Dockerfile` multi-étapes (Maven → JRE 21 Alpine, utilisateur non-root, healthcheck).
- Test de charge : `scripts/load-test.js` (k6) — voir en-tête du script.
