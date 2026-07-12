"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getTokens, setTokens, clearTokens } from "@/lib/api/client";
import { login as apiLogin, getProfile } from "@/lib/api/endpoints";
import type { User } from "@/lib/api/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = getTokens();
    if (!tokens?.accessToken) {
      setLoading(false);
      return;
    }
    getProfile()
      .then((res) => setUser(res.data))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function signIn(phone: string, password: string) {
    const res = await apiLogin(phone, password);
    setTokens(res.data);
    setUser(res.data.user ?? (await getProfile()).data);
  }

  function signOut() {
    clearTokens();
    setUser(null);
    if (typeof window !== "undefined") window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return ctx;
}
