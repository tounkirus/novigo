# SP7 — Observabilité, Sécurité durcie, Redis, RabbitMQ — RAPPORT

**Statut : ✅ TERMINÉ & VÉRIFIÉ** — 2026-07-09

## Objectif
Rendre la plateforme exploitable en production : métriques/traçabilité, durcissement sécurité,
cache Redis et bus d'événements RabbitMQ — **le mode démo reste 100 % autonome (zéro infra)**.

## Livrables

### 1. Observabilité (`com.novigo.observability`)
- **`AppMetrics`** : compteurs Micrometer métier (`novigo.orders.created`, `payments.initiated`,
  `payments.confirmed`, `notifications.dispatched`) instrumentés dans les services.
- **`RequestIdFilter`** : identifiant de corrélation `X-Request-Id` par requête, propagé au **MDC** (logs) et renvoyé au client.
- **`logback-spring.xml`** : pattern console avec `[%X{requestId}]`.
- Actuator : `/actuator/{health,info,prometheus}` exposés ; **`/actuator/prometheus`** publie JVM + compteurs métier.

### 2. Sécurité durcie (`com.novigo.config`)
- **En-têtes** : HSTS (1 an, includeSubDomains), `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`.
- **`RateLimitFilter`** : limitation de débit par IP sur `/api/v1/auth/**` (fenêtre fixe/minute, en-têtes `X-RateLimit-*`, **429** au dépassement).
- **Actuator verrouillé** : `health`/`info`/`prometheus` publics ; tout le reste réservé **ADMIN** ; endpoints non exposés → **404** (handler dédié).

### 3. Cache Redis (`CacheConfig`)
- `@EnableCaching` ; `CacheManager` auto-configuré par profil : **`simple`** (ConcurrentMap) en démo, **`redis`** en dev/préprod/prod.
- Sérialisation **JSON** + TTL 10 min en mode Redis (`RedisCacheManagerBuilderCustomizer`).
- `@Cacheable` sur les données de référence (`paymentProviders`, `locationProviders`), `@CacheEvict` sur `toggleProvider`.

### 4. Bus d'événements RabbitMQ (`com.novigo.event`)
- **`DomainEventPublisher`** (interface) : `LocalDomainEventPublisher` (démo, journalise) / `RabbitDomainEventPublisher` (dev/prod).
- **`RabbitConfig`** (profils infra) : échange topic `novigo.events`, file `novigo.events.queue`, binding `#`, converter JSON.
- **`DomainEventListener`** : consomme et journalise (point d'extension asynchrone).
- Événements publiés : `payment.confirmed`, `notification.dispatched`.
- Démo : `RabbitAutoConfiguration` exclue → **aucune dépendance messagerie**.

## Portail de vérification (gate SP7)

| Contrôle | Résultat |
|---|---|
| `mvn -o clean test` | ✅ **21/21** (dont `Sp7ObservabilityTest` : santé, métrique métier via MeterRegistry, en-têtes rate-limit, actuator protégé) |
| Boot **demo** (H2, zéro infra) | ✅ démarre (Rabbit exclu, cache simple) |
| Actuator | ✅ `/health` **200 UP**, `/prometheus` **200** (JVM + `novigo_orders_total`…) ; `/actuator/beans` sans jeton **401**, exposé-non → **404** |
| En-têtes sécurité | ✅ HSTS, `nosniff`, `Referrer-Policy`, `X-Request-Id` présents |
| Rate limit | ✅ limite=10 → 10×400 puis **429** ; en-têtes `X-RateLimit-*` |
| Corrélation | ✅ `requestId` visible dans chaque ligne de log |
| Cache (démo) | ✅ providers servis via cache mémoire |
| Boot **dev** (Postgres + **Redis** + **RabbitMQ**) | ✅ démarre |
| **Redis** | ✅ clés `paymentProviders::false`, `locationProviders::…` présentes (sérialisation JSON) |
| **RabbitMQ** | ✅ `payment.confirmed` **publié ET consommé** (`[EVENT⇐RabbitMQ]`) de bout en bout |
| **Frontend intact** | ✅ 68 pages ; 20/20 routes échantillon → **200** |

### Contraintes respectées
- ❌ Aucune modification du Frontend. ❌ Aucune donnée démo supprimée. ❌ Aucune route FE cassée.
- ✅ Mode démo toujours **100 % autonome** (ni Redis ni RabbitMQ requis).

## Corrections automatiques appliquées
- `NoResourceFoundException` (endpoint non exposé / ressource absente) → mappé en **404** (au lieu de 500).
- Endpoint Prometheus non enregistré dans le contexte de test @SpringBootTest (particularité connue) →
  métrique métier vérifiée via le bean `MeterRegistry` ; le scrape HTTP est validé sur le jar live (200).

## Suite — SP8
Tests étendus (couverture, tests de charge), CI/CD (pipeline build+test+image),
documentation d'exploitation, puis SP9 adaptateur Frontend (client API + fallback mock automatique).
