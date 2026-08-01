# NOVIGO Brain — intelligence décisionnelle de la plateforme

> Implémentation du chapitre 15 (vision + spécification technique) dans l'existant NOVIGO.
> Le Brain **décide**, les applications **exécutent**. Aucune application (web, client,
> livreur, commerçant) ne calcule un prix, un délai ou une attribution.

## 1. Où vit le Brain

| Élément | Emplacement |
|---|---|
| Moteurs + orchestrateur | `malipro/backend/src/brain/` (NestJS, schéma Postgres `ops`) |
| API publique | `/api/v1/brain/*` — routée vers Nest par défaut au Gateway (`gateway/nginx.conf`) |
| App client (Flutter) | `malipro_client/lib/novigo/data/brain_api.dart` + `brain_widgets.dart` |
| App livreur (Flutter) | `malipro_driver/lib/novigo/data/brain_api.dart` + `brain_widgets.dart` |
| App marchand (Flutter) | `malipro_merchant/lib/novigo/data/brain_api.dart` + `brain_widgets.dart` |
| Web (Next.js) | `malipro/client-web/src/services/backend/brain.ts` + `/admin/brain` |

Le Brain est un **module Nest global** (`BrainModule`) : le domaine ops (commandes,
livraisons) l'appelle, jamais l'inverse.

## 2. Les principes fondateurs, et où ils sont tenus

| Principe | Implémentation |
|---|---|
| n°1 **Single Decision Authority** | `BrainService` est le seul à produire tarif/délai/attribution. `OrdersService` et `DeliveriesService` l'appellent (`onOrderCreated`, `onDeliveryAccepted/Started/Completed`). |
| n°2 **Stateless Applications** | Les apps affichent `price`, `etaMinutes`, `score`, `reasons` reçus. Hors ligne, l'estimation locale est **étiquetée** « estimation hors ligne », jamais présentée comme une décision. |
| n°3 **Explainable Decision** | Table `BrainDecision` : moteur, version, entrées, sortie, `reasons[]`, candidats évalués, confiance, latence, Carré d'Équilibre. Exposée par `GET /brain/decisions/:id`. |
| n°4 **Continuous Learning** | `LearningEngine` + `KnowledgeService` (table `KnowledgeEntry`) : chaque mission terminée met à jour délais par zone/service, préparation du partenaire, trafic horaire, confiance. |
| n°5 **Service Agnostic** | Le modèle central est `Mission` (pas « livraison »). Une commande devient une mission ; un dépannage, une course, un soin aussi. |
| n°6 **Configuration before Development** | `service-catalog.ts` (18 métiers par défaut) + table `ServicePolicy` : déclarer un métier = une ligne de configuration, `POST /brain/services`, **sans redéploiement**. |
| n°7 **Event Driven** | `MissionEvent` (MissionCreated, MissionAssigned, MissionAccepted, MissionCompleted…) + bus RabbitMQ `novigo.events` : publie `mission.created/assigned/accepted/completed/cancelled`, consomme `payment.confirmed/failed`. |

## 3. Les huit moteurs

| Moteur | Fichier | Ce qu'il décide |
|---|---|---|
| Service Decision | `engines/service-decision.engine.ts` | Le meilleur prestataire : proximité 34, confiance 20, note 15, expérience 9, **équité 14**, disponibilité 8. Toute exclusion porte un motif. |
| Smart Pricing | `engines/smart-pricing.engine.ts` | Tarif juste ligne par ligne, majoration bornée par le métier, remise fidélité, tarif partenaire respecté (livraison offerte comprise). |
| Route Intelligence | `engines/route-intelligence.engine.ts` | Préparation + approche + trajet, corrigés par le trafic horaire **appris** et le délai réel du couple (zone, service). |
| Batch | `engines/batch.engine.ts` | Regroupe seulement si le détour imposé au premier client (≤ 8 min) reste inférieur au gain de tournée. |
| Trust | `engines/trust.engine.ts` | Score 0–100 (neutre 50) client / livreur / prestataire / commerçant, amorti tant que l'historique est court. |
| Fraud | `engines/fraud.engine.ts` | Cadence anormale, abus d'annulation, gros montant en espèces, compte du jour. Blocage seulement sur cumul critique. |
| City Intelligence | `engines/city-intelligence.engine.ts` | Demande horaire, offre disponible, tension, heures de pointe, quartiers sous-servis. |
| Learning | `engines/learning.engine.ts` | Écart promis/réel réinjecté dans le Livre de Connaissances + mise à jour des confiances. |

## 4. Le Carré d'Équilibre

Chaque décision de tarification publie quatre notes sur 100 (`BrainDecision.balance`) :
**client** (ponctualité + équité du prix), **prestataire** (part qui lui revient),
**partenaire** (respect du délai), **NOVIGO** (commission). Elles sont affichées
telles quelles dans l'app client (« Pourquoi ce prix ? ») et la console admin.

