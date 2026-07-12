# NOVIGO — Guide de déploiement

## 1. Aperçu de la stack
| Service | Rôle | Port |
|---|---|---|
| `api` | Backend NestJS (REST + WebSocket `/realtime`) | 8080 |
| `web` | Console admin Next.js | 3000 |
| `db` | PostgreSQL | 5432 |
| `redis` | Cache, denylist tokens, file BullMQ | 6379 |
| `minio` | Stockage objets (photos, KYC) | 9000 / 9001 |
| `mailhog` | SMTP de dev (emails) | 1025 / 8025 |
| `jaeger` | Traces OpenTelemetry | 16686 / 4318 |
| `prometheus` / `grafana` | Métriques + dashboards | 9090 / 3000 |
| `loki` / `promtail` | Logs centralisés | 3100 |

## 2. Local (Docker Compose)
```bash
cd novigo
cp backend/.env.example backend/.env   # ajuster si besoin
docker compose up -d --build
docker compose exec api npx prisma db push
docker compose exec api npm run seed    # jeu de données de démonstration
```
Accès : Web `:3000`, API `:8080/api/v1`, MailHog `:8025`, Jaeger `:16686`, Grafana `:3000`.
Compte admin de démo : `+22370000000` / `admin123`.

## 3. Migrations (production)
La première fois, générer la baseline sur une base réelle :
```bash
npx prisma migrate dev --name init   # crée prisma/migrations
```
Ensuite, en déploiement, les migrations sont appliquées automatiquement
(Job Helm `pre-install/pre-upgrade` : `prisma migrate deploy`).

## 4. Kubernetes (Helm)
```bash
helm upgrade --install novigo ./infra/helm/novigo-chart -n novigo --create-namespace \
  --set image.api.repository=REGISTRE/novigo-api --set image.api.tag=X.Y.Z \
  --set image.web.repository=REGISTRE/novigo-web --set image.web.tag=X.Y.Z \
  --set ingress.host=novigo.votredomaine.ml \
  --set secrets.jwtAccessSecret=$(openssl rand -hex 32) \
  --set secrets.jwtRefreshSecret=$(openssl rand -hex 32) \
  --set secrets.postgresPassword=$(openssl rand -hex 16) \
  --set redis.url=redis://novigo-redis:6379 \
  --set observability.tracingEnabled=true --set observability.otlpEndpoint=http://jaeger-collector:4318
```
Notes prod : PostgreSQL et Redis managés recommandés (`postgres.enabled=false` + `DATABASE_URL` externe) ; secrets via Vault/Sealed Secrets.

## 5. Activation des intégrations réelles
| Intégration | Variables |
|---|---|
| Orange Money | `ORANGE_MONEY_CLIENT_ID/SECRET/BASE_URL`, `ORANGE_MONEY_WEBHOOK_SECRET` |
| Wave | `WAVE_API_KEY`, `WAVE_BASE_URL`, `WAVE_WEBHOOK_SECRET` |
| SMS | `SMS_PROVIDER=http`, `SMS_HTTP_URL`, `SMS_HTTP_TOKEN` |
| Push | `PUSH_PROVIDER=fcm`, `FCM_SERVER_KEY` |
| Email | `EMAIL_PROVIDER=smtp`, `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM` |
Sans identifiants, chaque intégration bascule en repli (console / sandbox simulé).

## 6. Santé & observabilité
- Sondes : `GET /health`, `GET /health/ready`.
- Métriques : `GET /metrics` (Prometheus).
- Traces : `OTEL_ENABLED=true` → Jaeger.
- Logs : `LOG_FORMAT=json` → Loki (Grafana → datasource Loki).
