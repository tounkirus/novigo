# NOVIGO client-web — Référence API (pour construire des pages cohérentes)

Projet **Next.js 14 App Router + TypeScript strict + Tailwind + Framer Motion + Radix + Lucide**.
Racine app : `src/app/(app)/` (déjà enveloppée par `AppShell` → header + bottom nav + panier).
Alias imports : `@/*` → `src/*`. Langue UI : **français**. Monnaie : **FCFA** (entiers).

## Règles d'or
- **Déterminisme** : n'utilise JAMAIS `Math.random()` ni `Date.now()` (utilise `NOW` de `@/constants`). Les données mock sont déjà déterministes.
- `"use client"` uniquement si le fichier utilise hooks/état/événements/framer-motion. Sinon, garde des **Server Components** qui lisent les sélecteurs mock et passent la donnée à des composants clients.
- Prix : `formatFcfa(n)` de `@/lib/utils`. Jamais de prix en dur formaté à la main.
- Images : `next/image` avec `fill` + `sizes` obligatoire, conteneur `relative overflow-hidden bg-shell`.
- Aucune page/section vide : toujours des données mock. Aucune erreur TS, aucun import inutilisé (tsconfig `noUnusedLocals`).
- Texte principal `text-ink`, secondaire `text-muted`, fonds `bg-surface` (cartes) / `bg-shell` (page), bordures `border-line`. Accent marque `text-brand` / `brand-gradient` / `bg-brand-soft`. Ombres `shadow-card` / `shadow-lifted`. Rayons `rounded-2xl`/`rounded-xl`. Le dark mode est automatique via ces tokens.
- Titres de page : commence par un `PageHeader` (voir plus bas) ou un `<h1 className="text-2xl font-black tracking-tight text-ink">`.
- Conteneur de page : `<div className="px-4 py-4 space-y-6">…`.

## Design system (`@/components/ui/*`)
- `button` → `Button` (props: `variant`: primary|secondary|gold|outline|ghost|subtle|danger|success ; `size`: sm|md|lg|icon|icon-sm|pill ; `block`, `loading`, `asChild`). Ex: `<Button asChild><Link href="…">Texte</Link></Button>`.
- `card` → `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter`.
- `badge` → `Badge` (`tone`: brand|gold|success|error|info|warning|neutral|solid).
- `chip` → `Chip` (`active`, `icon`, `count`, onClick).
- `input` → `Input` (props: `icon`, `suffix`), `Textarea`, `Label`.
- `select` → `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` (Radix, value/onValueChange sur `Select`).
- `checkbox` → `Checkbox` (checked/onCheckedChange). `radio` → `RadioGroup, RadioGroupItem` (value/onValueChange). `switch` → `Switch` (checked/onCheckedChange).
- `dialog` → `Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose`.
- `sheet` (Drawer/Bottom sheet) → `Sheet, SheetTrigger, SheetContent (side: right|left|bottom), SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose`.
- `tabs` → `Tabs, TabsList, TabsTrigger, TabsContent` (value/onValueChange, defaultValue).
- `accordion` → `Accordion (type="single" collapsible), AccordionItem (value), AccordionTrigger, AccordionContent`.
- `dropdown` → `DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator`.
- `toast` → hook `useToast()` → `toast({ title, description?, tone?: success|error|info })`.
- `rating` → `Rating` ({value, count?, size?}), `StarInput` ({value, onChange}).
- `price` → `Price` ({value, oldValue?, size?: sm|md|lg}).
- `misc` → `Avatar` ({src, alt, size}), `Progress` ({value 0-100}), `Segmented` ({options:[{value,label}], value, onChange}), `QuantityStepper` ({value,onChange,min,max,size}), `Divider`.
- `states` → `EmptyState` ({icon?, title, description?, action?}), `NoResults` ({query?}), `ErrorState`, `OfflineState`.
- `skeleton` → `Skeleton` ({className}), `SkeletonText` ({lines}).
- `kpi-card` → `KpiCard` ({label, value, delta?, icon?, hint?}).
- `charts` → `AreaTrend`, `BarSeries`, `LineDuo`, `DonutChart` (tous prennent `{data: SeriesPoint[], height?}`). `SeriesPoint = {label, value, secondary?}`.
- `carousel` → `HScroll` (rangée scroll horizontale), `Carousel` ({slides:[{id,content}]}).

## Composants partagés (`@/components/shared/*`)
- `store-card` → `StoreCard` ({store, className?, priority?}), `StoreCardCompact` ({store}).
- `product-card` → `ProductCard` ({product, store, className?}) [carte verticale], `ProductRow` ({product, store}) [ligne menu]. Gèrent l'ajout au panier + sheet d'options.
- `product-sheet` → `ProductSheet` ({product, store, open, onOpenChange}).
- `favorite-button` → `FavoriteButton` ({storeId, size?}).
- `badges` → `StoreBadges` ({badges, max?}), `OpenStatus` ({isOpen}).
- `section` → `SectionHeader` ({title, subtitle?, href?, action?}), `Section` (wrapper `py-4`).
- `icon` → `Icon` ({name: string Lucide, ...props}) rend une icône Lucide par nom.

