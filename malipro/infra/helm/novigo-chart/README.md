# NOVIGO — Chart Helm

Déploiement Kubernetes de la super app NOVIGO : API NestJS + Web Next.js + PostgreSQL + MinIO.

## Installation
```bash
# Construire et pousser les images (ou pointer vers votre registre)
helm upgrade --install novigo ./novigo-chart -n novigo --create-namespace \
  --set image.api.repository=votre-registre/novigo-api \
  --set image.web.repository=votre-registre/novigo-web \
  --set ingress.host=novigo.votredomaine.ml \
  --set secrets.jwtAccessSecret=$(openssl rand -hex 32) \
  --set secrets.jwtRefreshSecret=$(openssl rand -hex 32) \
  --set secrets.postgresPassword=$(openssl rand -hex 16)
```

## Contenu
- **PostgreSQL** : StatefulSet + PVC + Service (activable/désactivable pour un Postgres managé).
- **MinIO** : Deployment + PVC + Service (stockage objets).
- **API** : Deployment + Service + **HPA** (autoscaling CPU), sondes `/health` et `/health/ready`, env via ConfigMap + Secret.
- **Web** : Deployment + Service.
- **Ingress** : routage `/` → web, `/api` et `/realtime` → api (timeouts longs pour le WebSocket).

## À faire avant la prod
- Fournir les secrets via un gestionnaire externe (Sealed Secrets, Vault) plutôt que `values.yaml`.
- Basculer PostgreSQL vers une base managée (`postgres.enabled=false` + `DATABASE_URL` externe).
- Lancer les migrations Prisma via un Job/Hook Helm dédié (l'entrypoint de l'image fait `prisma db push` + seed en dev).

> Non validé par `helm lint`/`helm template` dans l'environnement de génération : lancez-les de votre côté.
