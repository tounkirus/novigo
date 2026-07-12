# NOVIGO — Console d'administration

Dépôt unique et déployable de la console opérateur de la super app **NOVIGO** :
dashboard Next.js branché sur le contrat OpenAPI, suite E2E, stack de supervision,
conteneurisation et CI/CD.

Stack : **Next.js 14 (App Router) · TypeScript · TailwindCSS · TanStack Query · Playwright · Prometheus/Grafana · Docker**.

---

## 1. Périmètre fonctionnel

| Module | Route | Endpoints contrat |
|---|---|---|
| Tableau de bord (KPIs + dernières commandes) | `/dashboard` | `/analytics/kpis`, `/admin/orders` |
| Commandes + détail/suivi + annulation | `/orders`, `/orders/[id]` | `/admin/orders`, `/orders/{id}`, `/orders/{id}/tracking`, `/orders/{id}/cancel` |
| Paiements | `/payments` | `/admin/payments` |
| Réconciliation opérateurs | `/payments/reconciliation` | `/payments/reconciliation` |
| Livreurs + validation KYC | `/drivers`, `/drivers/[id]` | `/admin/drivers`, `/admin/drivers/{id}`, `/drivers/{id}/validate` |
| Utilisateurs | `/users` | `/admin/users` |
| Commissions | `/commissions` | `/admin/commissions` |
| Audit | `/audit` | `/admin/audit-logs` |
| Authentification | `/login` | `/auth/login`, `/auth/refresh-token`, `/users/me`, `/auth/logout` |

Design : émeraude / or / noir / blanc, chiffres en tabulaire monospace.

---

## 2. Démarrage local

```bash
npm install
cp .env.example .env.local          # ajuster NEXT_PUBLIC_API_URL
npm run dev                          # http://localhost:3000
```

### Lockfile
Un `package-lock.json` **valide** ne peut être généré que contre le registre npm.
Les versions sont épinglées dans `package.json` ; générez et commitez le lock une fois :
```bash
npm install         # crée package-lock.json
git add package-lock.json && git commit -m "chore: lockfile"
```
La CI et le Dockerfile basculent automatiquement sur `npm ci` dès que le lock est présent.

---

## 3. Tests E2E (Playwright)

Les tests interceptent l'API et renvoient des réponses **conformes au contrat OpenAPI**,
donc exécutables sans backend ni base.

```bash
npm run e2e:install     # navigateurs
npm run e2e             # exécution (démarre le dev server automatiquement)
npm run e2e:ui          # mode interactif
```

Couverture : connexion (succès/échec), garde de route, déconnexion, KPIs,
commandes (liste, détail, pagination, filtre), livreurs (file KYC + approbation),
réconciliation (synthèse + écarts), commissions (chargement, sauvegarde, bornes).

---

## 4. Supervision (`monitoring/`)

- `nest/` — drop-ins NestJS : `/metrics` (Prometheus, RED), `/health` + `/health/ready`,
  logs pino avec rédaction des secrets (voir `monitoring/nest/README.md`).
- `prometheus/` — scrape + règles d'alerte (target down, 5xx > 5%, p95 > 1s).
- `grafana/` — datasource + dashboard provisionnés.

```bash
cd monitoring && docker compose -f docker-compose.monitoring.yml up -d
# Grafana : http://localhost:3001
```

---

## 5. Conteneurisation

```bash
docker build -t novigo-admin --build-arg NEXT_PUBLIC_API_URL=https://api.novigo.ml/api/v1 .
docker run -p 3000:3000 novigo-admin
```
Image Next **standalone** (multi-stage, utilisateur non-root).
`NEXT_PUBLIC_API_URL` est inlinée au build (variable client).

---

## 6. CI/CD (`.github/workflows/`)

- `ci.yml` — typecheck + lint + build, puis E2E Playwright (rapport uploadé).
- `deploy.yml` — build & push de l'image vers **GHCR** sur `main` et tags `v*`
  (renseigner la variable de dépôt `NEXT_PUBLIC_API_URL`).

---

## 7. Contrat & génération de clients

`novigo-openapi.yaml` (OpenAPI 3.1, 125 opérations, 66 schémas) est la source de vérité.
```bash
npx openapi-typescript novigo-openapi.yaml -o src/lib/api/generated.ts
```

---

## 8. Structure

```
src/
  app/
    login/                connexion
    (app)/                shell protégé (sidebar + topbar)
      dashboard/ orders/ payments/ drivers/ users/ commissions/ audit/
  components/ ui/ shell/   primitives + coquille
  lib/ api/ auth/ query/   client, endpoints, types, contexte, providers
tests/                     suite E2E Playwright (+ fixtures/mock)
monitoring/                Prometheus, Grafana, drop-ins NestJS
.github/workflows/         ci.yml, deploy.yml
Dockerfile                 image standalone
novigo-openapi.yaml       contrat OpenAPI 3.1
```

---

## 9. Durcissement recommandé (hors périmètre)

- Access token en mémoire + refresh token en cookie **httpOnly** (backend).
- Garde d'auth via **middleware** Next.js (blocage avant hydratation).
- Contrôle RBAC UI aligné sur `x-required-roles` du contrat.
- Restreindre `/metrics` au réseau interne.
