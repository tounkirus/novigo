# Plan de migration : Mock → Backend (sans casser le Frontend)

## Principe directeur
Le Frontend Next.js appelle aujourd'hui `api.*` depuis `src/mock/api.ts` (77 endpoints).
On **ne modifie aucun écran ni composant**. On introduit (SP10) une **couche d'accès** qui, selon
un drapeau d'environnement, appelle le backend réel **ou** retombe sur le mock — automatiquement.

## Drapeau d'environnement (Frontend)
```
NEXT_PUBLIC_API_MODE = demo | live        # demo (défaut) = 100 % mock
NEXT_PUBLIC_API_URL  = http://localhost:8081/api/v1
```
- `demo` → comportement actuel inchangé (aucun réseau).
- `live` → appels HTTP au backend ; **si l'appel échoue ou le backend est indisponible → fallback mock**.
  Le Frontend ne plante jamais.

## Forme de l'adaptateur (SP10, additif, non-cassant)
```ts
// src/services/api-client.ts (nouveau fichier — n'altère aucun composant)
import { api as mock } from "@/mock/api";

const MODE = process.env.NEXT_PUBLIC_API_MODE ?? "demo";
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function live<T>(path: string, fallback: () => Promise<T>): Promise<T> {
  if (MODE !== "live") return fallback();
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch {
    return fallback();          // ← fallback mock automatique
  }
}

// Ex. : export const api = { stores: (q) => live(`/stores?...`, () => mock.stores(q)), ... }
```
`src/mock/api.ts` reste la source de vérité du mode démo ; l'adaptateur le **réexporte** en le
« sur-chargeant » quand `live`. Les imports existants (`@/mock/api`) peuvent rester ou pointer vers
l'adaptateur via un simple alias — **zéro changement d'UI**.

## Correspondance endpoints (extrait — complétée au fil des SP)
| Frontend mock | Backend REST (cible) | Sous-phase |
|---|---|---|
| `api.stores(q)` | `GET /api/v1/stores?page&size&sort&q&…` | SP4 |
| `api.storeBySlug(s)` | `GET /api/v1/stores/{slug}` | SP4 |
| `api.serviceProviders(q)` | `GET /api/v1/providers?…` | SP4 |
| `api.walletAccount(role)` | `GET /api/v1/wallets/me` | SP5 |
| `api.cashDashboard()` | `GET /api/v1/cash/dashboard` | SP5 |
| `api.pay(amount)` | `POST /api/v1/payments` | SP6 |
| `api.platformOverview()` | `GET /api/v1/admin/overview` | SP4 |
| … (77 au total) | … | SP4–SP7 |

## Ordre de bascule (sans régression)
1. SP2–SP7 : livrer les endpoints backend, testés et documentés (Swagger).
2. SP10 : livrer l'adaptateur (défaut `demo` → rien ne change).
3. Bascule progressive **par domaine** en `live`, chaque domaine gardant son fallback mock.
4. Recette : rejouer le test des 68 routes Frontend en `demo` **et** en `live` (parité).

## Garanties
- Aucune route Frontend cassée (fallback systématique).
- Le mode démo reste pleinement fonctionnel et hors-ligne.
- Rollback instantané : repasser `NEXT_PUBLIC_API_MODE=demo`.
