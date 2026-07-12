# SP5 — Wallet/Cash avancés + Paiements modulaires — RAPPORT

**Statut : ✅ TERMINÉ & VÉRIFIÉ** — 2026-07-09

## Objectif
Fournisseurs de paiement modulaires (Orange Money, Wave, Moov, Stripe, Espèces) activables/désactivables,
et opérations financières avancées : recharge, cashback, retrait, reversement inter-rôles,
règlement de commande avec commission plateforme.

## Livrables

### Paiements modulaires (`com.novigo.payment`)
- **SPI `PaymentProvider`** (code/label/initiate/verify) + 5 implémentations beans :
  `OrangeMoneyProvider`, `WaveProvider`, `MoovMoneyProvider`, `StripeProvider`, `CashProvider`
  (initiation simulée : USSD, redirection Wave/Stripe).
- **`PaymentProviderRegistry`** : résout un fournisseur par code et vérifie qu'il est **implémenté ET activé**.
- **`PaymentProviderConfig`** (table `payment_providers`) : activation runtime + `fee_bps`, seedée (5 fournisseurs).

### Cycle de paiement (`api/payment`)
- **`PaymentService`** : `initiate` (PENDING + instructions), `confirm` (callback → PAID + effets), `fail`, `list`, `get`,
  `listProviders`, `toggleProvider`.
- **Effets à la confirmation** selon `purpose` :
  - `RECHARGE` → crédite le wallet + **cashback** (cashbackBps).
  - `ORDER` → commande `paymentStatus=PAID` + **règlement** (commission plateforme, net commerçant, frais livreur).
  - `BOOKING` → réservation `paymentStatus=PAID`.
- **`Payment`** (table `payments`) : ref, provider, purpose, amount, status, payer/wallet/target, externalRef, commission.

### Wallet avancé (`api/wallet/WalletService`)
- Primitives `credit`/`debit` (contrôle solde/gel) — `WalletController` refactoré pour déléguer.
- `withdraw` (retrait/cash-out), `transfer` (reversement inter-wallets), `applyCashback`,
  `settleOrder` (commission = subtotal × commissionBps ; net commerçant + frais livreur crédités),
  `getOrCreate` (wallet à la volée par propriétaire/rôle).
- Endpoints ajoutés : `POST /wallets/{id}/withdraw`, `POST /wallets/transfer`.

### Configuration
`NovigoProperties.Payments` : `commissionBps=1000` (10 %), `cashbackBps=100` (1 %).

## Portail de vérification (gate SP5)

| Contrôle | Résultat |
|---|---|
| `mvn -o clean test` | ✅ **12/12** (dont `Sp5PaymentsTest` : providers, recharge+cashback, fournisseur inconnu) |
| Boot **demo** (H2) | ✅ **33 repositories**, 5 fournisseurs seedés |
| Providers (GET public) | ✅ liste des 5 fournisseurs (code/label/enabled/feeBps) |
| Activation/désactivation | ✅ `PATCH .../WAVE?enabled=false` → initiation WAVE **409** ; réactivation OK |
| Recharge + cashback | ✅ +10 000 → solde +10 100 (**cashback 1 %** appliqué) |
| Règlement commande | ✅ paiement ORDER confirmé → commission **300** (10 % de 3000), **net commerçant 2700** crédité |
| Retrait | ✅ `withdraw` 1000 → DEBIT, solde 49 000 |
| Reversement | ✅ `transfer` commerçant→client 500 → TRANSFER_OUT/IN, soldes cohérents |
| Fournisseur inconnu | ✅ **400** ; paiements listés (ADMIN) |
| Boot **dev** (Postgres 16) | ✅ Flyway **V6** appliquée ; `payment_providers` seedé (5) |
| **Frontend intact** | ✅ 68 pages ; 20/20 routes échantillon → **200** |
| Total API | **94 chemins** (+9 vs SP4) |

### Contraintes respectées
- ❌ Aucune modification du Frontend. ❌ Aucune donnée démo supprimée. ❌ Aucune route FE cassée.

## Corrections automatiques appliquées
- `WalletController` refactoré pour déléguer crédit/débit à `WalletService` (source unique de vérité,
  suppression du `record()` dupliqué).
- Test : `HttpURLConnection` (client TestRestTemplate) ne supporte pas `PATCH` → le scénario d'activation/désactivation
  est couvert par la sonde curl live ; le test JUnit vérifie le rejet d'un **fournisseur inconnu (400)**.

## Suite — SP6
Géolocalisation (LocationProvider Google/Mapbox/OSM, tracking, ETA, distance, zones),
Notifications multi-canal (Push/SMS/Email/WhatsApp), Chat WebSocket, Storage (MediaProvider Local/Cloudinary/S3/MinIO).