## Panier & favoris
- `useCart()` de `@/features/cart/cart-store` → `{ lines, storeId, storeName, count, subtotal, discount, coupon, add, setQuantity, remove, clear, applyCoupon, isForStore }`.
- `useFavorites()` de `@/features/favorites/use-favorites` → `{ ids, toggle(id), has(id) }`.

## Sélecteurs de données (`@/mock`) — tout est synchrone
- `stores(): Store[]` (1450), `storeById(id)`, `storeBySlug(slug)`, `menuOf(store): MenuSection[]`, `productsOf(store): Product[]`, `productById(storeId, productId)`, `reviewsOf(store, count?): Review[]`.
- `queryStores(query): {items: Store[], total}` — query: `{category?, vertical?, q?, sort?: rating|delivery|distance|popular, freeDelivery?, openNow?, maxDeliveryFee?, page?, pageSize?}`.
- `popularStores(n)`, `topRatedStores(n)`, `newStores(n)`, `freeDeliveryStores(n)`, `fastStores(n)`, `recommendedStores(n)`, `favoriteStores()`.
- `categories(): Category[]`, `search(q): {stores, products}`, `featuredProducts(): Product[]`.
- `user: UserProfile` (adresses, paymentMethods, wallet, favoris). `orders(): Order[]` (26, dont 1 active), `orderById(id)`, `activeOrder()`.
- `coupons: Coupon[]` (48), `promotions: Promotion[]` (16), `notifications: Notification[]` (24), `drivers(): Driver[]` (220).
- Dashboards : `revenueSeries(days?, seed?)`, `hourlySeries(seed?)`, `categoryShare()` → `SeriesPoint[]`.
- Constantes `@/constants` : `BRAND, NOW, VERTICALS, STORE_CATEGORY_LABEL, STORE_CATEGORY_VERTICAL, ORDER_STATUS (label/tone/step), ORDER_FLOW, PAYMENT_LABEL, BADGE_LABEL, BAMAKO_DISTRICTS, DATASET_TARGETS`.

## Types (`@/types`)
`Store, Product, MenuSection, Review, StorePromotion, StoreFaq, Category, Coupon, Order, OrderStatus, OrderItem, Address, PaymentMethod, PaymentMethodType, Driver, Notification, UserProfile, Promotion, SeriesPoint, Badge`.

## Utils (`@/lib/utils`)
`cn, formatFcfa, formatCompact, formatDistance, formatRating, timeAgo(iso), formatDate(iso), formatTime(iso), discountPercent, slugify, groupBy, sumBy, clamp`. Pour les dates relatives passe `NOW` : `timeAgo(iso, NOW)`.

## Pattern de page type (Server Component)
```tsx
import { Section, SectionHeader } from "@/components/shared/section";
import { popularStores } from "@/mock";
import { StoreCard } from "@/components/shared/store-card";

export default function Page() {
  const items = popularStores(12);
  return (
    <div className="px-4 py-4 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-ink">Titre</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => <StoreCard key={s.id} store={s} />)}
      </div>
    </div>
  );
}
```
Pour `generateMetadata` sur pages dynamiques : `export async function generateMetadata({ params }): Promise<Metadata>`.
Pages dynamiques `[slug]` : `notFound()` de `next/navigation` si introuvable.

---

# ADDENDUM V2 — Nouveaux utilitaires & modules

## Socle animations/états (À UTILISER pour tout nouvel écran)
- `@/lib/motion` : variants prêts `fadeUp, fadeIn, scaleIn, slideInRight, staggerContainer(stagger,delay), staggerItem, pageVariants` + transitions `spring, springSoft, easeOut` + `tap`, `hoverLift`.
- `@/components/ui/reveal` : `<Reveal delay?>` (apparition au scroll), `<RevealGroup stagger?>` + `<RevealItem>` (cascade). Enveloppe les sections/cartes.
- `@/components/ui/skeletons` : `StoreCardSkeleton, ProductCardSkeleton, ListRowSkeleton, RailSkeleton({count,card}), GridSkeleton({count,card}), KpiRowSkeleton, TableSkeleton({rows,cols}), ChartSkeleton({height})`.
- `@/components/ui/async-state` : `<AsyncState loading error empty skeleton emptyState onRetry>{content}</AsyncState>` et `<QueryState query={q} skeleton isEmpty={(d)=>...}>{(data)=>...}</QueryState>` (pont TanStack Query).
- `@/components/ui/smart-image` : `<SmartImage>` (props next/image) — image optimisée + skeleton + fondu. Le conteneur doit être `relative`.
- `@/hooks` : `useDebounce, useMediaQuery, useIsDesktop, useCopy, useReducedMotion, useScrolled, useCountUp`.

