# NOVIGO — Annonces vocales (Voice Dispatch)

> Le prestataire est prévenu **à la voix** qu'une mission lui est attribuée, sans regarder son écran.
> Le serveur compose la phrase, l'application la prononce et **accuse réception**.

## 1. Où vit le module

| Élément | Emplacement |
|---|---|
| Fabrique de phrases (FR / bambara) | `malipro/backend/src/voice-dispatch/announcement.builder.ts` |
| Service (réglages, envoi, journal, réessai) | `malipro/backend/src/voice-dispatch/voice-dispatch.service.ts` |
| API `/api/v1/voice-dispatch/*` | `malipro/backend/src/voice-dispatch/voice-dispatch.controller.ts` |
| Déclenchement | `BrainService.dispatch()` — à l'attribution d'une mission |
| Lecture sur l'appareil | `malipro_driver/lib/novigo/voice_service.dart` (`flutter_tts`) |
| Réglages livreur | `malipro_driver/lib/novigo/screens/voice_settings.dart` (Compte → Annonces vocales) |
| Réception temps réel | `malipro_driver/lib/novigo/data/realtime_client.dart` (`voice.dispatch`) |

## 2. Flux

```
Le Brain attribue une mission (Service Decision Engine)
  └─ VoiceDispatchService.announce()
       ├─ lit les réglages du prestataire (langue, voix, vitesse, volume, répétition)
       ├─ compose la phrase (aucune donnée sensible : quartier, distance, gain, délai)
       ├─ JOURNALISE l'annonce (elle part avec son identifiant)
       ├─ Socket.IO  → `voice.dispatch` (app vivante)
       ├─ Push FCM/APNs → data message (app fermée)
       └─ réessai UNE fois si aucun accusé dans le délai de réponse
App livreur
  ├─ prononce (flutter_tts) avec les réglages, répète si demandé
  └─ POST /voice-dispatch/announcements/:id/ack → PLAYED ou FAILED + motif
```

## 3. API

| Route | Rôle |
|---|---|
| `GET /voice-dispatch/settings` | Mes réglages (valeurs par défaut si jamais personnalisés) |
| `PUT /voice-dispatch/settings` | Activation, langue (`fr`/`bm`), voix (`FEMALE`/`MALE`), vitesse 0,5–2, volume 0–1, répétition 1–3 |
| `POST /voice-dispatch/test` | Annonce de test pour vérifier son et voix |
| `POST /voice-dispatch/send` *(admin)* | Annonce ciblée (le Brain, lui, appelle le service directement) |
| `POST /voice-dispatch/announcements/:id/ack` | Accusé de lecture : `PLAYED` ou `FAILED` + motif |
| `GET /voice-dispatch/history` | Journal de mes annonces |

## 4. Base de données (schéma `ops`, migration `20260731000000_voice_dispatch`)

- `VoiceSettings` — `partnerId` (unique), `enabled`, `language`, `voice`, `speed`, `volume`, `repeatCount`.
- `VoiceAnnouncement` — journal : `kind`, `language`, `text` **exactement tel que prononcé**, `channel`
  (`REALTIME`/`PUSH`/`BOTH`/`NONE`), `status` (`SENT`/`PLAYED`/`FAILED`/`SKIPPED`), `error`, `playedAt`.

## 5. Sécurité et vie privée

- Un prestataire ne lit et ne modifie **que** ses réglages et son journal ; l'accusé de lecture d'un
  autre compte renvoie 404 (vérifié).
- La fabrique de phrases **ne reçoit pas** de nom de client, de téléphone ni d'adresse précise :
  seulement le métier, le **quartier**, la distance, le gain et le délai. Ce qui n'entre pas ne peut
  pas être prononcé.
- `POST /send` est réservé à l'administration (403 pour un livreur).

## 6. Erreurs prévues (§9 du cahier des charges)

| Situation | Comportement |
|---|---|
| Annonces désactivées | Rien n'est prononcé, mais l'événement est tracé (`SKIPPED`) |
| Moteur vocal absent | `FAILED` + motif `TTS_UNAVAILABLE`, l'app continue de fonctionner |
| Lecture jamais confirmée par le moteur | `FAILED` + `SPEAK_TIMEOUT` — on n'annonce **jamais** « lue » sans confirmation |
| Aucun accusé dans le délai | Le serveur repousse l'annonce **une seule fois** |
| Voix bambara absente de l'appareil | Lecture avec la voix française, repli signalé à l'écran |
| Appareil hors ligne | L'annonce reste `SENT` ; l'app ne prononce rien qu'elle n'a pas reçu |

