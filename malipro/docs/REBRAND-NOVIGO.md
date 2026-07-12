# Rebrand MALIPRO → NOVIGO

Renommage **profond et complet** de la marque sur tout le monorepo, en conservant l'architecture et
la logique métier. Identité visuelle officielle : **Indigo / Violet électrique**.

## Couleurs officielles NOVIGO

| Rôle | Hex | RGB |
|------|-----|-----|
| Primaire (brand) | `#5B4BE1` | 91 75 225 |
| Violet profond (brand-dark) | `#3F32B0` | 63 50 176 |
| Indigo clair (dark mode) | `#7C6DF0` | 124 109 240 |
| Accent ambré (gold) | `#FFC043` | 255 192 67 |
| Fond splash / shell sombre | `#0f1013` | — |

## Portée du renommage

### 1. Nom d'application & affichage
- `client-web` : constante centrale `BRAND.name = "NOVIGO"` (tagline « La Super App du Mali » conservée),
  ~50 littéraux UI (admin, super admin, support, wallet, notifications, mock, reçus).
- Wordmarks composites corrigés à la main (non captés par le remplacement) : login, `app-header`,
  `dashboard-shell` → monogramme **N** + `NOVI`·`GO`.
- `web` (console admin), `public-portal` (suivi de commande).

### 2. Identité visuelle (créée — aucun asset n'existait)
- **Favicon** : `client-web/src/app/icon.svg` + `web/src/app/icon.svg` (monogramme N dégradé indigo→violet).
- **Logo** : `client-web/public/logo.svg` (lockup horizontal) + `logo-mark.svg` (glyphe seul).
- **Icône iOS** : `app/apple-touch-icon/route.tsx` (PNG 180² via `next/og`, lié par metadata `icons.apple`).
- **Icône Android (PWA)** : `app/android-icon-192` & `-512` (PNG maskable via `next/og`), référencées au manifest.
- **Splash screen** : généré par le manifest (name + `background_color #0f1013` + `theme_color #5B4BE1` + icône).
- **Manifest PWA** : `app/manifest.ts` (`/manifest.webmanifest`).
- **Open Graph / Twitter** : `app/og/route.tsx` (PNG 1200×630) + metadata `openGraph`/`twitter`.
- **Couleurs** : tokens `--brand`/`--brand-dark`/`--gold` redéfinis (client-web + web), `themeColor` indigo.

### 3. SEO / métadonnées
- `client-web/layout.tsx` : title, description, `applicationName`, `manifest`, `icons`, `openGraph`, `twitter`, `themeColor`.
- `web/layout.tsx` : title/description « NOVIGO — Console admin ».

### 4. Backend Spring (renommage technique profond)
- Package Java **`com.malipro` → `com.novigo`** (180 fichiers déplacés + imports).
- Classes `MaliproApplication → NovigoApplication`, `MaliproProperties → NovigoProperties` (+ test).
- `pom.xml` : `groupId com.novigo`, `artifactId/finalName **novigo-api**` (jar = `novigo-api.jar`).
- Config : `spring.application.name novigo-api`, prefix `@ConfigurationProperties("novigo")`, clés yml
  `novigo.*`, variables d'env `NOVIGO_*`, tag Prometheus `application: novigo-api`.
- Migrations Flyway : en-têtes de commentaires mis à jour (sûr — la base est aussi renommée, historique neuf).

### 5. Base de données & Docker
- DB / user / password `malipro → novigo` (compose racine, `application-*.yml`, `.env*`, `DATABASE_URL`).
- `docker-compose*.yml` : `name:`, `POSTGRES_DB`, `OTEL_SERVICE_NAME novigo-api`, identifiants MinIO.
- ⚠️ Rename de base = **volume Postgres neuf** (faire `docker compose down -v` avant un premier `up`).

### 6. Backend NestJS
- Emails (`email.templates.ts`) : en-tête, sujets, pied → NOVIGO, couleur `#0E7C5A → #5B4BE1` ;
  `EMAIL_FROM = "NOVIGO <no-reply@novigo.ml>"`.
- Factures PDF (`invoice.service.ts`) : bandeau `#5B4BE1`, accent `#FFC043`, titre/pied NOVIGO.
- `main.ts` (log Swagger), `package.json` (`novigo-backend`), Prisma seed/schema, RBAC, tracing OTEL.

### 7. Infra / monitoring / docs
- Helm : dossier `malipro-chart → novigo-chart`, `Chart.yaml`, values, templates.
- Grafana : `malipro-overview.json → novigo-overview.json` + jobs Prometheus / alert rules.
- `web/malipro-openapi.yaml → novigo-openapi.yaml`. Docs, READMEs, Postman.

## Non renommé (volontaire — « sans casser l'architecture »)
- **Répertoire physique `_stack/malipro/`** : c'est un emplacement disque (outillage, chemins de session),
  invisible pour l'utilisateur. Le renommer casserait les chemins ; conservé tel quel.
- **`MALI10`** : code promo (référence au Mali, pays), pas à la marque — conservé.
- Contenu binaire interne du zip `novigo-client-flutter.zip` (fichier renommé, contenu archivé inchangé).

## Vérification — build vert obligatoire ✅

| Projet | Commande | Résultat |
|--------|----------|----------|
| backend-spring | `mvn -o clean package` | ✅ **34/34 tests**, `novigo-api.jar` |
| client-web | `npm run build` | ✅ Compiled, **67 pages**, `server.js` standalone |
| client-web | `vitest run` | ✅ **60/60** |
| web (console) | `npm run build` | ✅ Compiled, 20 pages |
| backend (NestJS) | `npm run build` (`nest build`) | ✅ |
| Smoke démo | boot `novigo-api.jar` | ✅ `/api/v1/info` → `"name":"novigo-api"`, login `client@novigo.ml`, catalogue peuplé |

**Résidu `malipro` dans les sources (hors artefacts générés/binaires) : 0.**
