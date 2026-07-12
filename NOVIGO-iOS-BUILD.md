# NOVIGO — Build iOS dans le cloud (sans Mac)

## Pourquoi PAS EAS
**EAS Build (Expo) ne compile que des projets React Native / Expo** — son pipeline
exécute `npm install` + `expo prebuild`. Il **ne sait pas compiler Flutter**.
Les apps NOVIGO sont en **Flutter** → l'outil adapté est **Codemagic** (CI/CD conçu
pour Flutter, runners macOS dans le cloud). Alternatives équivalentes : **GitHub
Actions** (runner `macos-14`), **Bitrise**, **CircleCI macOS**.

## Ce qui est déjà prêt dans le repo
- Projets iOS scaffoldés : `malipro_client/ios`, `malipro_driver/ios`, `malipro_merchant/ios`
- **Bundle identifiers** alignés : `com.novigo.client` / `com.novigo.driver` / `com.novigo.merchant`
- **Nom d'affichage** iOS : « NOVIGO » / « NOVIGO Livreur » / « NOVIGO Marchand »
- **Clés d'usage** Info.plist ajoutées (localisation, Face ID, caméra, photos)
- **Icône + splash** NOVIGO générés (via `flutter_launcher_icons` / `flutter_native_splash`)
- **`codemagic.yaml`** présent à la racine de chaque app (workflow `ios-appstore`)

## Prérequis Apple (à ta charge — comptes/certificats)
1. **Apple Developer Program** actif (99 $/an).
2. Enregistrer les 3 **App IDs** sur le portail Apple : `com.novigo.client/driver/merchant`.
3. Créer les 3 apps dans **App Store Connect** (récupérer l'**Apple ID numérique** de chaque app).
4. Générer une **App Store Connect API key** (Issuer ID + Key ID + fichier `.p8`).

## Configuration Codemagic (une seule fois)
1. Crée un compte Codemagic, connecte le dépôt (ou upload manuel).
2. **Integrations → App Store Connect** : ajoute la clé API, nomme-la **`NOVIGO_ASC_API_KEY`**
   (le nom référencé dans les `codemagic.yaml`).
3. **Code signing (iOS)** : laisse Codemagic gérer certificats + profils via l'API key
   (`distribution_type: app_store`, `bundle_identifier` déjà renseigné par app).
4. **Environment variables → groupe `novigo`** :
   - `APP_STORE_APPLE_ID` = l'Apple ID numérique de l'app
   - `NOVIGO_API` = URL publique du Gateway de prod (ex. `https://api.novigo.ml/api/v1`)
     (le build force déjà `NOVIGO_LIVE=true` → IPA en mode live, pas mock)
5. Lance le workflow **`ios-appstore`** de chaque app → produit un `.ipa` et l'envoie sur **TestFlight**
   (`submit_to_testflight: true` ; `submit_to_app_store` reste `false` jusqu'à validation).

## Rappels importants
- **Firebase iOS** : ajoute `GoogleService-Info.plist` dans `ios/Runner/` (+ le pod) pour le push APNs,
  sinon le push reste inopérant (comme sur Android sans `google-services.json`).
- **Contrat API** : les apps parlent au backend **NestJS `/api/v1`** (pas au Spring `:8081`,
  qui n'a ni MerchantController ni ArtisanController). Pointe `NOVIGO_API` sur le Gateway `:8088`
  (qui route lui-même vers Nest et Spring) exposé en HTTPS public.
- **Une clé de signature = une app** : Codemagic gère la clé d'upload via l'API key ; conserve l'accès
  à App Store Connect (l'équivalent iOS du keystore Android).

## Alternative GitHub Actions (si tu préfères)
Workflow minimal par app (runner macOS) :
```yaml
name: ios
on: workflow_dispatch
jobs:
  build:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with: { channel: stable }
      - run: flutter pub get
      - run: flutter build ipa --release --dart-define=NOVIGO_LIVE=true --dart-define=NOVIGO_API=${{ secrets.NOVIGO_API }}
      # + étapes de signature (import certif/profil) et upload TestFlight (altool / fastlane)
```
Codemagic reste plus simple pour la **signature** et la **publication TestFlight** (intégrées).