## 7. Vérifié en réel

**Backend** (stack Docker, Gateway `:8088`, script `scratchpad/voice_e2e.mjs` — 14 vérifications vertes) :
réglages par défaut, bornes appliquées (vitesse 9 → 2, volume −2 → 0, répétition 12 → 3), annonce de
test, accusé de lecture, cloisonnement entre prestataires, **annonce déclenchée par une vraie
attribution du Brain**, bascule bambara, désactivation tracée, 401/403.

**Application livreur (émulateur, APK release live)** : écran *Compte → Annonces vocales* complet
(activation, langue, voix, vitesse, volume, répétition, test, journal). Annonce poussée par le
serveur → **reçue, prononcée et accusée `PLAYED`** :

> « Nouvelle livraison disponible à ACI 2000. Distance 2 kilomètres. Gain estimé 2500 francs CFA.
> Vous avez 20 secondes pour répondre. »

Répétition ×2 : `PLAYED`. Répétition ×3 : une occurrence en `SPEAK_TIMEOUT` (le moteur de l'émulateur
n'a pas rendu la main) — dégradation propre, pas de blocage.

**Application artisan (émulateur, APK release live)** : l'app `malipro_artisan` a reçu la même
couche `lib/novigo/` (session NOVIGO propre, Socket.IO, TTS) + l'écran *Compte → Annonces vocales*
(route `/voix`). Mission de plomberie créée → **le Brain l'attribue à Oumar Touré** (décision
`ASSIGNMENT` journalisée) → l'annonce est **reçue, prononcée et confirmée `PLAYED`** :

> « Nouvelle demande de plombier à Magnambougou. Gain estimé 4048 francs CFA.
> Vous avez 20 secondes pour répondre. »

Deux défauts corrigés au passage : le délai d'initialisation du moteur (3 s) déclarait à tort
« aucun moteur vocal » sur un appareil qui en a un (l'indisponibilité réelle se constate à la
première lecture, pas à l'initialisation) ; et **une voix française non installée** faisait échouer
la lecture en silence — on repli désormais sur la voix par défaut de l'appareil, en le signalant.

**Bambara, vérifié à l'écran (app artisan)** : bascule *Langue → Bambara* dans l'app, puis mission
de plomberie créée par le client. L'annonce est composée par le serveur en bambara, prononcée et
confirmée `PLAYED` :

> « Baara kura bɛ Magnambougou la. I bɛna sɔrɔ fraan 4290. I ka jaabi di sekɔndi 20 kɔnɔ. »

L'appareil n'ayant **aucune voix bambara**, la lecture se fait avec la voix française et l'app
l'affiche noir sur blanc : « Voix bambara absente de l'appareil : lecture avec la voix française ».
La **prononciation est donc approximative** — le texte est bien en bambara, pas l'accent. Une vraie
voix bambara suppose une synthèse cloud (§13 du cahier des charges).

**Tests unitaires** : 16 tests dédiés (`src/voice-dispatch/voice-dispatch.spec.ts`), suite Nest totale
452 tests verts ; `flutter analyze` 0 problème.

## 8. Non livré (assumé)

- **Lecture écran verrouillé / application fermée** : le canal push est implémenté côté serveur
  (message *data* prêt à lire), mais l'application ne prononce l'annonce que lorsqu'elle tourne.
  Le faire écran éteint demande un *background handler* `firebase_messaging` + TTS en isolate,
  **et** un vrai projet Firebase (`FCM_SERVER_KEY`, `google-services.json`) que la plateforme n'a pas
  encore. Aujourd'hui `PUSH_PROVIDER=console` : le canal réellement exercé est Socket.IO.
- **Bambara** : la mécanique est complète (choix de langue, repli si la voix manque), mais les
  phrases sont une **première rédaction à faire relire par un locuteur natif** avant production.
  Aucun moteur Android/iOS n'embarque de voix bambara : viser une synthèse cloud (§13) pour du vrai
  bambara parlé.
- **Application artisan** : elle embarque désormais les annonces vocales, mais elle reste
  l'application **historique MALIPRO** (thème vert, Riverpod/go_router) — elle n'a pas été
  reconstruite en natif NOVIGO. Le module vocal y ouvre sa **propre session NOVIGO**, indépendante
  de l'authentification historique ; `--dart-define=NOVIGO_VOICE_HOME=true` ouvre directement
  l'écran des annonces (démonstration).
- **Commandes vocales** (répondre « j'accepte » à la voix) : évolution §13, non commencée.
