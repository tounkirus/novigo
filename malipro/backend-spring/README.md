# NOVIGO — Backend Spring Boot (`novigo-api`)

Backend de production de la Super App **NOVIGO**, construit en **Spring Boot 3.3 / Java 21**.
Coexiste avec le backend NestJS existant (`../backend`, port 8080) : cette API écoute sur **8081**
et utilise une infra dédiée (ports décalés) pour ne rien casser.

> ⚠️ Le Frontend Next.js (`../client-web`) **n'est pas modifié**. Il continue de fonctionner en
> **mode démo (mock)**. Le branchement Frontend → API se fera via un adaptateur à fallback (SP10),
> voir [`docs/MIGRATION-MOCK-TO-BACKEND.md`](docs/MIGRATION-MOCK-TO-BACKEND.md).

## Modes d'exécution (profils Spring)

| Profil | Base de données | Infra requise | Usage |
|---|---|---|---|
| `demo` (défaut) | H2 en mémoire | **aucune** | Démo/onboarding — lance l'API seule |
| `dev` | PostgreSQL `:5433` | docker-compose local | Développement |
| `preprod` | PostgreSQL (env) | dédiée | Préproduction |
| `prod` | PostgreSQL (env) | dédiée | Production |

## Démarrage rapide

### Mode démo (zéro dépendance)
```bash
mvn spring-boot:run                      # profil demo par défaut
# ou
java -jar target/novigo-api.jar
```

### Mode dev (infra Docker)
```bash
docker compose up -d db redis rabbitmq minio   # infra
export SPRING_PROFILES_ACTIVE=dev
mvn spring-boot:run
```

### Tout en Docker
```bash
docker compose up -d --build              # infra + API (profil prod)
```

## Points d'entrée

| URL | Description |
|---|---|
| `http://localhost:8081/api/v1/health` | Santé (léger) |
| `http://localhost:8081/api/v1/info` | Version & mode |
| `http://localhost:8081/actuator/health` | Santé détaillée (liveness/readiness) |
| `http://localhost:8081/actuator/prometheus` | Métriques Prometheus |
| `http://localhost:8081/swagger-ui.html` | **Swagger UI** |
| `http://localhost:8081/v3/api-docs` | Spec OpenAPI |

## Build & tests
```bash
mvn clean test          # compile + tests unitaires
mvn -DskipTests package # jar exécutable → target/novigo-api.jar
```

## Stack technique
Spring Boot 3.3 · Java 21 · Spring Web / Security / Data JPA / Validation / Actuator ·
PostgreSQL + Flyway · Redis · RabbitMQ (AMQP) · WebSocket · MapStruct · Lombok ·
springdoc-openapi (Swagger) · JJWT · Micrometer/Prometheus · Docker.

## Structure
```
src/main/java/com/novigo
├─ NovigoApplication.java     Point d'entrée
├─ config/                     Security, CORS, OpenAPI, propriétés
├─ common/                     api (PageResponse, ApiError), exception (handler global)
└─ web/                        Controllers (InfoController pour l'instant)
src/main/resources
├─ application.yml + application-{demo,dev,preprod,prod}.yml
└─ db/migration/               Flyway (V1 identité, V2 seed rôles)
```

## Feuille de route (Phase 4)
Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — SP1 (fondations, ✅) → SP2 (entités/migrations) →
SP3 (auth JWT/OTP/RBAC) → SP4 (domaines) → SP5 (wallet/cash) → SP6 (payments) →
SP7 (location/notif/media/chat) → SP8 (observabilité/sécurité/Redis/RabbitMQ) → SP9 (tests/CI-CD) →
SP10 (adaptateur Frontend + fallback mock).
