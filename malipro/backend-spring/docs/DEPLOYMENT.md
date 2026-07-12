# NOVIGO — Déploiement (full-stack)

Trois façons de faire tourner NOVIGO, de la plus simple à la plus complète.

## A. Démo autonome (zéro infra)

Backend en mémoire (H2) + frontend en mock. Rien à installer d'autre que Java 21 et Node 20.

```bash
# Backend (:8081, profil demo, catalogue seedé en mémoire)
cd backend-spring && java -jar target/novigo-api.jar --spring.profiles.active=demo
# Frontend (:5173, mode mock — défaut)
cd client-web && npm run dev
```

## B. Full-stack conteneurisé (recommandé pour une démo « réelle »)

Un seul compose orchestre : Postgres + Redis + RabbitMQ + API Spring (profil `prod`) + frontend
Next.js (mode **live**). Le catalogue Postgres est peuplé par la migration Flyway
`V8__seed_demo_catalog.sql` (12 boutiques, ~40 produits, 7 catégories — Bamako).

```bash
cd backend-spring
docker compose -f docker-compose.stack.yml up -d --build
```

| Service | URL |
|---------|-----|
| Frontend (live) | http://localhost:3000 |
| API | http://localhost:8081 |
| Swagger | http://localhost:8081/swagger-ui.html |
| RabbitMQ console | http://localhost:15672 (novigo / novigo) |

Arrêt : `docker compose -f docker-compose.stack.yml down` (ajouter `-v` pour purger la base).

### Points d'attention
- Le frontend appelle l'API **depuis le navigateur** : `NEXT_PUBLIC_API_BASE_URL` pointe sur l'hôte
  mappé (`http://localhost:8081/api/v1`), pas sur le nom de service Docker. `CORS_ORIGINS` autorise
  `http://localhost:3000`.
- `NEXT_PUBLIC_API_*` sont des variables **de build** (inlinées par Next.js) → passées en `args` du
  service `web`. Changer de cible = rebuild du frontend.
- **Repli automatique** : si l'API est indisponible, le frontend retombe sur le mock (aucune page cassée).
- Secrets JWT : surcharger `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (≥ 32 octets) via l'environnement
  ou un fichier `.env` à côté du compose.

## C. Frontend live contre un backend local (sans conteneuriser le web)

```bash
cd backend-spring && make infra-up          # Postgres + Redis + RabbitMQ
java -jar target/novigo-api.jar --spring.profiles.active=dev
# autre terminal
cd client-web && NEXT_PUBLIC_API_MODE=live npm run dev
```

## Bascule mock ↔ live (rappel)

| Variable | Défaut | Effet |
|----------|--------|-------|
| `NEXT_PUBLIC_API_MODE` | `mock` | `live` = branche l'API Spring (repli mock auto) |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8081/api/v1` | URL de l'API (mode live) |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | `6000` | Délai avant repli mock |

Voir aussi `docs/OPERATIONS.md` (runbook backend) et `client-web/docs` (SP9 — adaptateur).

## Comptes de démonstration (mot de passe `123456`)

`client@novigo.ml` · `merchant@novigo.ml` · `admin@novigo.ml` · `superadmin@novigo.ml`
(profil demo). En profil Postgres, les rôles sont seedés (Flyway V2) ; créer les comptes via
`POST /api/v1/auth/register` ou un seed dédié.
