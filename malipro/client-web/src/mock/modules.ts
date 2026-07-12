import type {
  Wallet, WalletTx, WalletTxType, Biller, BillHistory, Operator, AirtimeBundle,
  LoyaltyTier, LoyaltyState, Reward, Referral, PremiumPlan, RideMode, RideQuote,
  RideDriverNearby, Trip, ParcelQuote, Parcel, ChatThread, ChatMessage, AiRecommendation, AdCampaign,
} from "@/types/modules";
import { NOW, BAMAKO_DISTRICTS, CITY_CENTER } from "@/constants";
import { Rng, seededRng, hashString } from "./rng";
import { photo, avatar } from "./images";
import { themedImage } from "./media";
import { fullName } from "./generators";
import { FIRST_NAMES, LAST_NAMES } from "./pools";

const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

/* ------------------------------- Wallet ------------------------------- */
const TX_META: Record<WalletTxType, { icon: string; sign: number; labels: string[] }> = {
  TOPUP: { icon: "ArrowDownToLine", sign: 1, labels: ["Rechargement Orange Money", "Rechargement Wave", "Dépôt Moov Money"] },
  PAYMENT: { icon: "ShoppingBag", sign: -1, labels: ["Commande Chez Fatou", "Commande Supermarché Fasokan", "Commande Le Balafon"] },
  TRANSFER_IN: { icon: "ArrowDownLeft", sign: 1, labels: ["Reçu de Aminata T.", "Reçu de Moussa K."] },
  TRANSFER_OUT: { icon: "ArrowUpRight", sign: -1, labels: ["Envoi à Ibrahim D.", "Envoi à Fanta C."] },
  REFUND: { icon: "Undo2", sign: 1, labels: ["Remboursement commande annulée"] },
  CASHBACK: { icon: "Gift", sign: 1, labels: ["Cashback fidélité 2%", "Cashback promo week-end"] },
  BILL: { icon: "Receipt", sign: -1, labels: ["Facture EDM-SA", "Facture SOMAGEP", "Abonnement Canal+"] },
  AIRTIME: { icon: "Smartphone", sign: -1, labels: ["Recharge Orange 1000F", "Forfait data Moov 2Go"] },
  REWARD: { icon: "Star", sign: 1, labels: ["Bonus de bienvenue"] },
};

export function generateWallet(): Wallet {
  const rng = seededRng(2201, 7);
  const types: WalletTxType[] = ["TOPUP", "PAYMENT", "PAYMENT", "CASHBACK", "BILL", "AIRTIME", "TRANSFER_OUT", "TRANSFER_IN", "PAYMENT", "REFUND"];
  let balance = 24500;
  const txs: WalletTx[] = [];
  for (let i = 0; i < 24; i++) {
    const type = i < types.length ? types[i] : rng.pick(types);
    const meta = TX_META[type];
    const base = rng.pick([500, 1000, 1500, 2000, 2500, 5000, 7500, 10000]);
    const amount = meta.sign * base;
    txs.push({
      id: `wtx_${i}`,
      type,
      label: rng.pick(meta.labels),
      amount,
      balanceAfter: balance,
      createdAt: iso(i * 43_000_000 + rng.int(0, 20_000_000)),
      status: i === 0 && rng.bool(0.2) ? "PENDING" : "COMPLETED",
      method: type === "TOPUP" ? rng.pick(["Orange Money", "Wave", "Moov Money"]) : undefined,
      icon: meta.icon,
    });
    balance -= amount;
  }
  const monthlyIn = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthlyOut = txs.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
  return {
    balance: 24500,
    currency: "FCFA",
    monthlyIn,
    monthlyOut,
    cashback: txs.filter((t) => t.type === "CASHBACK").reduce((s, t) => s + t.amount, 0),
    transactions: txs,
  };
}

