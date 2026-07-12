# NOVIGO — Backend (tranche console admin)

Backend **NestJS + Prisma + PostgreSQL** qui implémente réellement les endpoints
consommés par la console d'administration `novigo-admin`. Réponses conformes au
contrat OpenAPI (enveloppe `success` / `data` / `meta`), JWT + refresh, RBAC.

## Endpoints implémentés (branchés bout-à-bout avec le dashboard)
- `POST /api/v1/auth/register`, `POST /api/v1/auth/verify-otp`, `POST /api/v1/auth/resend-otp` (flux OTP, passerelle SMS console)
- `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh-token`, `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `GET /api/v1/analytics/kpis`
- `GET /api/v1/admin/orders`, `GET /api/v1/orders/:id`, `GET /api/v1/orders/:id/tracking`, `POST /api/v1/orders/:id/cancel`
- `GET /api/v1/admin/payments`, `GET /api/v1/payments/reconciliation`
- `GET /api/v1/admin/drivers`, `GET /api/v1/admin/drivers/:id`, `POST /api/v1/drivers/:id/validate`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/commissions`, `PATCH /api/v1/admin/commissions`
- `GET /api/v1/admin/audit-logs`
- Livraisons : `GET /deliveries/available`, `GET /deliveries/:id`, `POST /deliveries/:id/{accept,reject,start,complete,issues}`
- Livreur (self) : `GET /drivers/me`, `PATCH /drivers/me/availability`, `GET /drivers/me/deliveries`
- Avis : `POST /orders/:id/rating`, `GET /reviews` (recalcul de la note livreur)
- Commerçants : `/merchants/me/stores`, `/merchants/stores/:id/products`, inventaire, rapports
- Artisans : `/artisans/me` (profil, services, devis, agenda, gains)
- Notifications : `GET /notifications`, `/unread-count`, `POST /notifications/:id/read`, `/read-all` (persisté + push WS)
- Coupons : `POST /promotions/coupons/validate` ; admin `POST/GET /admin/coupons`
- Support : `POST/GET /support/tickets`, `GET /support/tickets/:id`, `POST /support/tickets/:id/messages` ; agent `GET/PATCH /admin/support/tickets/:id`
- Mobile Money : `POST /payments/mobile-money` (Orange Money / Wave, adaptateurs), webhook public `POST /payments/webhooks/:provider` (signature HMAC), remboursement admin `POST /admin/payments/:id/refund`
- Chat : `GET/POST /chat/conversations`, `GET/POST /chat/conversations/:id/messages` (persisté + push WS)
- Suivi live : `POST /deliveries/:id/location` (livreur pousse sa position -> diffusion)
- **WebSocket** `/realtime` (socket.io, auth JWT au handshake) : `order.tracking`, `chat.message`, `chat.typing`, `notification.push`
- Observabilité : `GET /metrics` (Prometheus), `GET /health`, `GET /health/ready`

> Les ~110 autres opérations du contrat (apps client/livreur/artisan/commerçant,
> paiements Mobile Money réels, chat, notifications, support…) ne sont pas dans cette
> tranche. La réconciliation est simplifiée (dérivée des paiements), en attendant le
> flux de settlement réel Orange Money / Wave.

## Démarrage rapide (Docker)
```bash
docker compose up --build          # Postgres + API (migrations appliquées au démarrage)
# puis, une fois up, seed des données de démo :
docker compose exec api npx prisma db seed || npm run seed
```
API : http://localhost:8080/api/v1 — **Admin de démo : +22370000000 / admin123**

## Démarrage local (sans Docker)
```bash
npm install
cp .env.example .env                # ajuster DATABASE_URL
npx prisma migrate dev --name init  # crée le schéma
npm run seed                        # données de démo
npm run start:dev                   # http://localhost:8080/api/v1
```

