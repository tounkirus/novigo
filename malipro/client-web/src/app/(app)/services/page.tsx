import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, LayoutGrid } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { AiRecommendations } from "@/features/home/ai-recommendations";

export const metadata: Metadata = {
  title: "Services · NOVIGO",
  description: "Tous les services NOVIGO : livraison, mobilité, paiements, avantages et aide.",
};

type Service = { icon: string; label: string; subtitle: string; href: string };
type Family = { title: string; subtitle: string; services: Service[] };

const FAMILIES: Family[] = [
  {
    title: "Livraison",
    subtitle: "Tout se fait livrer à Bamako",
    services: [
      { icon: "UtensilsCrossed", label: "Repas", subtitle: "Restaurants & fast-food", href: "/restaurants" },
      { icon: "ShoppingCart", label: "Supermarché", subtitle: "Courses du quotidien", href: "/restaurants?vertical=GROCERY" },
      { icon: "Pill", label: "Pharmacie", subtitle: "Santé & bien-être", href: "/restaurants?vertical=PHARMACY" },
      { icon: "Store", label: "Marché", subtitle: "Produits frais & locaux", href: "/restaurants?vertical=MARKET" },
    ],
  },
  {
    title: "Mobilité",
    subtitle: "Déplacez-vous en un clic",
    services: [
      { icon: "Car", label: "Taxi", subtitle: "Course confortable", href: "/ride" },
      { icon: "Bike", label: "Moto Taxi", subtitle: "Rapide dans le trafic", href: "/ride" },
      { icon: "Zap", label: "Express", subtitle: "Priorité immédiate", href: "/ride" },
      { icon: "Package", label: "Colis", subtitle: "Envoi entre particuliers", href: "/parcel" },
    ],
  },
  {
    title: "Services à domicile",
    subtitle: "Artisans & pros vérifiés à Bamako",
    services: [
      { icon: "Wrench", label: "Plomberie", subtitle: "Fuites & installations", href: "/home-services/plomberie" },
      { icon: "Zap", label: "Électricité", subtitle: "Pannes & câblage", href: "/home-services/electricite" },
      { icon: "Scissors", label: "Coiffure", subtitle: "À domicile", href: "/home-services/coiffure-femme" },
      { icon: "LayoutGrid", label: "Tous les métiers", subtitle: "50 catégories", href: "/home-services" },
    ],
  },
  {
    title: "Paiements",
    subtitle: "Payez tout, partout",
    services: [
      { icon: "Wallet", label: "Portefeuille", subtitle: "Solde & transferts", href: "/wallet" },
      { icon: "ReceiptText", label: "Factures", subtitle: "Eau, électricité, TV…", href: "/bills" },
      { icon: "Smartphone", label: "Recharge", subtitle: "Crédit & forfaits data", href: "/recharge" },
    ],
  },
  {
    title: "Avantages",
    subtitle: "Gagnez à chaque commande",
    services: [
      { icon: "Award", label: "Fidélité", subtitle: "Cumulez des points", href: "/loyalty" },
      { icon: "Users", label: "Parrainage", subtitle: "Invitez, gagnez", href: "/referral" },
      { icon: "Crown", label: "Premium", subtitle: "Livraison illimitée", href: "/premium" },
      { icon: "TicketPercent", label: "Coupons", subtitle: "Réductions du moment", href: "/coupons" },
    ],
  },
  {
    title: "Aide",
    subtitle: "On est là pour vous",
    services: [
      { icon: "MessageCircle", label: "Chat", subtitle: "Discussion en direct", href: "/chat" },
      { icon: "LifeBuoy", label: "Support", subtitle: "Aide & réclamations", href: "/support" },
      { icon: "Bell", label: "Notifications", subtitle: "Suivi de vos alertes", href: "/notifications" },
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="px-4 py-4 space-y-6">
      {/* En-tête premium */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl brand-gradient text-white shadow-glow">
          <LayoutGrid className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Services</h1>
          <p className="text-[13px] text-muted">La Super App qui simplifie votre quotidien</p>
        </div>
      </div>

      {/* Bannière */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl brand-gradient p-6 text-white shadow-lifted">
          <Sparkles className="absolute -right-4 -top-4 h-28 w-28 opacity-20" />
          <p className="text-xl font-black leading-tight sm:text-2xl">Tout Bamako dans une seule app</p>
          <p className="mt-1 max-w-md text-[13px] font-medium text-white/85">
            Livraison, transport, paiements et avantages — réunis pour vous faire gagner du temps chaque jour.
          </p>
        </div>
      </Reveal>

      {/* Familles de services */}
      {FAMILIES.map((family) => (
        <section key={family.title} className="space-y-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink">{family.title}</h2>
            <p className="text-[13px] text-muted">{family.subtitle}</p>
          </div>
          <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {family.services.map((service) => (
              <RevealItem key={`${family.title}-${service.label}`}>
                <ServiceTile service={service} />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      ))}

      {/* Recommandations IA */}
      <AiRecommendations />
    </div>
  );
}

function ServiceTile({ service }: { service: Service }) {
  return (
    <Link
      href={service.href}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lifted active:scale-[0.97]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand transition-transform duration-200 group-hover:scale-110">
        <Icon name={service.icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-ink">{service.label}</p>
        <p className="line-clamp-1 text-[12px] text-muted">{service.subtitle}</p>
      </div>
    </Link>
  );
}
