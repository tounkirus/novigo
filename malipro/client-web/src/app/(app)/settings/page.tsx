"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Bell, Mail, MapPin, Moon, Languages, Coins,
  Shield, FileText, Info, ChevronRight, Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

const APP_VERSION = "2.4.0";

function Row({
  icon, title, desc, children, className,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${className ?? ""}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {desc && <p className="text-[12px] text-muted">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  const [push, setPush] = React.useState(true);
  const [promoEmails, setPromoEmails] = React.useState(false);
  const [location, setLocation] = React.useState(true);
  const [language, setLanguage] = React.useState("fr");
  const [currency, setCurrency] = React.useState("XOF");

  const links: { href: string; label: string; icon: React.ReactNode }[] = [
    { href: "/support", label: "Politique de confidentialité", icon: <Shield className="h-5 w-5" /> },
    { href: "/support", label: "Conditions générales d'utilisation", icon: <FileText className="h-5 w-5" /> },
    { href: "/support", label: "À propos de NOVIGO", icon: <Info className="h-5 w-5" /> },
  ];

  return (
    <div className="px-4 py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Paramètres</h1>
        <p className="text-[13px] text-muted">Gérez vos préférences et votre compte</p>
      </div>

      {/* Notifications */}
      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Notifications</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <Row icon={<Bell className="h-5 w-5" />} title="Notifications push" desc="Alertes de commande et livraison">
            <Switch checked={push} onCheckedChange={setPush} />
          </Row>
          <Row icon={<Mail className="h-5 w-5" />} title="Emails promotionnels" desc="Offres et nouveautés par email">
            <Switch checked={promoEmails} onCheckedChange={setPromoEmails} />
          </Row>
        </div>
      </section>

      {/* Préférences */}
      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Préférences</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <Row icon={<MapPin className="h-5 w-5" />} title="Localisation" desc="Trouver les commerces proches">
            <Switch checked={location} onCheckedChange={setLocation} />
          </Row>
          <Row icon={<Moon className="h-5 w-5" />} title="Mode sombre" desc="Adapter l'apparence de l'app">
            <Switch checked={isDark} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
          </Row>
          <Row icon={<Languages className="h-5 w-5" />} title="Langue">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="bm">Bambara</SelectItem>
                <SelectItem value="en">Anglais</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row icon={<Coins className="h-5 w-5" />} title="Devise">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XOF">FCFA</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </div>
      </section>

      {/* Informations légales */}
      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Informations</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-shell">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                {l.icon}
              </span>
              <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{l.label}</p>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          ))}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Info className="h-5 w-5" />
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold text-ink">Version de l'app</p>
            <span className="text-[13px] text-muted">v{APP_VERSION}</span>
          </div>
        </div>
      </section>

      {/* Zone danger */}
      <section>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="danger" block>
              <Trash2 className="h-4 w-4" />
              Supprimer mon compte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer votre compte ?</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Vos commandes, favoris, points de fidélité et solde seront
                définitivement effacés.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3">
              <DialogClose asChild>
                <Button variant="secondary" block>Annuler</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  variant="danger"
                  block
                  onClick={() =>
                    toast({ title: "Demande enregistrée", description: "La suppression de votre compte a été prise en compte.", tone: "info" })
                  }
                >
                  Supprimer
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
