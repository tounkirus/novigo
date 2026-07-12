// NOVIGO — matrice RBAC (permissions granulaires par rôle).
//
// Les permissions sont dérivées des rôles globaux (User.roles). Le *scoping*
// multi-tenant (quel établissement) est résolu séparément côté service
// (resolveMerchant : propriétaire OU membre du staff).

export type Permission =
  | "store:read"
  | "store:write"
  | "product:read"
  | "product:write"
  | "product:delete"
  | "order:read"
  | "order:manage" // accepter / refuser / changer le statut
  | "wallet:read"
  | "wallet:payout"
  | "report:read"
  | "staff:manage"
  | "merchant:admin"; // supervision plateforme des commerçants

/// Jeu complet (pour les rôles plateforme).
const ALL: Permission[] = [
  "store:read", "store:write",
  "product:read", "product:write", "product:delete",
  "order:read", "order:manage",
  "wallet:read", "wallet:payout",
  "report:read", "staff:manage", "merchant:admin",
];

/// Permissions accordées par rôle global. Un rôle absent ⇒ aucune permission ici.
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL,

  // Propriétaire de l'établissement : contrôle total sur SON commerce.
  MERCHANT: [
    "store:read", "store:write",
    "product:read", "product:write", "product:delete",
    "order:read", "order:manage",
    "wallet:read", "wallet:payout",
    "report:read", "staff:manage",
  ],
  // Manager : gère produits, commandes, boutique et rapports — pas les retraits ni le staff.
  MERCHANT_MANAGER: [
    "store:read", "store:write",
    "product:read", "product:write", "product:delete",
    "order:read", "order:manage",
    "report:read", "wallet:read",
  ],
  // Caissier : encaisse et suit les commandes ; lecture wallet.
  CASHIER: ["store:read", "product:read", "order:read", "order:manage", "wallet:read"],
  // Préparateur : voit et fait avancer les commandes.
  ORDER_PREPARER: ["store:read", "product:read", "order:read", "order:manage"],

  // Support : lecture seule sur le périmètre concerné.
  SUPPORT_MERCHANT: ["store:read", "product:read", "order:read", "report:read", "merchant:admin"],
  SUPPORT_AGENT: ["order:read"],
  SUPPORT_CUSTOMER: ["order:read"],
  SUPPORT_DRIVER: ["order:read"],

  // Aucun accès commerçant.
  CUSTOMER: [],
  DRIVER: [],
  ARTISAN: [],
};

/// Union des permissions pour un ensemble de rôles.
export function permissionsForRoles(roles: string[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const r of roles) {
    for (const p of ROLE_PERMISSIONS[r] ?? []) set.add(p);
  }
  return set;
}

/// Vrai si les rôles couvrent TOUTES les permissions requises.
export function hasAllPermissions(roles: string[], required: Permission[]): boolean {
  if (required.length === 0) return true;
  const owned = permissionsForRoles(roles);
  return required.every((p) => owned.has(p));
}