## API Mock asynchrone (`@/mock/api` → `api`)
Toutes les méthodes renvoient des **Promesses** (latence simulée) → à consommer via **TanStack Query** (`useQuery`) dans des composants clients, pour de vrais états loading/skeleton/erreur.
Méthodes : `api.stores(query?)`, `storeBySlug(slug)`, `categories()`, `search(q)`, `favorites()`, `popular(n)`, `recommendations()` (→ items `{id,reason,score,store}`), `wallet()`, `billers()`, `billHistory()`, `operators()`, `bundles(operatorId)`, `loyalty()`, `referral()`, `premiumPlans()`, `rideQuote(from,to)`, `nearbyDrivers(mode)`, `trips()`, `parcelQuotes()`, `parcels()`, `chatThreads()`, `chatMessages(threadId)`, `adCampaigns()`, `pay(amount)`, `topUp(amount)`.
Pattern : `const q = useQuery({ queryKey: ["wallet"], queryFn: () => api.wallet() });` puis `<QueryState query={q} skeleton={<...>}>{(data)=>...}</QueryState>`.
Alternative synchrone (Server Components) : les générateurs de `@/mock/modules` sont aussi importables directement (`generateWallet()`, etc.).

## Types modules (`@/types/modules`)
`Wallet, WalletTx, Biller, BillHistory, Operator, AirtimeBundle, LoyaltyTier, LoyaltyState, Reward, Referral, PremiumPlan, RideMode, RideQuote, RideOption, RideDriverNearby, Trip, ParcelQuote, Parcel, ChatThread, ChatMessage, AiRecommendation, AdCampaign`. Constantes fidélité : `LOYALTY_TIERS` (dans `@/mock/modules`).

