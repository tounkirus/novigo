import Link from "next/link";
import { ChevronRight, Wallet, Sparkles, ShoppingBag, Heart } from "lucide-react";
import { Avatar, Progress } from "@/components/ui/misc";
import { Icon } from "@/components/shared/icon";
import { WalletTopUpButton, LogoutButton } from "@/features/account/profile-actions";
import { user, orders } from "@/mock";
import { formatDate, formatFcfa, clamp } from "@/lib/utils";

const LOYALTY_TIER = 2000;

const SHORTCUTS: { href: string; label: string; desc: string; icon: string }[] = [
  { href: "/orders", label: "Mes commandes", desc: "Historique & suivi", icon: "Receipt" },
  { href: "/favorites", label: "Favoris", desc: "Vos commerces préférés", icon: "Heart" },
  { href: "/addresses", label: "Mes adresses", desc: "Lieux de livraison", icon: "MapPin" },
  { href: "/coupons", label: "Coupons & offres", desc: "Vos codes promo", icon: "Ticket" },
  { href: "/notifications", label: "Notifications", desc: "Alertes & activité", icon: "Bell" },
  { href: "/settings", label: "Paramètres", desc: "Préférences du compte", icon: "Settings" },
  { href: "/support", label: "Aide & support", desc: "FAQ & contact", icon: "LifeBuoy" },
];

export default function ProfilePage() {
  const orderCount = orders().length;
  const favoriteCount = user.favoriteStoreIds.length;
  const loyaltyProgress = clamp((user.loyaltyPoints / LOYALTY_TIER) * 100, 0, 100);
  const remaining = Math.max(0, LOYALTY_TIER - user.loyaltyPoints);

  return (
    <div className="px-4 py-4 space-y-6">
      {/* En-tête premium */}
      <div className="relative overflow-hidden rounded-3xl brand-gradient p-6 text-white shadow-glow">
        <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-15" />
        <div className="relative flex items-center gap-4">
          <Avatar src={user.avatar} alt={`${user.firstName} ${user.lastName}`} size={72} className="ring-4 ring-white/30" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-[13px] font-medium opacity-90">{user.phone}</p>
            <p className="mt-1 text-[12px] opacity-80">Membre depuis le {formatDate(user.memberSince)}</p>
          </div>
        </div>
      </div>

      {/* Portefeuille & fidélité */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-muted">
              <Wallet className="h-4 w-4 text-brand" />
              Portefeuille
            </span>
            <WalletTopUpButton />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-ink">{formatFcfa(user.walletBalance)}</p>
          <p className="mt-1 text-[12px] text-muted">Solde disponible pour vos commandes</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-muted">
              <Sparkles className="h-4 w-4 text-gold-dark" />
              Points fidélité
            </span>
            <span className="text-lg font-black text-ink">{user.loyaltyPoints}</span>
          </div>
          <Progress value={loyaltyProgress} className="mt-3" />
          <p className="mt-2 text-[12px] text-muted">
            Plus que <span className="font-semibold text-ink">{remaining} points</span> pour le prochain palier
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-black leading-none text-ink">{orderCount}</p>
            <p className="mt-1 text-[12px] text-muted">Commandes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Heart className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-black leading-none text-ink">{favoriteCount}</p>
            <p className="mt-1 text-[12px] text-muted">Favoris</p>
          </div>
        </div>
      </div>

      {/* Raccourcis */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {SHORTCUTS.map((s, i) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-shell ${i > 0 ? "border-t border-line" : ""}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Icon name={s.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{s.label}</p>
              <p className="text-[12px] text-muted">{s.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        ))}
      </div>

      <LogoutButton />
    </div>
  );
}