/* ------------------------------- Factures ----------------------------- */
export function generateBillers(): Biller[] {
  return [
    { id: "edm", name: "EDM-SA (Électricité)", category: "ELECTRICITY", logo: photo("biller-edm", 96, 96), color: "from-amber-500 to-orange-600", fieldLabel: "N° de compteur", placeholder: "Ex : 0012345678" },
    { id: "somagep", name: "SOMAGEP (Eau)", category: "WATER", logo: photo("biller-somagep", 96, 96), color: "from-sky-500 to-blue-600", fieldLabel: "N° d'abonné", placeholder: "Ex : SP-004521" },
    { id: "canal", name: "Canal+ Mali", category: "TV", logo: photo("biller-canal", 96, 96), color: "from-slate-600 to-slate-800", fieldLabel: "N° de décodeur", placeholder: "Ex : 12345678901" },
    { id: "orange-fibre", name: "Orange Fibre", category: "INTERNET", logo: photo("biller-orangefibre", 96, 96), color: "from-orange-500 to-red-500", fieldLabel: "N° de contrat", placeholder: "Ex : OF-88213" },
    { id: "startimes", name: "StarTimes", category: "TV", logo: photo("biller-startimes", 96, 96), color: "from-red-500 to-rose-600", fieldLabel: "N° smartcard", placeholder: "Ex : 003344556" },
    { id: "nsia", name: "NSIA Assurances", category: "INSURANCE", logo: photo("biller-nsia", 96, 96), color: "from-emerald-500 to-green-600", fieldLabel: "N° de police", placeholder: "Ex : POL-2024-771" },
    { id: "dgi", name: "Impôts (DGI)", category: "TAX", logo: photo("biller-dgi", 96, 96), color: "from-violet-500 to-purple-700", fieldLabel: "NIF", placeholder: "Ex : 08512340" },
    { id: "campus", name: "Frais de scolarité", category: "SCHOOL", logo: photo("biller-campus", 96, 96), color: "from-teal-500 to-cyan-600", fieldLabel: "Matricule élève", placeholder: "Ex : ETU-00912" },
  ];
}

export function generateBillHistory(): BillHistory[] {
  const billers = generateBillers();
  return Array.from({ length: 8 }, (_, i) => {
    const rng = seededRng(3301, i);
    const b = rng.pick(billers);
    return {
      id: `bill_${i}`,
      billerId: b.id,
      billerName: b.name,
      reference: `${b.id.toUpperCase()}-${rng.int(100000, 999999)}`,
      amount: rng.pick([5000, 8500, 10000, 12500, 15000, 25000]),
      createdAt: iso(i * 6 * 86_400_000 + rng.int(0, 5_000_000)),
      status: i === 0 && rng.bool(0.3) ? "PENDING" : "PAID",
    };
  });
}

/* -------------------------- Recharge téléphone ------------------------ */
export function generateOperators(): Operator[] {
  return [
    { id: "orange", name: "Orange Mali", logo: photo("op-orange", 96, 96), color: "from-orange-500 to-red-500", prefixes: ["07", "76", "77", "78", "79", "90", "91"] },
    { id: "moov", name: "Moov Africa", logo: photo("op-moov", 96, 96), color: "from-sky-500 to-blue-600", prefixes: ["60", "65", "66", "70", "83"] },
    { id: "telecel", name: "Telecel Mali", logo: photo("op-telecel", 96, 96), color: "from-rose-500 to-pink-600", prefixes: ["81", "82"] },
  ];
}

export function generateBundles(operatorId: string): AirtimeBundle[] {
  const rng = seededRng(hashString(operatorId), 44);
  const airtime = [500, 1000, 2000, 5000].map((p, i) => ({
    id: `${operatorId}_air_${i}`, operatorId, type: "AIRTIME" as const,
    label: `Crédit ${p} F`, detail: "Crédit d'appel & SMS", price: p, validity: "Illimité", popular: p === 1000,
  }));
  const data = [
    { label: "1 Go", price: 1000, validity: "7 jours", bonus: "+ 200 Mo nuit" },
    { label: "3 Go", price: 2500, validity: "30 jours" },
    { label: "10 Go", price: 6000, validity: "30 jours", bonus: "+ 2 Go WhatsApp" },
    { label: "25 Go", price: 12000, validity: "30 jours" },
  ].map((d, i) => ({ id: `${operatorId}_data_${i}`, operatorId, type: "DATA" as const, label: d.label, detail: "Internet mobile", price: d.price, validity: d.validity, bonus: d.bonus, popular: d.label === "3 Go" }));
  const combo = [
    { label: "Pass Jour", price: 500, validity: "24h", detail: "500 Mo + 30 min + SMS" },
    { label: "Pass Semaine", price: 2000, validity: "7 jours", detail: "2 Go + 100 min + SMS illimités" },
  ].map((c, i) => ({ id: `${operatorId}_combo_${i}`, operatorId, type: "COMBO" as const, label: c.label, detail: c.detail, price: c.price, validity: c.validity, popular: rng.bool(0.3) }));
  return [...airtime, ...data, ...combo];
}

