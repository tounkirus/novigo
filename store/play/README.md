# Fiches Google Play — NOVIGO (Client · Livreur · Marchand)

Contenu prêt à copier dans la **Play Console** (une fiche par application).

## Structure
```
store/play/
  _assets/                       visuels sources
  client/  driver/  merchant/
    title.txt                    Titre (≤ 30 car)
    short_description.txt        Description courte (≤ 80 car)
    full_description.txt         Description complète (≤ 4000 car)
    images/
      icon-512.png               Icône Play 512×512 (32 bits)
      feature-1024x500.png       Image de mise en avant 1024×500
      phoneScreenshots/          ⚠️ À REMPLIR (voir plus bas)
```
> Arborescence compatible **fastlane supply** (renommer `icon-512.png`→`icon.png`,
> `feature-1024x500.png`→`featureGraphic.png`, et placer sous
> `fastlane/metadata/android/fr-FR/`) si tu veux automatiser l'upload.

## Identité des applications
| App | Nom affiché | applicationId | Titre Play |
|---|---|---|---|
| Client | NOVIGO | `com.novigo.client` | NOVIGO : Livraison & Services |
| Livreur | NOVIGO Livreur | `com.novigo.driver` | NOVIGO Livreur |
| Marchand | NOVIGO Marchand | `com.novigo.merchant` | NOVIGO Marchand |

## Catégorie & coordonnées
| Champ | Valeur recommandée |
|---|---|
| Catégorie Client | Alimentation et boissons *(ou « Achats »)* |
| Catégorie Livreur | Entreprise |
| Catégorie Marchand | Entreprise |
| Type | Application · **Gratuite** |
| Pays | Mali (+ pays visés) |
| E-mail de contact | support@novigo.ml |
| Site web | https://novigo.ml |
| Politique de confidentialité | https://novigo.ml/confidentialite *(à publier — OBLIGATOIRE)* |

## Classification du contenu (questionnaire IARC)
Réponses types (aucune violence, sexe, drogue, jeu d'argent) → attendu **PEGI 3 / Tout public** :
- Violence / contenu sexuel / grossièretés / drogues / jeux d'argent : **Non**
- **Les utilisateurs peuvent communiquer entre eux** (chat) : **Oui** → déclarer
- **L'app partage la position** de l'utilisateur : **Oui** → déclarer
- Achats numériques : selon paiements ; contenu financier/paiements réels : **Oui**
> La messagerie et le partage de position peuvent faire passer certaines apps en **Teen/Adolescent** selon les réponses ; répondre honnêtement.

## Public cible
Apps de **paiement/finance** → cibler **18 ans et plus** (recommandé) ; ne pas cibler les enfants.

## ⚠️ Formulaire « Sécurité des données » (obligatoire) — à déclarer
Les 3 apps collectent et transmettent des données au backend. À déclarer :

| Type de données | Collecté | Exemples | Finalité |
|---|---|---|---|
| Infos personnelles | Oui | nom, n° de téléphone, e-mail, adresse | Compte, fonctionnalité |
| Position | Oui | **position précise** (livraison, suivi, GPS livreur) | Fonctionnalité de l'app |
| Infos financières | Oui | portefeuille, historique de paiement (Mobile Money) | Fonctionnalité |
| Messages | Oui | chat in-app | Fonctionnalité |
| Activité dans l'app | Oui | commandes, interactions | Fonctionnalité |
| Identifiants d'appareil | Oui | token push (FCM) | Notifications |

Réponses transverses :
- **Chiffrées en transit** : Oui (HTTPS)
- **L'utilisateur peut demander la suppression** de ses données : Oui (prévoir un moyen)
- Données partagées avec des tiers : uniquement prestataires techniques (paiement, notifications)
> Spécificités : Livreur = position **en continu** pendant une course ; Marchand = pas de position continue, mais photos (caméra/galerie).

## ⚠️ Captures d'écran — SEUL ASSET MANQUANT (à produire)
Play exige **au moins 2 captures téléphone** par app (format 16:9 ou 9:16, 320–3840 px).
Elles doivent montrer les **vrais écrans** → à capturer en lançant chaque app :
```
cd _stack/malipro_client   # ou _driver / _merchant
flutter run --release --dart-define=API_URL=<backend accessible>
# puis capturer 3–8 écrans clés (accueil, détail, panier/commande, portefeuille…)
```
Déposer les PNG/JPG dans `store/play/<app>/images/phoneScreenshots/`.
*(Je n'ai pas pu les générer : cela nécessite de lancer l'app sur un appareil/émulateur connecté à un backend.)*

## Étapes de publication (par app)
1. Play Console → **Créer une application** (langue FR, gratuite).
2. **Fiche principale** : coller `title` / `short_description` / `full_description`, importer `icon-512.png` + `feature-1024x500.png` + les captures.
3. **Classification du contenu** : remplir le questionnaire IARC (cf. ci-dessus).
4. **Sécurité des données** : remplir selon le tableau ci-dessus.
5. **Politique de confidentialité** : renseigner l'URL.
6. **Version** : uploader `apk/novigo-<app>-release.aab` sur une **piste interne** d'abord.
7. Vérifier, puis promouvoir en test fermé → production.

## Rappels
- **AAB signés** prêts : `apk/novigo-{client,driver,merchant}-release.aab`.
- Keystore : passer en mot de passe secret ou **Play App Signing** avant la prod (`_stack/novigo-keystore/KEYSTORE-INFO.md`).
- `API_URL` doit viser un backend **compatible NestJS `/api/v1`** (pas Spring `:8081`).
