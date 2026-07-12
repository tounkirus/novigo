# SP6 — Géolocalisation, Notifications multi-canal, Chat WebSocket, Stockage — RAPPORT

**Statut : ✅ TERMINÉ & VÉRIFIÉ** — 2026-07-09

## Objectif
Quatre modules d'infrastructure modulaires (fournisseurs interchangeables), sans modifier le Frontend :
géolocalisation, notifications multi-canal, messagerie temps réel, stockage de médias.

## Livrables

### 1. Géolocalisation (`com.novigo.location`)
- **SPI `LocationProvider`** (distance/ETA Haversine + géocodage simulé) + 3 beans : `OSM`, `GOOGLE`, `MAPBOX`
  (vitesses moyennes distinctes), fournisseur actif via `novigo.location.provider` (OSM par défaut).
- **`LocationService`** : distance+ETA, géocodage, ville la plus proche, **suivi de commande** (position livreur + ETA).
- **`LocationController`** : `GET /location/{providers,distance,geocode,nearest-city}` (public) + `/location/tracking/orders/{id}`.

### 2. Notifications multi-canal (`com.novigo.notification`)
- **SPI `NotificationChannel`** + 5 canaux : `InAppChannel` (persiste), `Push/Sms/Email/WhatsApp` (journalisés, cibles email/téléphone résolues).
- **`NotificationDispatcher`** : diffusion sur N canaux (IN_APP par défaut), résolution de la cible par utilisateur.
- Endpoints : `GET /notifications/channels`, `POST /notifications/dispatch` (ADMIN, **202**).

### 3. Chat temps réel (`com.novigo.chat` + WebSocket)
- **`WebSocketConfig`** : STOMP, handshake `/ws` (SockJS), broker `/topic`, préfixe `/app`.
- **`ChatMessage`** (table `chat_messages`, migration **V7**) + repo (historique, conversations d'un user).
- **`ChatService`** : persiste + **diffuse** via `SimpMessagingTemplate` sur `/topic/conversations/{id}`.
- **`ChatController`** : REST `POST /chat/messages`, `GET /chat/conversations[/{id}/messages]` + `@MessageMapping("/chat.send")`.

### 4. Stockage de médias (`com.novigo.storage`)
- **SPI `StorageProvider`** + 4 beans : `LOCAL` (écrit sur disque), `CLOUDINARY`/`S3`/`MINIO` (URL simulée),
  actif via `novigo.storage.provider` (LOCAL par défaut).
- **`StorageService`** : stocke via le provider actif puis **persiste un `Media`**.
- **`StorageController`** : `GET /storage/providers` (public), `POST /storage/upload` (multipart), `DELETE /storage/{id}`.

## Portail de vérification (gate SP6)

| Contrôle | Résultat |
|---|---|
| `mvn -o clean test` | ✅ **17/17** (dont `Sp6ModulesTest` : 5 tests — distance, dispatch, chat, storage, handshake WS) |
| Boot **demo** (H2) | ✅ **34 repositories**, contexte complet |
| Géoloc distance/ETA | ✅ 7,768 km → **18,6 min** (OSM actif @25 km/h) ; ville proche = Bamako |
| Notifications | ✅ 5 canaux ; dispatch **202** ; IN_APP persisté ; SMS/WhatsApp→téléphone, Email→email, Push→userId (logs) |
| Chat | ✅ envoi **201**, historique **1**, liste des conversations ; **`/ws/info` (SockJS) → 200** |
| Stockage | ✅ 4 fournisseurs (LOCAL actif) ; **upload multipart** → fichier écrit sur disque (14 o) + `Media` persisté |
| Boot **dev** (Postgres 16) | ✅ Flyway **V7** appliquée ; **38 tables** ; `chat_messages` présente |
| **Frontend intact** | ✅ 68 pages ; 20/20 routes échantillon → **200** |

### Contraintes respectées
- ❌ Aucune modification du Frontend. ❌ Aucune donnée démo supprimée. ❌ Aucune route FE cassée.

## Notes d'implémentation
- Handshake WebSocket `/ws/**` ouvert dans `SecurityConfig` ; endpoints utilitaires GET (location, storage providers) publics.
- Providers externes (Google/Mapbox, Push/SMS/Email/WhatsApp, Cloudinary/S3/MinIO) **simulés** en démo/dev
  (calcul local / journalisation / URL déterministe) — remplaçables par de vrais SDK en production sans changer l'API.
- Dossier `uploads/` (stockage LOCAL) ajouté au `.gitignore`.

## Suite — SP7
Observabilité (Micrometer/Prometheus, traces, logs structurés), durcissement sécurité,
intégration Redis (cache/sessions) et RabbitMQ (événements asynchrones : notifications, règlements).