/* ------------------------------- Fidélité ----------------------------- */
export const LOYALTY_TIERS: LoyaltyTier[] = [
  { id: "bronze", name: "Bronze", minPoints: 0, color: "from-amber-700 to-amber-900", perks: ["1 point / 100 FCFA", "Offres de bienvenue"] },
  { id: "argent", name: "Argent", minPoints: 1000, color: "from-slate-400 to-slate-600", perks: ["1,5 point / 100 FCFA", "Livraison réduite", "Support prioritaire"] },
  { id: "or", name: "Or", minPoints: 3000, color: "from-gold to-gold-dark", perks: ["2 points / 100 FCFA", "Livraison gratuite 2×/mois", "Offres exclusives"] },
  { id: "platine", name: "Platine", minPoints: 8000, color: "from-violet-500 to-indigo-700", perks: ["3 points / 100 FCFA", "Livraison gratuite illimitée", "Conciergerie NOVIGO"] },
];

export function generateRewards(): Reward[] {
  const items = [
    ["Livraison gratuite", "Un bon de livraison offert", 300, "Bons"],
    ["-2 000 FCFA", "Réduction sur une commande", 800, "Réductions"],
    ["Menu offert", "Un plat gratuit chez un partenaire", 1500, "Repas"],
    ["Pass Premium 1 mois", "Abonnement Premium offert", 2500, "Premium"],
    ["Recharge 1 000 F", "Crédit téléphonique offert", 600, "Télécom"],
    ["Cashback 5 000 F", "Crédité sur votre portefeuille", 3000, "Portefeuille"],
    ["Sac NOVIGO", "Goodie collector édition limitée", 1200, "Goodies"],
    ["Course taxi offerte", "Un trajet en ville offert", 900, "Mobilité"],
  ];
  return items.map((it, i) => ({
    id: `reward_${i}`,
    title: it[0] as string,
    description: it[1] as string,
    cost: it[2] as number,
    image: themedImage("gift,reward,present", `reward-${i}`, 400, 300),
    category: it[3] as string,
    available: true,
  }));
}

export function generateLoyalty(): LoyaltyState {
  const rng = seededRng(4401, 3);
  const points = 1280;
  const tier = LOYALTY_TIERS[1];
  const nextTier = LOYALTY_TIERS[2];
  const labels = ["Commande Chez Fatou", "Parrainage Aminata", "Bonus week-end", "Commande Supermarché", "Avis publié", "Recharge téléphone"];
  return {
    points,
    lifetimePoints: 5240,
    tier,
    nextTier,
    history: Array.from({ length: 10 }, (_, i) => ({
      id: `lh_${i}`,
      label: rng.pick(labels),
      points: rng.pick([15, 25, 40, 60, 100, 250]),
      createdAt: iso(i * 3 * 86_400_000),
    })),
    rewards: generateRewards(),
  };
}

/* ------------------------------ Parrainage ---------------------------- */
export function generateReferral(): Referral {
  const rng = seededRng(5501, 9);
  const statuses = ["ORDERED", "JOINED", "PENDING"] as const;
  const friends = Array.from({ length: 9 }, (_, i) => {
    const p = fullName(rng);
    const status = i < 5 ? "ORDERED" : i < 7 ? "JOINED" : "PENDING";
    return {
      id: `ref_${i}`,
      name: p.name,
      avatar: avatar(p.name),
      status: status as (typeof statuses)[number],
      reward: status === "ORDERED" ? 2000 : 0,
      joinedAt: iso(i * 5 * 86_400_000),
    };
  });
  const completed = friends.filter((f) => f.status === "ORDERED").length;
  return {
    code: "SEYDOU2026",
    invited: friends.length,
    completed,
    earned: completed * 2000,
    pending: (friends.length - completed) * 2000,
    rewardPerFriend: 2000,
    friends,
  };
}

/* -------------------------------- Premium ----------------------------- */
export function generatePremiumPlans(): PremiumPlan[] {
  return [
    { id: "free", name: "Gratuit", price: 0, period: "MONTH", perks: ["Livraison standard", "Offres publiques", "Support standard"] },
    { id: "premium-m", name: "Premium", price: 2500, period: "MONTH", highlight: true, badge: "Populaire", perks: ["Livraison gratuite illimitée*", "−10% permanent chez les partenaires", "Support prioritaire 24/7", "Offres exclusives Premium", "Double points fidélité"] },
    { id: "premium-y", name: "Premium Annuel", price: 24000, period: "YEAR", badge: "2 mois offerts", perks: ["Tous les avantages Premium", "2 mois offerts", "Cadeau de bienvenue", "Accès anticipé aux nouveautés"] },
  ];
}

