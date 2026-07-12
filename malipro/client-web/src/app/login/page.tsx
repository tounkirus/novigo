"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, Bike, Store, Wrench, ShieldCheck, Crown, ArrowRight, Sparkles, Mail, Lock, LogIn } from "lucide-react";
import { useSession, ROLE_HOME, DEMO_ACCOUNTS, authenticate, DEMO_PASSWORD, type Role } from "@/features/auth/session";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ROLE_META: Record<Role, { label: string; desc: string; icon: typeof Bike }> = {
  client: { label: "Client", desc: "Commander repas, courses, taxi…", icon: ShoppingBag },
  driver: { label: "Livreur", desc: "Livraisons, gains & caisse", icon: Bike },
  merchant: { label: "Commerçant", desc: "Catalogue, commandes & finances", icon: Store },
  provider: { label: "Prestataire", desc: "Services à domicile & interventions", icon: Wrench },
  admin: { label: "Administrateur", desc: "Back-office & supervision", icon: ShieldCheck },
  superadmin: { label: "Super Administrateur", desc: "Contrôle total de la plateforme", icon: Crown },
};
const ALL_ROLES: Role[] = ["client", "driver", "merchant", "provider", "admin", "superadmin"];

export default function LoginPage() {
  const { login, role: current } = useSession();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState<Role[] | null>(null);

  function enter(role: Role) {
    login(role);
    router.push(ROLE_HOME[role]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const roles = authenticate(email, password);
    if (!roles) {
      setError("E-mail ou mot de passe incorrect. (mot de passe démo : 123456)");
      return;
    }
    if (roles.length === 1) enter(roles[0]);
    else setPending(roles); // plusieurs rôles → sélecteur d'espace
  }

  const gridRoles = pending ?? ALL_ROLES;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-shell px-4 py-10">
      {/* Bande rouge posée au-dessus du fond clair (pas en -z-10, sinon masquée par bg-shell en mode clair). */}
      <div className="brand-gradient pointer-events-none absolute inset-x-0 top-0 h-72" />
      <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lifted">
            <span className="text-2xl font-black text-brand">N</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            NOVI<span className="text-gold">GO</span>
          </h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/85">
            <Sparkles className="h-4 w-4 text-gold" /> {pending ? "Choisissez votre espace" : "Connectez-vous à votre espace"}
          </p>
        </motion.div>

        {!pending && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submit}
            className="mb-6 rounded-2xl border border-line bg-surface p-5 shadow-lifted"
          >
            <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold text-ink">E-mail</label>
            <div className="mb-3 flex h-11 items-center gap-2 rounded-xl border border-line bg-shell px-3">
              <Mail className="h-4 w-4 shrink-0 text-muted" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@novigo.ml"
                autoComplete="username"
                className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </div>
            <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-semibold text-ink">Mot de passe</label>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-line bg-shell px-3">
              <Lock className="h-4 w-4 shrink-0 text-muted" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
                autoComplete="current-password"
                className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </div>
            {error && <p className="mt-2.5 text-[13px] font-medium text-error">{error}</p>}
            <Button type="submit" block className="mt-4"><LogIn className="h-4 w-4" /> Se connecter</Button>
            <p className="mt-3 text-center text-[12px] text-muted">
              Comptes démo · mot de passe <code className="rounded bg-shell px-1 font-mono">{DEMO_PASSWORD}</code> · superadmin@ ouvre le sélecteur d'espace
            </p>
          </motion.form>
        )}

        <div className="mb-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[12px] font-medium text-muted">{pending ? "Vos espaces" : "Accès rapide démo"}</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
          {gridRoles.map((r) => {
            const meta = ROLE_META[r];
            const account = DEMO_ACCOUNTS[r];
            const active = current === r;
            return (
              <motion.button
                key={r}
                variants={staggerItem}
                whileTap={tap}
                whileHover={{ y: -3 }}
                onClick={() => enter(r)}
                className={cn(
                  "group flex items-center gap-4 rounded-2xl border bg-surface p-4 text-left shadow-card transition",
                  active ? "border-brand ring-2 ring-brand-soft" : "border-line hover:border-brand/40",
                )}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <meta.icon className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-ink">{meta.label}</span>
                    {active && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">Actif</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-muted">{meta.desc}</span>
                  <span className="mt-1.5 flex items-center gap-1.5">
                    <Avatar src={account.avatar} alt={account.name} size={18} />
                    <span className="truncate text-[11px] text-muted">{account.email}</span>
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
              </motion.button>
            );
          })}
        </motion.div>

        {pending && (
          <button onClick={() => setPending(null)} className="mx-auto mt-5 block text-[13px] font-medium text-muted transition hover:text-ink">
            ← Utiliser un autre compte
          </button>
        )}

        <p className="mt-6 text-center text-[12px] text-muted">
          Mode démonstration — aucune authentification réelle. Les comptes sont pré-remplis.
        </p>
      </div>
    </div>
  );
}
