# NOVIGO — Rapport de sécurité

> État réel au niveau du code livré. « Implémenté » = présent et vérifié statiquement
> (tests unitaires sur mocks) ; non validé par audit dynamique / pentest.

## 1. Contrôles implémentés
| Domaine | Mesure |
|---|---|
| Authentification | JWT access + refresh ; **denylist Redis** (le logout révoque le refresh) |
| Autorisation | RBAC (`@Roles` + `RolesGuard`) ; **contrôles de propriété** sur toutes les ressources utilisateur (adresses, favoris, livraisons, tickets, devis…) |
| OTP | Code hashé (bcrypt), expiration 5 min, **max 5 tentatives** (verrouillage), **max 5 demandes/heure** |
| Webhooks paiement | **Signature HMAC-SHA256**, **anti-rejeu** (dédup persistée), idempotence, traitement asynchrone + DLQ |
| En-têtes HTTP | `helmet` |
| Anti-abus | **Rate limiting** global (`@nestjs/throttler`) |
| Secrets | Injectés par variables d'env / Secret K8s ; jamais en dur dans le code |
| Journalisation | Logs structurés JSON (Loki), audit `AuditLog`, `PaymentEvent`, `EmailLog`, `WebhookEvent` |
| Validation entrées | `class-validator` (whitelist, transform) sur les DTO |
| Transport | CORS restreint par `CORS_ORIGIN` ; TLS via l'Ingress |
| Données | Chiffrement au repos délégué à l'infra (volumes/DB managée) |

## 2. Écarts connus / risques ouverts
| Risque | Gravité | Recommandation |
|---|---|---|
| Refresh token stocké côté client (pas de cookie httpOnly) | Moyen | Migrer vers cookie httpOnly + CSRF (refonte front+back) |
| Secrets par défaut dans `values.yaml` | Élevé (si non surchargés) | Vault / Sealed Secrets ; rotation des clés |
| Pas de WAF / anti-DDoS applicatif | Moyen | WAF au niveau ingress/CDN |
| Migrations non versionnées (baseline à générer) | Moyen | `prisma migrate` en CI avant déploiement |
| Signature webhook vérifiée sur corps re-sérialisé | Faible-Moyen | Vérifier sur le **raw body** (middleware dédié) |
| Pas de chiffrement applicatif des PII sensibles | Moyen | AES-256 au niveau champ si exigé par l'APDP |
| Couverture de tests partielle (unitaires sur mocks) | Moyen | Tests d'intégration sur vraie base + pentest |

## 3. Conformité
- Journaux d'audit chaînables présents ; adapter la rétention aux exigences **loi n°2013-015/APDP** (Mali).
- Minimisation : ne journaliser ni OTP, ni mots de passe, ni tokens.

## 4. Recommandations prioritaires (avant prod)
1. Secrets externes + rotation.
2. Cookie httpOnly pour le refresh + CSRF.
3. Migrations versionnées en CI.
4. Vérification signature webhook sur raw body.
5. Tests d'intégration + scan dépendances (SCA) + pentest.