/* ------------------------------- Mobilité ----------------------------- */
export function generateRideQuote(from: string, to: string): RideQuote {
  const seed = hashString(from + to);
  const rng = seededRng(seed, 1);
  const distanceKm = rng.float(1.5, 14, 1);
  const durationMin = Math.round(distanceKm * rng.float(2.4, 3.6));
  const base = (mult: number, flat: number) => Math.round((flat + distanceKm * mult) / 50) * 50;
  const options = [
    { mode: "MOTO" as RideMode, label: "Moto Taxi", icon: "Bike", etaMin: rng.int(2, 6), price: base(180, 300), capacity: 1, desc: "Le plus rapide en ville" },
    { mode: "TAXI" as RideMode, label: "Taxi", icon: "Car", etaMin: rng.int(4, 10), price: base(320, 700), capacity: 4, desc: "Confortable, jusqu'à 4 places" },
    { mode: "EXPRESS" as RideMode, label: "Express", icon: "Zap", etaMin: rng.int(3, 7), price: base(420, 1000), capacity: 4, desc: "Priorité & climatisation" },
  ];
  return { from, to, distanceKm, durationMin, options };
}

export function generateNearbyDrivers(mode: RideMode): RideDriverNearby[] {
  return Array.from({ length: 6 }, (_, i) => {
    const rng = seededRng(hashString(mode), i + 1);
    const p = fullName(rng);
    return {
      id: `nd_${mode}_${i}`,
      name: p.name,
      avatar: avatar(p.name),
      rating: rng.float(4.2, 5, 1),
      vehicle: mode === "MOTO" ? rng.pick(["Jakarta", "Sanili", "TVS"]) : rng.pick(["Toyota Yaris", "Hyundai i10", "Kia Picanto"]),
      plate: `${rng.pick(["BA", "MA"])} ${rng.int(1000, 9999)} ML`,
      etaMin: rng.int(2, 9),
      location: { lat: CITY_CENTER.lat + rng.float(-0.03, 0.03, 4), lng: CITY_CENTER.lng + rng.float(-0.03, 0.03, 4) },
    };
  });
}

export function generateTrips(): Trip[] {
  const modes: RideMode[] = ["MOTO", "TAXI", "EXPRESS"];
  return Array.from({ length: 12 }, (_, i) => {
    const rng = seededRng(6601, i);
    const from = rng.pick(BAMAKO_DISTRICTS);
    let to = rng.pick(BAMAKO_DISTRICTS);
    if (to === from) to = BAMAKO_DISTRICTS[(BAMAKO_DISTRICTS.indexOf(to) + 1) % BAMAKO_DISTRICTS.length];
    const distanceKm = rng.float(1.5, 14, 1);
    const p = fullName(rng);
    return {
      id: `trip_${i}`,
      mode: rng.pick(modes),
      from,
      to,
      date: iso(i * 4 * 86_400_000 + rng.int(0, 3_000_000)),
      price: Math.round((300 + distanceKm * 250) / 50) * 50,
      distanceKm,
      durationMin: Math.round(distanceKm * 3),
      status: i === 0 ? "ONGOING" : rng.bool(0.9) ? "COMPLETED" : "CANCELLED",
      driverName: p.name,
      rating: i === 0 ? undefined : rng.int(4, 5),
    };
  });
}

/* -------------------------------- Colis ------------------------------- */
export function generateParcelQuotes(): ParcelQuote[] {
  return [
    { size: "SMALL", label: "Petit colis", icon: "Package", maxWeight: "≤ 2 kg", price: 1000, etaMin: 40 },
    { size: "MEDIUM", label: "Colis moyen", icon: "PackageOpen", maxWeight: "≤ 8 kg", price: 2000, etaMin: 55 },
    { size: "LARGE", label: "Grand colis", icon: "Boxes", maxWeight: "≤ 20 kg", price: 3500, etaMin: 75 },
  ];
}

