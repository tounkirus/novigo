# MALIPRO — Application Marchand (Flutter)

App marchand (Flutter · Riverpod · GoRouter · Dio) branchée sur le backend MALIPRO.
Même architecture que les apps client/livreur (`core` Dio+enveloppe+refresh, stockage
sécurisé des tokens, thème partagé).

## Périmètre (câblé sur le backend existant)
- **Auth** : OTP (`/auth/register` rôle `MERCHANT` + `/auth/verify-otp`) ou mot de passe
  (`/auth/login`, pour les comptes provisionnés).
- **Boutiques** : lister (`GET /merchants/me/stores`), créer (`POST /merchants/me/stores`).
- **Catalogue produits** : lister (`GET /merchants/stores/:id/products`), créer
  (`POST …/products`), modifier (`PATCH /merchants/products/:id`), supprimer
  (`DELETE /merchants/products/:id`).
- **Inventaire** : ajuster le stock (`PATCH /merchants/products/:id/inventory`).
- **Rapport** : synthèse boutique (`GET /merchants/stores/:id/reports`).
- **Chat temps réel** (`socket_io_client`) : messagerie avec les clients via Socket.IO
  (namespace `/realtime`, `chat.message`, frappe `chat:typing`). Accès depuis
  Compte → **Messages**. Validé E2E contre la stack live.

## Démarrage
```bash
flutter pub get
# Émulateur Android -> 10.0.2.2 ; web/desktop -> localhost :
flutter run --dart-define=API_URL=http://10.0.2.2:8080/api/v1
```
Backend : lancer la stack `malipro-stack` (`make up && make seed`).

Compte marchand de démo (après `make seed`) : **+22376000000** (« Chez Fatou »,
connexion par mot de passe — compte sans hash). Une boutique et deux produits sont
déjà provisionnés.

## Validé
- `flutter analyze` : **0 issue**.
- `flutter build web` : artefact produit.
- Parcours E2E contre la stack live : boutique → créer produit → modifier prix →
  ajuster l'inventaire → rapport → supprimer.

## Permissions natives à ajouter
- **Android** (`AndroidManifest.xml`) : `INTERNET`.

## Structure
```
lib/
  main.dart · app.dart
  core/       config, theme, api (Dio+refresh+enveloppe, GET/POST/PATCH/DELETE),
              storage sécurisé, router (GoRouter + garde auth), providers
  common/     money, widgets partagés (SectionCard, StatusChip)
  features/
    auth/       login (OTP + mot de passe), otp
    shop/       boutiques, détail boutique (produits + rapport), éditeur produit
    account/    profil, déconnexion
    home/       shell à onglets
```
