import {
  MessageCircle, Phone, Mail, Clock,
  Truck, CreditCard, RotateCcw, MapPin, UserCog, Ticket,
} from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const CATEGORIES: { icon: typeof Truck; label: string; desc: string }[] = [
  { icon: Truck, label: "Livraison", desc: "Suivi, délais, frais" },
  { icon: CreditCard, label: "Paiement", desc: "Orange Money, Wave, carte" },
  { icon: RotateCcw, label: "Remboursement", desc: "Annulation & litiges" },
  { icon: UserCog, label: "Mon compte", desc: "Profil & sécurité" },
  { icon: Ticket, label: "Coupons", desc: "Codes promo & offres" },
  { icon: MapPin, label: "Adresses", desc: "Zones de livraison" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Combien de temps prend une livraison à Bamako ?",
    a: "La plupart des commandes sont livrées en 25 à 45 minutes selon le quartier et l'affluence. Le délai estimé s'affiche sur la fiche du commerce et se met à jour en temps réel pendant le suivi.",
  },
  {
    q: "Comment payer avec Orange Money ou Wave ?",
    a: "Au moment du paiement, sélectionnez Orange Money ou Wave, saisissez le numéro associé puis validez la transaction via le code reçu par SMS ou l'application. Le paiement est confirmé instantanément.",
  },
  {
    q: "Puis-je payer en espèces à la livraison ?",
    a: "Oui, le paiement en espèces à la livraison est disponible chez la majorité des commerces partenaires. Préparez l'appoint pour faciliter la remise au livreur.",
  },
  {
    q: "Comment suivre ma commande en temps réel ?",
    a: "Rendez-vous dans « Mes commandes » puis ouvrez la commande active. Vous y verrez chaque étape (préparation, livreur assigné, en route) ainsi que la position du livreur et son numéro.",
  },
  {
    q: "Comment demander un remboursement ?",
    a: "Si un article est manquant ou non conforme, ouvrez la commande concernée et appuyez sur « Signaler un problème ». Notre équipe traite la demande sous 24 h et crédite votre portefeuille NOVIGO en cas d'accord.",
  },
  {
    q: "Comment utiliser un code promo ?",
    a: "Copiez le code depuis la page « Coupons & offres », puis collez-le dans le champ prévu à l'étape du paiement. La réduction s'applique automatiquement si les conditions (montant minimum, commerce éligible) sont remplies.",
  },
  {
    q: "Comment recharger mon portefeuille NOVIGO ?",
    a: "Depuis votre profil, appuyez sur « Recharger » dans la carte Portefeuille, choisissez le montant puis validez via Orange Money ou Wave. Le solde est crédité immédiatement.",
  },
  {
    q: "Que faire si le livreur ne trouve pas mon adresse ?",
    a: "Ajoutez une note de repère précise à votre adresse (portail, couleur, étage) et gardez votre téléphone joignable. Le livreur peut vous appeler directement depuis l'application pour se faire guider.",
  },
];

const SUPPORT_PHONE = "+223 20 00 00 00";
const SUPPORT_WA = "22370000000";
const SUPPORT_EMAIL = "support@novigo.ml";

export default function SupportPage() {
  return (
    <div className="px-4 py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Aide & support</h1>
        <p className="text-[13px] text-muted">Une question ? Nous sommes là pour vous aider.</p>
      </div>

      {/* Catégories */}
      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Parcourir par thème</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.label} className="rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:shadow-lifted">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <c.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">{c.label}</p>
              <p className="text-[12px] text-muted">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="rounded-2xl border border-line bg-surface px-5 shadow-card">
        <h2 className="pt-5 text-lg font-bold tracking-tight text-ink">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="mt-1">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Nous contacter */}
      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Nous contacter</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/chat"
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:shadow-lifted"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Chat en direct</p>
              <p className="text-[12px] text-muted">Réponse en quelques minutes</p>
            </div>
          </Link>

          <a
            href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:shadow-lifted"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-soft text-success">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Appeler</p>
              <p className="text-[12px] text-muted">{SUPPORT_PHONE}</p>
            </div>
          </a>

          <a
            href={`https://wa.me/${SUPPORT_WA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:shadow-lifted"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-soft text-success">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">WhatsApp</p>
              <p className="text-[12px] text-muted">+223 70 00 00 00</p>
            </div>
          </a>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:shadow-lifted"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-info-soft text-info">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Email</p>
              <p className="text-[12px] text-muted">{SUPPORT_EMAIL}</p>
            </div>
          </a>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-shell p-4 text-[13px] text-muted">
          <Clock className="h-4 w-4 text-brand" />
          Support disponible tous les jours de 8h à 23h (heure de Bamako).
        </div>
      </section>
    </div>
  );
}