export function generateParcels(): Parcel[] {
  const sizes = ["SMALL", "MEDIUM", "LARGE"] as const;
  const st = ["PENDING", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const;
  return Array.from({ length: 8 }, (_, i) => {
    const rng = seededRng(7701, i);
    const p = fullName(rng);
    return {
      id: `parcel_${i}`,
      ref: `CL-${rng.int(100000, 999999)}`,
      from: rng.pick(BAMAKO_DISTRICTS),
      to: rng.pick(BAMAKO_DISTRICTS),
      recipient: p.name,
      size: rng.pick(sizes),
      price: rng.pick([1000, 2000, 3500]),
      status: i === 0 ? "IN_TRANSIT" : i === 1 ? "PICKED_UP" : rng.pick(st),
      createdAt: iso(i * 2 * 86_400_000),
      eta: `${rng.int(20, 70)} min`,
    };
  });
}

/* --------------------------------- Chat ------------------------------- */
export function generateChatThreads(): ChatThread[] {
  const defs: { name: string; kind: ChatThread["kind"]; last: string; online: boolean }[] = [
    { name: "Support NOVIGO", kind: "SUPPORT", last: "Bonjour ! Comment pouvons-nous vous aider ?", online: true },
    { name: "Ibrahim (Livreur)", kind: "DRIVER", last: "Je suis à 5 minutes de chez vous 🛵", online: true },
    { name: "Chez Fatou", kind: "MERCHANT", last: "Votre commande est en préparation.", online: false },
    { name: "Supermarché Fasokan", kind: "MERCHANT", last: "Merci pour votre commande !", online: false },
    { name: "Aminata (Livreuse)", kind: "DRIVER", last: "Colis récupéré, en route.", online: true },
  ];
  return defs.map((d, i) => ({
    id: `thread_${i}`,
    name: d.name,
    avatar: avatar(d.name),
    kind: d.kind,
    lastMessage: d.last,
    lastAt: iso(i * 1_800_000 + 120_000),
    unread: i === 0 ? 1 : i === 1 ? 2 : 0,
    online: d.online,
  }));
}

export function generateChatMessages(threadId: string): ChatMessage[] {
  const rng = seededRng(hashString(threadId), 12);
  const convo = [
    { from: "them" as const, text: "Bonjour 👋 Comment pouvons-nous vous aider aujourd'hui ?" },
    { from: "me" as const, text: "Bonjour, ma commande n'est pas encore arrivée." },
    { from: "them" as const, text: "Un instant, je vérifie le statut de votre livraison…" },
    { from: "them" as const, text: "Votre livreur est en route, il arrive dans 6 minutes 🛵" },
    { from: "me" as const, text: "Super, merci beaucoup !" },
    { from: "them" as const, text: "Avec plaisir 🙏 N'hésitez pas si besoin." },
  ];
  return convo.map((m, i) => ({
    id: `${threadId}_m${i}`,
    threadId,
    from: m.from,
    text: m.text,
    at: iso((convo.length - i) * 90_000 + rng.int(0, 20_000)),
    status: m.from === "me" ? "read" : undefined,
  }));
}

/* --------------------------- Recommandations IA ----------------------- */
export function generateAiRecommendations(storeIds: string[]): AiRecommendation[] {
  const reasons = [
    "Parce que vous aimez la cuisine malienne",
    "Recommandé selon vos commandes récentes",
    "Populaire dans votre quartier",
    "Livraison rapide près de chez vous",
    "Nouveauté qui correspond à vos goûts",
    "Vos favoris commandent souvent ici",
    "Meilleur rapport qualité-prix pour vous",
    "Tendance cette semaine à Bamako",
  ];
  return storeIds.slice(0, 8).map((storeId, i) => ({
    id: `ai_${i}`,
    reason: reasons[i % reasons.length],
    storeId,
    score: 98 - i * 3,
  }));
}

/* -------------------------------- Publicité --------------------------- */
export function generateAdCampaigns(): AdCampaign[] {
  const advertisers = ["Chez Fatou", "Supermarché Fasokan", "Pharmacie Centrale", "Le Balafon", "Boulangerie Dorée", "Orange Mali", "Boutique Faso Style"];
  const titles = ["Menu du midi -20%", "Livraison offerte ce week-end", "Nouveautés de saison", "Happy Hour 17h-19h", "Pack famille", "Forfaits data", "Collection Bogolan"];
  const st = ["ACTIVE", "PAUSED", "REVIEW", "ENDED"] as const;
  return Array.from({ length: 14 }, (_, i) => {
    const rng = seededRng(8801, i);
    const budget = rng.pick([50000, 100000, 150000, 250000, 500000]);
    const spent = Math.round(budget * rng.float(0.1, 0.95));
    const impressions = rng.int(4000, 90000);
    const clicks = Math.round(impressions * rng.float(0.01, 0.08));
    return {
      id: `ad_${i}`,
      advertiser: advertisers[i % advertisers.length],
      title: titles[i % titles.length],
      status: i === 0 ? "ACTIVE" : rng.pick(st),
      budget,
      spent,
      impressions,
      clicks,
      ctr: +((clicks / impressions) * 100).toFixed(2),
      startAt: iso((i + 5) * 86_400_000),
      endAt: iso(-((i + 3) * 86_400_000)),
    };
  });
}

// Petit utilitaire réexporté pour les modules qui génèrent des noms.
export function personName(i: number): string {
  const rng = new Rng(hashString(`person-${i}`));
  return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
}
