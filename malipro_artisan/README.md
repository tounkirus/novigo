# MALIPRO — Application Artisan (Flutter)

App artisan (Flutter · Riverpod · GoRouter · Dio) branchée sur le backend MALIPRO.
Même architecture que les apps client/livreur/marchand (`core` Dio+enveloppe+refresh,
stockage sécurisé des tokens, thème partagé).

## Périmètre (câblé sur le backend existant, préfixe `/artisans/me`)
- **Auth** : OTP (`/auth/register` rôle `ARTISAN` + `/auth/verify-otp`) ou mot de passe
  (`/auth/login`, pour les comptes provisionnés).
- **Profil** : consulter (`GET /artisans/me`), modifier métier/bio/zone
  (`PATCH /artisans/me`).
- **Services** : lister, créer, modifier, supprimer (`…/services`).
- **Devis** : lister (`GET …/quotations`), créer (`POST …/quotations`),
  accepter/refuser (`PATCH …/quotations/:id`).
- **Revenus** : total des devis acceptés (`GET …/earnings`).
- **Chat temps réel** (`socket_io_client`) : messagerie avec les clients via Socket.IO
  (namespace `/realtime`, `chat.message`, frappe `chat:typing`). Accès depuis
  Compte → **Messages** et **« Contacter le client »** sur chaque devis (ouvre la
  conversation avec le client du devis). Validé E2E (le client reçoit en temps réel).

## Démarrage
```bash
flutter pub get
# Émulateur Android -> 10.0.2.2 ; web/desktop -> localhost :
flutter run --dart-define=API_URL=http://10.0.2.2:8080/api/v1
```
Backend : lancer la stack `malipro-stack` (`make up && make seed`).

Compte artisan de démo (après `make seed`) : **+22379000000** (« Oumar Touré »,
Plombier, connexion par mot de passe — compte sans hash). Un profil et un service
sont déjà provisionnés.

## Validé
- `flutter analyze` : **0 issue**.
- `flutter build web` : artefact produit.
- Parcours E2E contre la stack live : profil → créer service → modifier prix →
  créer devis → accepter → **revenus recalculés (0 → 30 000 XOF)** → supprimer.

## Permissions natives à ajouter
- **Android** (`AndroidManifest.xml`) : `INTERNET`.

## Structure
```
lib/
  main.dart · app.dart
  core/       config, theme, api (Dio+refresh+enveloppe, GET/POST/PATCH/DELETE),
              storage sécurisé, router (GoRouter + garde auth), providers
  common/     money, widgets partagés (SectionCard, StatusChip, quotationColor)
  features/
    auth/       login (OTP + mot de passe), otp
    artisan/    services (profil + revenus + CRUD), éditeur service, devis
    account/    profil éditable, déconnexion
    home/       shell à onglets
```
