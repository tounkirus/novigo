# Captures d'écran Play Store — harnais automatisé

Génère les captures téléphone exigées par Google Play, via **`integration_test` + `flutter drive`**.

## Ce qui a été installé
Dans chaque app (`malipro_client`, `malipro_driver`, `malipro_merchant`) :
- `integration_test/screenshots_test.dart` — pilote la connexion puis parcourt les onglets, `takeScreenshot()` à chaque écran clé.
- `test_driver/screenshot_driver.dart` — écrit les PNG dans `<app>/screenshots/`.
- `integration_test` ajouté en `dev_dependencies`.
- Runner : `_stack/tool/take_screenshots.ps1`.

## Prérequis
1. **Un appareil Android connecté** (`flutter devices`) — émulateur (AVD) ou téléphone en mode debug USB.
2. **Un backend démo joignable depuis l'appareil**, avec un **compte démo** :
   - Émulateur Android → l'hôte est `10.0.2.2` (donc `http://10.0.2.2:8080/api/v1`).
   - Le backend doit accepter la connexion démo : mot de passe démo pour Livreur/Marchand, **OTP fixe** pour le Client (ex. `123456` selon la config du backend).

## Lancer
```powershell
cd _stack/tool
# Client (téléphone + OTP)
./take_screenshots.ps1 -App client   -ApiUrl "http://10.0.2.2:8080/api/v1" -Phone "+22370000001" -Otp "123456"
# Livreur (mot de passe)
./take_screenshots.ps1 -App driver   -ApiUrl "http://10.0.2.2:8080/api/v1" -Phone "+22375000001" -Password "123456"
# Marchand (mot de passe)
./take_screenshots.ps1 -App merchant -ApiUrl "http://10.0.2.2:8080/api/v1" -Phone "+22376000001" -Password "123456"
```
Les PNG atterrissent dans `store/play/<app>/images/phoneScreenshots/` (prêts pour la Play Console).

> Adapte `-Phone`/`-Password`/`-Otp` aux comptes réellement seedés dans ton backend.
> Ajoute `-Device emulator-5554` pour cibler un appareil précis.

## Comportement sans backend
Si aucun backend n'est joignable, le login échoue **proprement** : seuls les écrans
`01-login` (+ `02-otp` pour le client) sont capturés, le reste est ignoré (pas de crash).
Utile pour vérifier le pipeline, mais insuffisant pour la fiche (Play veut ≥ 2 écrans représentatifs).

## Personnaliser les écrans capturés
Dans `integration_test/screenshots_test.dart`, ajoute des étapes après la connexion :
```dart
await tester.tap(find.text('Portefeuille'));
await tester.pumpAndSettle();
await shot('05-portefeuille');
```
Le harnais parcourt déjà automatiquement chaque onglet de la `NavigationBar`.

## Option cloud — Codemagic (aucun device local requis)
Un workflow **`android-screenshots`** est intégré dans chaque `codemagic.yaml`
(à côté de `ios-appstore`). Il tourne sur une instance Linux, **crée et démarre un
émulateur Android** (API 34), lance le harnais `flutter drive`, et publie les PNG
dans les **Artifacts** du build.
- Configure dans le groupe d'env Codemagic `novigo` : **`API_URL`** = URL d'un
  **backend démo PUBLIC** (l'émulateur cloud ne joint pas ton localhost).
- `DEMO_PHONE`/`DEMO_PASSWORD`/`DEMO_OTP` ont des valeurs par défaut par app (surchargées si besoin).
- Sélectionne le workflow `android-screenshots` dans l'UI Codemagic et lance-le.
- Récupère les captures dans l'onglet **Artifacts**, puis dépose-les dans
  `store/play/<app>/images/phoneScreenshots/`.

## Notes
- Exécuté en `--profile` → **pas de bannière debug** sur les captures.
- Sur Android, `convertFlutterSurfaceToImage()` est appelé une fois pour permettre la capture.
- Le contrat API doit être **compatible NestJS `/api/v1`** (pas Spring `:8081`).
- Autre option cloud : **Firebase Test Lab** (même harnais).
