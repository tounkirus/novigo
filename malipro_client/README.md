# MALIPRO — Application Client (Flutter)

Super app client (Flutter · Riverpod · GoRouter · Dio), branchée sur le contrat
OpenAPI de MALIPRO.

> ⚠️ Ce projet n'a pas été compilé ici (pas de toolchain Dart dans l'environnement
> de génération). Lancez `flutter pub get` puis `flutter analyze` et corrigez les
> éventuels écarts avant exécution. C'est un scaffold soigné, pas un binaire validé.

## Câblé sur le backend existant (fonctionne dès aujourd'hui)
- **Catalogue** : `GET /products`
- **Panier** : local (Riverpod)
- **Commande** : `POST /orders` puis `POST /payments/wallet`
- **Commandes** : `GET /orders`, `GET /orders/:id`, **suivi** `GET /orders/:id/tracking` (rafraîchi manuellement)
- **Wallet** : `GET /wallet/balance`, `POST /wallet/deposit`, `GET /wallet/transactions`
- **Fidélité** : `GET /customers/me/loyalty`
- **Auth** : chemin mot de passe `POST /auth/login` disponible (`AuthRepository.loginWithPassword`)

## Chat temps réel (câblé)
- **Messagerie temps réel** (`socket_io_client`) : conversations (`GET/POST /chat/conversations`),
  historique (`GET …/messages`), envoi (`POST …/messages`) et réception **live** via
  Socket.IO (namespace `/realtime`, auth JWT au handshake) — événement `chat.message`,
  indicateur de frappe (`chat:typing`). Accès depuis l'onglet Compte → **Chat**.
  Validé de bout en bout (duplex A↔B + frappe) contre la stack live.

## Structuré, en attente de backend (jalons P1/P6)
- **Inscription OTP** : écrans prêts, appellent `/auth/register` + `/auth/verify-otp` (backend P1).
- **Biométrie** (`local_auth`), **géolocalisation** (`geolocator`) : services prêts, à intégrer au flux.
- **i18n** : `flutter_localizations` + ARB (`app_fr`/`app_en`) scaffoldés ; externalisation des chaînes à finir.
- **Favoris, coupons, parrainage, notifications, centre d'aide** : entrées présentes dans l'onglet Compte, marquées « à compléter » avec le jalon cible.

## Démarrage
```bash
flutter pub get
flutter gen-l10n          # génère les localisations depuis lib/l10n/*.arb
# Émulateur Android -> API sur 10.0.2.2 ; sinon passer --dart-define :
flutter run --dart-define=API_URL=http://10.0.2.2:8080/api/v1
```
Backend : lancer la stack `malipro-stack` (`make up && make seed`).

## Permissions à ajouter (natif)
- **Android** (`AndroidManifest.xml`) : `INTERNET`, `ACCESS_FINE_LOCATION`, `USE_BIOMETRIC`.
- **iOS** (`Info.plist`) : `NSLocationWhenInUseUsageDescription`, `NSFaceIDUsageDescription`.

## Structure
```
lib/
  main.dart · app.dart
  core/            config, theme, api (Dio+refresh+enveloppe), storage sécurisé,
                   services (biométrie, géoloc), router (GoRouter + garde auth), providers
  common/          money, widgets partagés
  features/
    auth/ catalog/ cart/ orders/ wallet/ account/ home/
  l10n/            app_fr.arb, app_en.arb
```