## 5. Modèle de données (schéma `ops`, migration `20260730000000_brain`)

- `Mission` — unité universelle (référence `NVG-M-AAAA-NNNNNN`, service, statut, client,
  prestataire, `orderId` facultatif, géo, prix, délai, lot).
- `MissionEvent` — journal événementiel de la mission.
- `BrainDecision` — journal explicable de toutes les décisions.
- `ServicePolicy` — configuration des métiers (prime sur le catalogue compilé).
- `TrustScore`, `FraudSignal` — confiance et signaux.
- `KnowledgeEntry` — Livre de Connaissances (moyennes glissantes par périmètre/métrique).
- `Driver.lastLat/lastLng/lastSeenAt` — position, désormais **persistée** (elle était ignorée)
  car elle conditionne le critère de proximité.

Application : `npx prisma migrate deploy` (ou `db push` en démo).

## 6. API

| Route | Rôle |
|---|---|
| `GET /brain/services` | Métiers déclarés |
| `POST /brain/services` *(admin)* | Déclarer/modifier un métier (principe n°6) |
| `POST /brain/quote` | Tarif + délai + détail + raisons + équilibre |
| `POST /brain/missions` | Créer une mission (tous métiers) |
| `GET /brain/missions/mine` | Mes missions (client) |
| `GET /brain/missions/available` *(livreur/artisan)* | Missions ouvertes **classées pour moi** + raisons |
| `GET /brain/missions/:id` · `/decisions` · `/batch` | Mission, décisions, proposition de regroupement |
| `POST /brain/missions/:id/dispatch|accept|start|complete|cancel` | Cycle de vie |
| `GET /brain/decisions/:id` | Explication d'une décision |
| `GET /brain/trust/me` | Ma confiance NOVIGO |
| `GET /brain/insights/merchant` | Ce que le Brain a appris d'un commerce + conseils |
| `GET /brain/insights/city` · `GET /brain/dashboard` *(admin)* | Intelligence ville, tableau de bord |

## 7. Intégration dans le flux existant

```
Client commande (web/Android/iOS)
  └─ OrdersService → Brain.quote(partnerFee = frais boutique)   ← tarif + délai décidés
       └─ commande créée → Brain.onOrderCreated → Mission PENDING (+ décisions journalisées)
Commerçant prépare → livraison libre
  └─ GET /deliveries/available → courses CLASSÉES par le Brain pour CE livreur (+ raisons)
Livreur accepte / démarre / termine
  └─ DeliveriesService → Brain.onDeliveryAccepted/Started/Completed
       └─ LearningEngine : délai réel, confiance, Livre de Connaissances
Spring (finance) → AMQP payment.confirmed → MissionEvent PaymentConfirmed
```

Le tarif **de la boutique reste souverain** : le Brain le reprend et l'explique
(y compris « Livraison offerte »). Sans boutique rattachée, il calcule (distance,
trafic, tension) et applique le tarif minimum du métier.

## 8. Garde-fous appris de la vérification réelle

Trois défauts n'apparaissaient qu'en conditions réelles ; ils sont corrigés et couverts par des tests :

1. **Pas de majoration sans preuve** — aucun livreur en ligne suffisait à porter la tension au
   maximum, donc le surcoût client au plafond (`×1.60`). Tant que la demande d'un quartier n'est pas
   observée (< 5 relevés), la tension est plafonnée à 1,15 → majoration ≤ ×1.06.
2. **Pas de moyenne tirée d'un cas isolé** — le temps de préparation d'un commerce n'est retenu
   qu'à partir de 5 commandes observées (même exigence que les délais de zone), côté moteur
   d'itinéraire **et** côté conseils marchand.
3. **Devis ≠ montant facturé** (vu sur émulateur) — le checkout annonçait 750 FCFA quand la
   commande facturait 1 000 (tarif boutique) : `/brain/quote` ignorait le tarif partenaire tant
   qu'on ne le lui passait pas. Il est désormais **résolu côté serveur** à partir du `storeId`, et
   le champ `partnerFee` a été **retiré du DTO public** (un client ne propose pas son propre prix).
4. **Regroupement et file prestataire trop étroits** — le Batch Engine ne regardait que les missions
   `PENDING/DISPATCHING` : dès l'attribution automatique, il devenait inopérant. Il considère
   désormais toute mission **non démarrée**. De même, `/brain/missions/available` montre au
   prestataire les missions ouvertes **et** celles que le Brain vient de lui attribuer.

## 9. Ce qui est vérifié

**Statique** : `npx jest` **435 tests verts** (61 sur le Brain), `nest build` vert ;
`flutter analyze` **0 erreur** sur les 3 apps ; `next build` **68 pages** dont `/admin/brain`.

