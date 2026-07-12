"use client";

import * as React from "react";
import { avatar } from "@/mock/images";

/** Rôles de la plateforme NOVIGO. */
export type Role = "client" | "driver" | "merchant" | "provider" | "admin" | "superadmin";

export type Permission =
  | "orders.view" | "orders.manage" | "catalog.manage" | "wallet.view" | "wallet.payout"
  | "cash.manage" | "cash.validate" | "users.manage" | "wallets.admin" | "system.manage" | "analytics.view";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  client: ["orders.view", "wallet.view"],
  driver: ["orders.view", "orders.manage", "wallet.view", "wallet.payout", "cash.manage"],
  merchant: ["orders.view", "orders.manage", "catalog.manage", "wallet.view", "wallet.payout", "analytics.view"],
  provider: ["orders.view", "orders.manage", "wallet.view", "wallet.payout", "analytics.view"],
  admin: ["orders.view", "orders.manage", "wallet.view", "wallets.admin", "cash.validate", "users.manage", "analytics.view"],
  superadmin: ["orders.view", "orders.manage", "catalog.manage", "wallet.view", "wallet.payout", "cash.manage", "cash.validate", "users.manage", "wallets.admin", "system.manage", "analytics.view"],
};

export interface SessionUser {
  role: Role;
  name: string;
  avatar: string;
  email: string;
}

export const DEMO_ACCOUNTS: Record<Role, SessionUser> = {
  client: { role: "client", name: "Seydou Tounkara", avatar: avatar("Seydou Tounkara"), email: "client@novigo.ml" },
  driver: { role: "driver", name: "Ibrahim Coulibaly", avatar: avatar("Ibrahim Coulibaly"), email: "livreur@novigo.ml" },
  merchant: { role: "merchant", name: "Fatoumata Traoré", avatar: avatar("Fatoumata Traore"), email: "merchant@novigo.ml" },
  provider: { role: "provider", name: "Boubacar Sissoko", avatar: avatar("Boubacar Sissoko"), email: "pro@novigo.ml" },
  admin: { role: "admin", name: "Aïssata Diarra", avatar: avatar("Aissata Diarra"), email: "admin@novigo.ml" },
  superadmin: { role: "superadmin", name: "Modibo Keïta", avatar: avatar("Modibo Keita"), email: "superadmin@novigo.ml" },
};

/** Mot de passe unique des comptes de démonstration. */
export const DEMO_PASSWORD = "123456";

/**
 * Identifiants de démonstration : e-mail → rôles accessibles.
 * Le Super Admin a accès à TOUS les espaces (déclenche le sélecteur « Choisir votre espace »).
 * Les autres comptes sont mono-rôle (redirection automatique).
 */
export const DEMO_CREDENTIALS: { email: string; roles: Role[] }[] = [
  { email: "client@novigo.ml", roles: ["client"] },
  { email: "livreur@novigo.ml", roles: ["driver"] },
  { email: "merchant@novigo.ml", roles: ["merchant"] },
  { email: "pro@novigo.ml", roles: ["provider"] },
  { email: "admin@novigo.ml", roles: ["admin"] },
  { email: "superadmin@novigo.ml", roles: ["client", "driver", "merchant", "provider", "admin", "superadmin"] },
];

/** Authentifie un couple e-mail/mot de passe démo → rôles autorisés, ou null. */
export function authenticate(email: string, password: string): Role[] | null {
  const acc = DEMO_CREDENTIALS.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
  if (!acc || password !== DEMO_PASSWORD) return null;
  return acc.roles;
}

export const ROLE_HOME: Record<Role, string> = {
  client: "/",
  driver: "/driver",
  merchant: "/merchant",
  provider: "/pro",
  admin: "/admin",
  superadmin: "/admin/system",
};

interface SessionCtx {
  user: SessionUser;
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
  can: (perm: Permission) => boolean;
}

const Ctx = React.createContext<SessionCtx | null>(null);
const KEY = "novigo.session.v1";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role>("client");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY) as Role | null;
      if (raw && DEMO_ACCOUNTS[raw]) setRole(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const login = React.useCallback((r: Role) => {
    setRole(r);
    try {
      localStorage.setItem(KEY, r);
    } catch {
      /* ignore */
    }
  }, []);

  const logout = React.useCallback(() => login("client"), [login]);

  const value = React.useMemo<SessionCtx>(
    () => ({
      role,
      user: DEMO_ACCOUNTS[role],
      login,
      logout,
      can: (perm) => ROLE_PERMISSIONS[role].includes(perm),
    }),
    [role, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useSession doit être utilisé dans <SessionProvider>");
  return ctx;
}

export { ROLE_PERMISSIONS };
