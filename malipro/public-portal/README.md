# NOVIGO — Portail public de suivi

Page statique autonome (aucun build). Sert le suivi de commande via `GET /public/orders/track/:code`.

## Déploiement
Servez `index.html` par n'importe quel serveur statique (Nginx, CDN, S3…).
Configurez l'URL de l'API avant le `<script>` principal :
```html
<script>window.NOVIGO_API = "https://api.novigo.ml/api/v1";</script>
```
Sans configuration, l'appel se fait sur la même origine (`/api/v1`).
Le code `DEMO123456` fonctionne hors-ligne (jeu de démonstration).