## Règles V2
- Nouveaux écrans clients = dans `src/app/(app)/<route>/` (héritent header + bottom-nav + panier).
- Privilégie `useQuery` + `<QueryState>` + skeletons de domaine pour CHAQUE bloc de données (jamais d'écran nu pendant le chargement).
- Anime les entrées avec `<Reveal>`/`<RevealGroup>`. Micro-interactions : `whileTap={{scale:0.97}}`, `whileHover`.
- Accessibilité : `aria-label` sur boutons icônes, `focus-visible` déjà géré, sémantique correcte, contrastes via tokens.
- Montants via `formatFcfa`. Jamais Math.random/Date.now. Français partout.

---

# ADDENDUM V2 — Back-office (CMS / CRM / ERP / Super Admin)

Les pages back-office vivent sous `src/app/admin/*` et héritent du `DashboardShell` (via `src/app/admin/layout.tsx` déjà mis à jour — NE PAS le modifier). Ce sont des espaces PRO (pas de header/bottom-nav client). La nav latérale est groupée (Opérations / Croissance / Gestion / Système).

## Table & pagination (`@/components/dashboard/data-table`)
- `<DataTable columns={Column<T>[]} rows={T[]} getRowKey={(r,i)=>string} minWidth? empty? />`. `Column<T> = { key, header, cell:(row)=>ReactNode, align?, className?, headClassName? }`.
- `<Pagination page pageCount total onPage />`.

## API back-office (`@/mock/api` → `api`, async/Promesses)
`api.cmsBanners()`, `cmsPages()`, `cmsCollections()`, `cmsMedia()`, `crmCustomers(count?)`, `crmSegments()`, `supportTickets()`, `inventory()`, `suppliers()`, `invoices()`, `financeSummary()`, `roles()`, `featureFlags()`, `systemServices()`, `auditLogs()`, `adCampaigns()`.
Charts/series : `revenueSeries(days?)`, `hourlySeries()`, `categoryShare()` de `@/mock`. KPIs plateforme : `DATASET_TARGETS`.

## Types back-office (`@/types/backoffice`)
`CmsBanner, CmsPage, CmsCollection, MediaAsset, CrmCustomer, CustomerSegment, CrmSegment, SupportTicket, InventoryItem, Supplier, Invoice, FinanceSummary, Role, FeatureFlag, SystemService, AuditLog`.

## Règles back-office
- Pages CLIENT (`"use client"`) : `useQuery` + `api` + `<QueryState>` + skeletons (`TableSkeleton`, `KpiRowSkeleton`, `ChartSkeleton`). Sous-sections via `Tabs`.
- Conteneur page dashboard : `<div className="space-y-6 p-4 sm:p-6">`. Titre `<h1 className="text-xl font-bold text-ink">` + sous-titre `text-muted` si utile.
- Statuts colorés via `Badge` (tone success/warning/error/info/neutral). Montants `formatFcfa`/`formatCompact`. Graphiques via `@/components/ui/charts`.
- Français, aucun import inutilisé, jamais Math.random/Date.now.

---

# ADDENDUM PHASE 3 — Apps par rôle, Wallet & Cash

## Authentification / rôles (`@/features/auth/session`)
- `useSession()` → `{ user:{role,name,avatar,email}, role, login(role), logout(), can(perm) }`. Rôles : `client|driver|merchant|admin|superadmin`. `ROLE_HOME[role]`, `DEMO_ACCOUNTS`. Écran `/login` (sélecteur de rôle). Le `DashboardShell` affiche déjà le menu de session (changer d'espace / déconnexion).

## Wallet & Cash — types (`@/types/wallet`)
`WalletAccount, WalletTransaction, WalletTxKind, WalletTxStatus, WalletMethod, WalletRole, DriverWalletSummary, MerchantWalletSummary, AdminFinanceOverview, PayoutRequest, CashRegister, CashRemittance, CashReconciliation, CashDiscrepancy, CashDashboard, RemittanceMethod, RemittanceStatus`.

## Wallet & Cash — API (`api`, async)
`api.walletAccount(role, ownerId?, ownerName?)`, `walletAccounts(count?)`, `driverWalletSummary()`, `merchantWalletSummary()`, `adminFinanceOverview()`, `payoutRequests()`, `cashRegister()`, `cashRegisters(count?)`, `cashRemittances()`, `cashReconciliations()`, `cashDiscrepancies()`, `cashDashboard()`, `requestPayout(amount)`, `declareRemittance(amount)`.

## Composants Wallet réutilisables (NE PAS dupliquer — `@/features/wallet/shared`)
- `<WalletBalanceCard label balance pending? pendingLabel? actions? gradient? footer? />` (`wallet-ui`).
- `<StatTiles items={StatTile[]} cols? />` — `StatTile={label,value,icon?,tone?,money?}`.
- `<TransactionList transactions title? />` (`transaction-list`) — recherche, filtres, export CSV, reçu (dialog + download). 
- Utilitaires `tx-utils` : `KIND_LABEL, STATUS_META, METHOD_LABEL, transactionsToCsv, downloadFile, receiptText`.

## Temps réel (`@/features/realtime/use-live-feed`)
- `useLiveFeed(role, {toasts?})` → `LiveEvent[]` : émet des notifications live (WebSocket mock) toutes les ~12s + toasts. Rôles `driver|merchant|admin`.
- Carte : `<MapView markers? progress? height? />` de `@/services/map-view`. Paiement : `charge(input)` de `@/services/payments`.

## Règles Phase 3
- Pages pro (`/driver`, `/merchant`, `/admin`) : CLIENT, `useQuery`+`api`+`<QueryState>`+skeletons, conteneur `space-y-6 p-4 sm:p-6`, titres `text-xl font-bold text-ink`. RÉUTILISER les composants Wallet partagés (aucune duplication). Français, `formatFcfa`, jamais Math.random/Date.now.

---

# ADDENDUM PHASE 3.2/3.3 — Commerçant & Centre financier Admin

## API additionnelles (`api`, async)
`api.kitchenTickets()` (→ KitchenTicket[]), `api.fraudAlerts()` (→ FraudAlert[]). Types dans `@/types/ops` (`KitchenTicket, KitchenStatus, FraudAlert, FraudRisk, FraudStatus`).
Déjà dispo (réutiliser) : `api.merchantWalletSummary()`, `api.walletAccount('MERCHANT')`, `api.walletAccounts(count?)`, `api.payoutRequests()`, `api.cashRegisters()`, `api.cashRemittances()`, `api.cashReconciliations()`, `api.cashDiscrepancies()`, `api.cashDashboard()`, `api.adminFinanceOverview()`.

## Catalogue commerçant
Le commerce de référence = `stores()[0]` de `@/mock` ; ses produits via `productsOf(stores()[0])` et menus via `menuOf(stores()[0])` (`@/mock`). Type `Product`, `MenuSection` (`@/types`). CRUD = état local (useState) + toasts (pas de persistance réelle).

## Rappels
- RÉUTILISER `WalletBalanceCard`, `StatTiles`, `TransactionList` de `@/features/wallet/shared/*` pour tout wallet (aucune duplication).
- `DataTable`/`Pagination` de `@/components/dashboard/data-table`. Charts `@/components/ui/charts`. Skeletons de domaine. `useToast`, `useMutation` (invalider queries).
- Pages pro CLIENT, conteneur `space-y-6 p-4 sm:p-6`, français, `formatFcfa`, jamais Math.random/Date.now.
