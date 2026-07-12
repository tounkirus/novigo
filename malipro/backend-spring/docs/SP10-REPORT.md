# SP10 — Déploiement full-stack (backend + frontend live)

**Statut : ✅ Terminé et vérifié**

Objectif : rendre NOVIGO **déployable en un compose**, avec le frontend Next.js branché sur le vrai
backend Spring et un catalogue **peuplé** (le profil `prod`/`dev` sur Postgres n'exécute pas
`DemoSeeder`). Aucune page/route FE modifiée.

## 1. Livrables

```
backend-spring/
  src/main/resources/db/migration/V8__seed_demo_catalog.sql   seed catalogue (Postgres)
  docker-compose.stack.yml                                     infra + api + web (mode live)
  docs/DEPLOYMENT.md                                           3 scénarios (démo / full-stack / hybride)
  docs/SP10-REPORT.md
client-web/
  next.config.mjs         output: "standalone"
  Dockerfile              multi-étapes Node 20 alpine, runner non-root, server.js
  .dockerignore
```

## 2. Seed catalogue (`V8__seed_demo_catalog.sql`)

Idempotent (`ON CONFLICT DO NOTHING`), retirable pour un vrai environnement. Peuple :
- **Mali + Bamako** (countries/cities),
- **7 catégories** avec codes alignés sur l'enum `StoreCategory` du front (mapping propre, sans perte),
- **12 boutiques** réalistes de Bamako réparties sur toutes les catégories (restaurants, supermarchés,
  pharmacies, boulangeries, boucherie, marché, boutique) — districts, notes, frais/temps de livraison,
  images picsum déterministes,
- **26 produits** rattachés par slug, avec sections de menu, prix FCFA, best-seller/nouveautés.

## 3. Déploiement (`docker-compose.stack.yml`)

Un seul fichier orchestre **Postgres + Redis + RabbitMQ + API (profil prod) + frontend (mode live)**.
Points clés :
- Le frontend appelle l'API **depuis le navigateur** → `NEXT_PUBLIC_API_BASE_URL=http://localhost:8081/api/v1`
  (hôte mappé, pas le nom de service) ; `CORS_ORIGINS` autorise `http://localhost:3000`.
- `NEXT_PUBLIC_API_*` inlinées au **build** → passées en `args` du service `web`.
- Frontend en image **standalone** (`output: "standalone"`, serveur Node embarqué, utilisateur non-root).
- Repli mock automatique conservé : API indisponible ⇒ le front ne casse pas.

```bash
cd backend-spring && docker compose -f docker-compose.stack.yml up -d --build
# Frontend :3000 · API :8081 · Swagger :8081/swagger-ui.html
```

## 4. Vérification (gate SP10)

| Contrôle | Résultat |
|----------|----------|
| `mvn -o clean test` (avec V8) | ✅ **34/34** |
| Boot API profil **dev** (Postgres) + Flyway V8 | ✅ appliqué |
| `GET /categories` | ✅ **7** catégories |
| `GET /stores` | ✅ **12** boutiques, toutes catégories, notes/frais corrects |
| `GET /products` | ✅ **26** produits |
| `GET /stores/slug/le-bafing` + `/menu` | ✅ boutique + menu groupé (Plats/Boissons) |
| `GET /stores?q=` / `GET /products?q=yassa` | ✅ recherche OK (Poulet Yassa) |
| `client-web` build **standalone + live** | ✅ Compiled, 65 pages, `.next/standalone/server.js` produit |
| `docker compose -f docker-compose.stack.yml config` | ✅ VALID |
| Endpoints live = ceux consommés par l'adaptateur SP9 | ✅ formes conformes aux mappers |

## 5. Bilan Phase 4 (production architecture)

| Sous-phase | Objet |
|-----------|-------|
| SP1 | Scaffold Maven, sécurité, Flyway, Docker, docs |
| SP2 | 24 entités / 38 tables |
| SP3 | Auth JWT + OTP + RBAC |
| SP4 | ~85 chemins REST (CRUD/pagination/filtres/Swagger) |
| SP5 | Paiements modulaires + wallet/finance |
| SP6 | Géoloc / notifications / chat WS / stockage (SPI) |
| SP7 | Observabilité Prometheus + Redis cache + RabbitMQ + rate-limit |
| SP8 | Tests étendus + JaCoCo + CI/CD + doc d'exploitation |
| SP9 | Adaptateur FE (client API + repli mock auto) |
| **SP10** | **Déploiement full-stack + seed catalogue** |

Le frontend et le NestJS existant n'ont jamais été altérés dans leurs pages/routes ; la démo reste
100 % autonome (zéro infra). NOVIGO est désormais exploitable en production : mock pour la démo,
live conteneurisé pour un déploiement réel.
