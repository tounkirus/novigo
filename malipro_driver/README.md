# MALIPRO — Application Livreur (Flutter)

App livreur (Flutter · Riverpod · GoRouter · Dio) branchée sur le backend MALIPRO.
Même architecture que l'app client (`core` Dio+enveloppe+refresh, stockage sécurisé
des tokens, thème partagé).

## Périmètre (câblé sur le backend existant)
- **Auth** : OTP (`/auth/register` rôle `DRIVER` + `/auth/verify-otp`) ou mot de passe
  (`/auth/login`, pour les comptes provisionnés).
- **Disponibilité** : bascule en ligne/hors ligne (`PATCH /drivers/me/availability`,
  avec position GPS).
- **Courses disponibles** : `GET /deliveries/available`.
- **Mes courses** : `GET /drivers/me/deliveries`.
- **Cycle de vie d'une course** : accepter (`/deliveries/:id/accept`), démarrer
  (`/start`), envoyer sa position (`/location`), terminer (`/complete`), passer
  (`/reject`).
- **Profil** : note, nombre de livraisons, statut KYC (`GET /drivers/me`).
- **Chat temps réel** (`socket_io_client`) : messagerie avec les clients via Socket.IO
  (namespace `/realtime`, événement `chat.message`, frappe `chat:typing`). Accès depuis
  le Profil → **Messages**, et **« Contacter le client »** sur le détail d'une course
  (récupère le client de la commande et ouvre la conversation). Validé E2E (le client
  reçoit le message du livreur en temps réel).

## Démarrage
```bash
flutter pub get
# Émulateur Android -> 10.0.2.2 ; web/desktop -> localhost :
flutter run --dart-define=API_URL=http://10.0.2.2:8080/api/v1
```
Backend : lancer la stack `malipro-stack` (`make up && make seed`).

Compte livreur de démo (après `make seed`) : **+22375000000** (connexion par mot de
passe, n'importe quel mot de passe — compte sans hash).

## Validé
- `flutter analyze` : **0 issue**.
- `flutter build web` : artefact produit.
- Boucle E2E contre la stack live : disponibilité → accepter → démarrer → position
  → terminer, `totalDeliveries` incrémenté.

## Permissions natives à ajouter
- **Android** (`AndroidManifest.xml`) : `INTERNET`, `ACCESS_FINE_LOCATION`.
- **iOS** (`Info.plist`) : `NSLocationWhenInUseUsageDescription`.

## Structure
```
lib/
  main.dart · app.dart
  core/       config, theme, api (Dio+refresh+enveloppe), storage sécurisé,
              services (géoloc), router (GoRouter + garde auth), providers
  common/     money, widgets partagés (SectionCard, StatusChip, statusColor)
  features/
    auth/         login (OTP + mot de passe), otp
    deliveries/   courses disponibles, mes courses, détail + actions
    profile/      disponibilité, stats, déconnexion
    home/         shell à onglets
```
