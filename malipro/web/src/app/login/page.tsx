"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("+223");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(phone, password);
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-shell px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-mono font-bold">
            M
          </span>
          <div className="leading-tight">
            <p className="font-semibold">NOVIGO</p>
            <p className="text-[11px] text-white/50">Console d'administration</p>
          </div>
        </div>
        <div className="rounded-xl bg-surface p-6 shadow-card">
          <h1 className="text-lg font-semibold text-ink">Connexion</h1>
          <p className="mt-1 text-sm text-muted">Accès réservé aux opérateurs.</p>

          <div className="mt-5 space-y-3">
            <div>
              <label htmlFor="login-phone" className="mb-1 block text-xs font-medium text-ink">Téléphone</label>
              <Input
                id="login-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+22370000000"
                inputMode="tel"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-xs font-medium text-ink">Mot de passe</label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-error-soft px-3 py-2 text-xs text-error">
              {error}
            </p>
          )}

          <Button className="mt-5 w-full" onClick={onSubmit} disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
          <div className="mt-1 h-px bg-gold/60" />
        </div>
      </div>
    </div>
  );
}