**En réel, stack Docker complète (8 conteneurs, Gateway `:8088`)** — script
`scratchpad/brain_e2e.mjs`, **41 vérifications vertes**, tout passant par l'API publique
avec les jetons des 4 rôles :

| Vérifié | Preuve observée |
|---|---|
| Catalogue par configuration | 20 métiers ; `painter` déclaré par `POST /brain/services` **actif immédiatement** (`fromDatabase: true`) |
| Devis explicable | 850 XOF / 18 min, détail `Prise en charge 500 + Distance 304 + Forte demande ×1.06`, 6 raisons, équilibre `{client 96, provider 90, partner 100, novigo 50}` |
| Traçabilité | `GET /brain/decisions/:id` → `SmartPricingEngine v1.0.0 · 7 ms`, entrées et sorties conservées |
| Commande → mission | `MLP-2026-000039` → `NVG-M-2026-000008`, délai et raisons portés par la réponse, **tarif boutique respecté** (1000 XOF) |
| File livreur classée | 11 courses notées et triées, raisons jointes (« À 4.4 km », « 4 mission(s) en cours ») |
| Attribution automatique | `NVG-M-2026-000006` → `ASSIGNED` en un appel, décision `ASSIGNMENT` score 80,16 avec le détail des facteurs (`proximity 33.86`, `fairness 8.4`…) |
| Regroupement | `BATCH-NVG-M-2026-000007` : « 5,9 km et 16 min économisés », retard client 1 min ≤ 8 min |
| Apprentissage | délai réel mémorisé, `KnowledgeEntry` alimentée (15 entrées / 40 observations), `TrustScore` CUSTOMER+DRIVER+MERCHANT mis à jour |
| Bus | exchange `novigo.events` : 32 messages publiés, file `novigo.brain` abonnée à `payment.confirmed/failed` |
| Sécurité | sans jeton → **401**, client sur route admin → **403** |
| Web | `http://localhost:5174/admin/brain` → 200, page rendue (moteurs, décisions, pouls de la ville) |

**Sur les 3 applications Android (émulateurs 5554 client / 5556 livreur / 5558 marchand, APK
release en `NOVIGO_LIVE=true` vers `10.0.2.2:8088`)** — captures dans le scratchpad de session :

- **Client** : catalogue live (« Chez Fatou - ACI 2000 »), carte **« Décision NOVIGO Brain —
  1 000 FCFA · arrivée estimée 12 min »**, feuille « Pourquoi ce prix et ce délai ? » affichant le
  détail, les 7 raisons réelles (dont « Quartier peu observé : tension plafonnée » et « Préparation
  estimée : pas encore assez de commandes observées ») et le Carré d'Équilibre ; commande
  **MLP-2026-000040** passée en live, totaux cohérents (2 500 + 1 000 = 3 500), aucun blocage d'UI.
- **Livreur** (Fanta Sidibé, en ligne) : 11 demandes portant chacune la pastille
  **« Compatibilité 54/100 »**, feuille « Pourquoi cette course ? » (« À 4.3 km », « Excellente note
  client 4.7/5 », « 6 mission(s) en cours ») ; section **« Missions NOVIGO Brain »** avec les
  missions tous métiers notées **« Recommandé · 72/100 »** et leur rémunération.
- **Marchand** (Aux Trois Fleuves) : carte **NOVIGO Brain — Badalabougou**, préparation
  **12 min (estimation)**, confiance **60/100 (fiable)**, heures de pointe 12 h · 13 h · 19 h,
  conseil « prévoyez du personnel » ; la commande du client (**MLP-2026-000040**, 3 500 FCFA)
  arrive dans « Commandes à traiter » — chaîne prouvée bout en bout sur les trois applications.

Couverture : `brain.service.ts` ≈ 81 % de lignes — le seuil global 90 % du projet n'était
**déjà pas** atteint avant cette tranche (`stores.service.ts` 0 %, `redis` 22 %, `storage` 35 %…).

## 10. Reste à faire (non fait, assumé)

- **Console web `/admin/brain` en données réelles** : la page se charge et rend, mais son
  contenu live exige une session admin dans le navigateur ; sans jeton elle affiche le jeu
  de démonstration, explicitement étiqueté comme tel.
- **Position temps réel des artisans** : ils sont localisés par leur `serviceArea`
  (centre de quartier), faute de champ GPS sur `Artisan`.
- **Dispatch automatique des commandes** : la mission d'une commande est créée sans
  attribution immédiate (`autoDispatch: false`) ; l'attribution reste portée par la file
  `/deliveries/available` classée par le Brain. Basculer sur `POST /brain/missions/:id/dispatch`
  quand le commerçant passe la commande en « prête » est la suite naturelle.
- **Seed des `ServicePolicy`** : le catalogue compilé suffit ; aucune ligne n'est seedée en base.
