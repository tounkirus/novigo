# NOVIGO — Console d'administration (stack complète)

Monorepo exécutable de la brique **console** de NOVIGO : backend NestJS, base
PostgreSQL, dashboard Next.js, supervision Prometheus/Grafana — le tout démarré
d'une commande.

```
┌────────────┐    HTTP /api/v1     ┌────────────┐    Prisma     ┌────────────┐
│  web       │ ──────────────────▶ │  api       │ ────────────▶ │  db        │
│  Next.js   │  (navigateur hôte)  │  NestJS    │               │ PostgreSQL │
│  :3000     │                     │  :8080     │               │  :5432     │
└────────────┘                     └─────┬──────┘               └────────────┘
                                         │ /metrics
                                   ┌─────▼──────┐   scrape   ┌────────────┐
                                   │ prometheus │ ◀───────── │  grafana   │
                                   │  :9090     │            │  :3001     │
                                   └────────────┘            └────────────┘
```

## Démarrage
```bash
cp .env.example .env        # (optionnel) ajuster les secrets
make up                     # build + démarre db, api, web, prometheus, grafana
make seed                   # données de démonstration
```

| Service | URL | Notes |
|---|---|---|
| Dashboard | http://localhost:3000 | login **+22370000000 / admin123** (après `make seed`) |
| API | http://localhost:8080/api/v1 | enveloppe `success`/`data`/`meta` |
| Metrics | http://localhost:8080/metrics | scrappé par Prometheus |
| Prometheus | http://localhost:9090 | règles d'alerte incluses |
| Grafana | http://localhost:3001 | admin / admin — dashboard « API Overview » provisionné |

Autres cibles : `make logs`, `make ps`, `make down`, `make clean`.

## Contenu
```
backend/    API NestJS + Prisma (tranche console) — voir backend/README.md
web/        Dashboard Next.js + suite E2E + contrat OpenAPI — voir web/README.md
infra/monitoring/  Prometheus (scrape api:8080) + provisioning Grafana
docker-compose.yml Orchestration complète
Makefile           Raccourcis (up, seed, down, clean, logs)
```

## Périmètre & limites (rappel honnête)
- La stack couvre la **console d'administration** : ~15 des 125 opérations du contrat
  sont implémentées côté backend (auth, KPIs, commandes+détail/suivi/annulation,
  paiements+réconciliation, livreurs+KYC, utilisateurs, commissions, audit).
- Apps client/livreur/artisan/commerçant, Mobile Money réel, chat, notifications,
  support : **non inclus**. Réconciliation **simplifiée** (dérivée des paiements).
- Extension prévue : mêmes patterns, endpoint par endpoint, au fil des écrans ajoutés.

## Lockfiles
Aucun `package-lock.json` fabriqué (il serait invalide hors registre npm). Versions
épinglées ; générer les locks une fois avec accès réseau :
`(cd backend && npm install) && (cd web && npm install)` puis commit. CI/Docker
basculent alors sur `npm ci`.

## Développement hors Docker
Voir `backend/README.md` (Prisma migrate + seed) et `web/README.md` (Next dev + E2E).