## Brancher le dashboard
Dans `novigo-admin/.env.local` :
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```
Connexion : `+22370000000` / `admin123`.


## Durcissement & intégrations
- **Logs** : logger JSON (`LOG_FORMAT=json`, `src/common/logging/json.logger.ts`) ingéré par **Loki/Promtail** (inclus dans la stack) et exploré dans Grafana (datasource Loki).
- **Tracing** : OpenTelemetry (auto-instrumentation http/express/pg), export OTLP vers Jaeger/Tempo, activé par `OTEL_ENABLED=true` (`src/tracing.ts`, importé en premier). Jaeger inclus dans la stack (UI `:16686`).
- **OTP durci** : code hashé, expiration 5 min, **max 5 tentatives** (verrouillage), **max 5 demandes/heure** par numéro.
- **Sécurité** : en-têtes `helmet`, **rate limiting** global (`@nestjs/throttler`, 120 req/min), **denylist Redis** des refresh tokens (le logout révoque réellement ; fallback mémoire en dev si `REDIS_URL` absent).
- **SMS** : `SMS_PROVIDER=console|http|infobip|twilio` (impl HTTP générique, ex. Orange SMS API).
- **Suivi public** : `GET /public/orders/track/:code` — statut de commande sans authentification (code de suivi généré à la commande).
- **Facturation** : `GET /orders/:id/invoice` — génère une facture PDF (pdfkit, HT/TVA/TTC, branding), contrôle de propriété.
- **Réconciliation (settlement)** : `POST /admin/settlements/reconcile` (relevé opérateur vs paiements internes -> MATCHED/MISMATCH/MISSING/ORPHAN), `GET /admin/settlements[/:id]`, tables `Settlement`/`SettlementItem`.
- **Webhooks robustes** : signature HMAC + **anti-rejeu/idempotence** (dédup persistée `WebhookEvent`), traitement **asynchrone BullMQ** (retries + backoff + **Dead Letter Queue**), repli synchrone sans Redis ; audit `PaymentEvent`.
- **Mobile Money** : appels HTTP réels Orange Money (OAuth + webpayment) et Wave (checkout sessions) ; **repli sandbox** simulé si les identifiants sont absents.
- **Email** : `EMAIL_PROVIDER=console|smtp` (SMTP couvre SendGrid/SES via leurs identifiants), gabarits versionnés (welcome, otp, reset, invoice, admin), journalisation `EmailLog` ; MailHog inclus dans la stack (UI `:8025`). Flux **mot de passe oublié / réinitialisation** (`/auth/forgot-password`, `/auth/reset-password`).
- **Parrainage** : `GET /referrals/me` (code + gains), `POST /referrals/apply` (crédite le parrain, +500 FCFA au wallet).
- **Préférences de notification** : `GET/PUT /notifications/preferences` (canaux in-app/push/marketing respectés à l'envoi).
- **Push** : `PUSH_PROVIDER=console|fcm|apns` (impl FCM), tokens d'appareil via `POST /users/me/devices` ; toute notification est aussi poussée aux appareils enregistrés.

> Ces intégrations nécessitent de **vrais identifiants** (opérateurs, FCM) pour être actives ; sans eux, le comportement de repli permet de développer/tester.

## OTP / SMS
Le code OTP est envoyé via `SmsService` (impl `ConsoleSmsService` : journalise le code). Brancher une passerelle réelle (Orange SMS API, Twilio) en remplaçant le provider. En dev, `OTP_DEV_ECHO=true` renvoie le code dans la réponse `register` (à ne jamais activer en prod).

## Lockfile
Versions épinglées dans `package.json`. Générer le lock (une fois, avec accès au
registre) : `npm install` puis commit de `package-lock.json`. CI et Dockerfile
basculent alors sur `npm ci`.

## Structure
```
prisma/            schema.prisma + seed.ts
src/
  common/          prisma, guards (JWT + RBAC), interceptor d'enveloppe,
                   filtre d'erreurs, pagination, métriques
  auth/            login, refresh, stratégie JWT
  users/ analytics/ orders/ payments/ drivers/ admin/ commissions/ audit/
  main.ts          préfixe /api/v1, ValidationPipe, CORS
```

## Sécurité / durcissement (hors périmètre)
- Secrets via un coffre (pas en clair dans compose).
- Denylist des refresh tokens (Redis) pour un logout vraiment révocable.
- Rate limiting (@nestjs/throttler), restriction de `/metrics` au réseau interne.
