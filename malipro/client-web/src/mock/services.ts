/**
 * Services à Domicile — données mock déterministes.
 * 50 métiers, prestataires (KYC/portfolio/avis/dispo), interventions (devis→réalisation),
 * dashboard prestataire, stats & suivi admin. Aucune dépendance à Math.random/Date.now.
 */
import type {
  ServiceCategoryDef, ServiceGroup, ServiceProvider, ServiceReview, ServiceIntervention,
  InterventionStatus, InterventionEvent, ProviderDashboard, ProviderKyc, ServiceStats,
  AdminProviderRow, Availability, PortfolioItem, ProviderBadge, PriceUnit, ServicePaymentMethod,
} from "@/types/services";
import { NOW, BAMAKO_DISTRICTS, CITY_CENTER } from "@/constants";
import { Rng, seededRng, hashString } from "./rng";
import { avatar } from "./images";
import { themedImage } from "./media";
import { fullName } from "./generators";
import { DEMO_VOLUMES } from "./volumes";
import { slugify } from "@/lib/utils";

const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();
const DAY = 86_400_000;

/* ────────────────────────────── 50 catégories de métiers ───────────────────────────── */

const G = (group: ServiceGroup, gradient: string) => ({ group, gradient });
const MAISON = G("MAISON", "from-amber-500 to-orange-600");
const BIENETRE = G("BIENETRE", "from-pink-500 to-rose-600");
const EVENEMENT = G("EVENEMENT", "from-violet-500 to-fuchsia-600");
const AUTO = G("AUTO", "from-slate-500 to-slate-700");
const NUMERIQUE = G("NUMERIQUE", "from-sky-500 to-blue-600");
const COURS = G("COURS", "from-emerald-500 to-green-600");

export const SERVICE_CATEGORIES: ServiceCategoryDef[] = [
  // Maison
  { id: "plomberie", label: "Plomberie", icon: "Wrench", keywords: "plumber,pipe,repair", unit: "HOUR", ...MAISON },
  { id: "electricite", label: "Électricité", icon: "Zap", keywords: "electrician,wiring,electric", unit: "HOUR", ...MAISON },
  { id: "menuiserie", label: "Menuiserie", icon: "Hammer", keywords: "carpenter,wood,furniture", unit: "JOB", ...MAISON },
  { id: "peinture", label: "Peinture", icon: "Paintbrush", keywords: "painter,wall,paint", unit: "JOB", ...MAISON },
  { id: "maconnerie", label: "Maçonnerie", icon: "HardHat", keywords: "mason,construction,brick", unit: "DAY", ...MAISON },
  { id: "climatisation", label: "Climatisation", icon: "Snowflake", keywords: "air conditioner,hvac,repair", unit: "JOB", ...MAISON },
  { id: "serrurerie", label: "Serrurerie", icon: "KeyRound", keywords: "locksmith,key,lock", unit: "JOB", ...MAISON },
  { id: "jardinage", label: "Jardinage", icon: "Sprout", keywords: "gardener,garden,plants", unit: "HOUR", ...MAISON },
  { id: "menage", label: "Ménage", icon: "Sparkles", keywords: "cleaning,house,maid", unit: "HOUR", ...MAISON },
  { id: "deratisation", label: "Dératisation", icon: "Bug", keywords: "pest control,exterminator", unit: "JOB", ...MAISON },
  { id: "demenagement", label: "Déménagement", icon: "Truck", keywords: "moving,boxes,truck", unit: "DAY", ...MAISON },
  { id: "vitrerie", label: "Vitrerie", icon: "GlassWater", keywords: "glass,window,glazier", unit: "JOB", ...MAISON },
  { id: "carrelage", label: "Carrelage", icon: "Grid3x3", keywords: "tiles,tiling,floor", unit: "JOB", ...MAISON },
  { id: "toiture", label: "Toiture", icon: "Home", keywords: "roof,roofing,house", unit: "DAY", ...MAISON },
  { id: "soudure", label: "Soudure", icon: "Flame", keywords: "welding,metal,welder", unit: "JOB", ...MAISON },
  { id: "forage-puits", label: "Forage & Puits", icon: "Droplet", keywords: "water well,drilling", unit: "DAY", ...MAISON },
  { id: "electromenager", label: "Électroménager", icon: "Plug", keywords: "appliance repair,technician", unit: "JOB", ...MAISON },
  { id: "groupe-electrogene", label: "Groupe électrogène", icon: "Fuel", keywords: "generator,power", unit: "JOB", ...MAISON },
  // Bien-être & beauté
  { id: "coiffure-femme", label: "Coiffure femme", icon: "Scissors", keywords: "hairdresser,salon,hair", unit: "JOB", ...BIENETRE },
  { id: "coiffure-homme", label: "Coiffure homme", icon: "Scissors", keywords: "barber,haircut,men", unit: "JOB", ...BIENETRE },
  { id: "tresses", label: "Tresses & Nattes", icon: "Wand2", keywords: "braids,african hair,hairstyle", unit: "JOB", ...BIENETRE },
  { id: "esthetique", label: "Esthétique", icon: "Sparkles", keywords: "beauty,esthetician,skincare", unit: "JOB", ...BIENETRE },
  { id: "maquillage", label: "Maquillage", icon: "Brush", keywords: "makeup,artist,beauty", unit: "JOB", ...BIENETRE },
  { id: "manucure", label: "Manucure & Pédicure", icon: "Hand", keywords: "manicure,nails,pedicure", unit: "JOB", ...BIENETRE },
  { id: "massage", label: "Massage", icon: "Heart", keywords: "massage,spa,therapy", unit: "HOUR", ...BIENETRE },
  { id: "henne", label: "Henné", icon: "Flower2", keywords: "henna,mehndi,art", unit: "JOB", ...BIENETRE },
  { id: "coach-sportif", label: "Coach sportif", icon: "Dumbbell", keywords: "fitness,coach,workout", unit: "HOUR", ...BIENETRE },
  // Événementiel
  { id: "traiteur", label: "Traiteur", icon: "ChefHat", keywords: "catering,buffet,food", unit: "JOB", ...EVENEMENT },
  { id: "decoration-evenement", label: "Décoration événement", icon: "PartyPopper", keywords: "event decoration,party", unit: "JOB", ...EVENEMENT },
  { id: "sonorisation", label: "Sonorisation", icon: "Speaker", keywords: "sound system,speakers", unit: "DAY", ...EVENEMENT },
  { id: "photographe", label: "Photographe", icon: "Camera", keywords: "photographer,camera,event", unit: "JOB", ...EVENEMENT },
  { id: "videaste", label: "Vidéaste", icon: "Video", keywords: "videographer,filming,event", unit: "JOB", ...EVENEMENT },
  { id: "location-mobilier", label: "Location mobilier", icon: "Armchair", keywords: "chairs,tables,event rental", unit: "DAY", ...EVENEMENT },
  { id: "animation-dj", label: "Animation DJ", icon: "Music", keywords: "dj,party,music", unit: "DAY", ...EVENEMENT },
  { id: "patisserie-evenement", label: "Pâtisserie événement", icon: "Cake", keywords: "wedding cake,pastry", unit: "JOB", ...EVENEMENT },
  // Auto & moto
  { id: "mecanicien", label: "Mécanicien", icon: "Wrench", keywords: "mechanic,car repair,garage", unit: "JOB", ...AUTO },
  { id: "lavage-auto", label: "Lavage auto", icon: "Droplets", keywords: "car wash,cleaning", unit: "JOB", ...AUTO },
  { id: "depannage-auto", label: "Dépannage auto", icon: "Truck", keywords: "car towing,breakdown", unit: "JOB", ...AUTO },
  { id: "tolerie-auto", label: "Tôlerie & Peinture", icon: "Brush", keywords: "car body,paint,repair", unit: "JOB", ...AUTO },
  { id: "vulcanisateur", label: "Vulcanisateur", icon: "CircleDashed", keywords: "tire,wheel,repair", unit: "JOB", ...AUTO },
  { id: "electricien-auto", label: "Électricien auto", icon: "Zap", keywords: "car electrician,battery", unit: "JOB", ...AUTO },
  // Numérique & tech
  { id: "reparation-telephone", label: "Réparation téléphone", icon: "Smartphone", keywords: "phone repair,technician", unit: "JOB", ...NUMERIQUE },
  { id: "reparation-informatique", label: "Réparation informatique", icon: "Laptop", keywords: "computer repair,laptop", unit: "JOB", ...NUMERIQUE },
  { id: "developpeur-web", label: "Développeur web", icon: "Code", keywords: "web developer,coding", unit: "JOB", ...NUMERIQUE },
  { id: "graphiste", label: "Graphiste", icon: "Palette", keywords: "graphic designer,design", unit: "JOB", ...NUMERIQUE },
  { id: "installation-camera", label: "Installation caméra", icon: "Cctv", keywords: "cctv,security camera,install", unit: "JOB", ...NUMERIQUE },
  { id: "reseau-internet", label: "Réseau & Internet", icon: "Wifi", keywords: "network,internet,router", unit: "JOB", ...NUMERIQUE },
  // Cours & formation
  { id: "cours-particuliers", label: "Cours particuliers", icon: "GraduationCap", keywords: "tutor,teacher,student", unit: "HOUR", ...COURS },
  { id: "cours-langue", label: "Cours de langue", icon: "Languages", keywords: "language teacher,class", unit: "HOUR", ...COURS },
  { id: "cours-conduite", label: "Auto-école", icon: "Car", keywords: "driving school,car,lesson", unit: "HOUR", ...COURS },
];

export const CATEGORY_BY_ID: Record<string, ServiceCategoryDef> =
  Object.fromEntries(SERVICE_CATEGORIES.map((c) => [c.id, c]));

export const SERVICE_GROUPS: { id: ServiceGroup; label: string; icon: string }[] = [
  { id: "MAISON", label: "Maison & Réparation", icon: "Home" },
  { id: "BIENETRE", label: "Beauté & Bien-être", icon: "Sparkles" },
  { id: "EVENEMENT", label: "Événementiel", icon: "PartyPopper" },
  { id: "AUTO", label: "Auto & Moto", icon: "Car" },
  { id: "NUMERIQUE", label: "Numérique & Tech", icon: "Laptop" },
  { id: "COURS", label: "Cours & Formation", icon: "GraduationCap" },
];

/* ────────────────────────────── pools ───────────────────────────── */

const TAGLINES = [
  "Travail soigné, prix honnête", "Rapide, propre et garanti", "Votre satisfaction, ma priorité",
  "Intervention 7j/7 à Bamako", "Devis gratuit sous 1h", "Plus de 10 ans d'expérience",
  "Qualité professionnelle garantie", "Ponctuel et méticuleux", "Le savoir-faire à votre service",
];
const SKILLS_POOL = [
  "Diagnostic rapide", "Devis gratuit", "Intervention urgente", "Garantie 3 mois", "Matériel fourni",
  "Déplacement inclus", "Travail garanti", "Conseil personnalisé", "Nettoyage après chantier", "Facture remise",
];
const LANGS = ["Bambara", "Français", "Anglais", "Peul", "Songhaï", "Soninké"];
const REVIEW_COMMENTS = [
  "Très professionnel, je recommande vivement.", "Travail impeccable et rapide.", "Ponctuel et très sérieux.",
  "Bon rapport qualité-prix, rien à redire.", "Intervention efficace, problème réglé en une visite.",
  "Personne de confiance, très à l'écoute.", "Propre et soigné, je le rappellerai.",
  "Un peu en retard mais excellent travail.", "Prestation au top, merci beaucoup !",
  "Devis respecté, aucune mauvaise surprise.",
];
const JOB_TYPES = ["Réparation", "Installation", "Entretien", "Dépannage urgent", "Rénovation", "Prestation à domicile"];

/* ────────────────────────────── prestataires ───────────────────────────── */

function priceRange(unit: PriceUnit): [number, number] {
  if (unit === "HOUR") return [2000, 8000];
  if (unit === "DAY") return [15000, 60000];
  return [5000, 75000];
}
const UNIT_SUFFIX: Record<PriceUnit, string> = { HOUR: "/h", DAY: "/jour", JOB: "" };

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

function badgesFor(rng: Rng, rating: number, jobs: number, kyc: string): ProviderBadge[] {
  const out: ProviderBadge[] = [];
  if (kyc === "VERIFIED") out.push("VERIFIED");
  if (rating >= 4.7 && jobs > 120) out.push("TOP_RATED");
  if (rng.bool(0.35)) out.push("FAST_RESPONSE");
  if (jobs > 300) out.push("ELITE");
  else if (jobs > 60) out.push("PRO");
  if (jobs < 15) out.push("NEW");
  return out;
}

function availability(rng: Rng): Availability[] {
  return Array.from({ length: 7 }, (_, day) => {
    const off = (day === 0 && rng.bool(0.5)) || rng.bool(0.12);
    return { day, from: rng.pick(["07:00", "08:00", "09:00"]), to: rng.pick(["17:00", "18:00", "19:00", "20:00"]), off };
  });
}

function portfolio(cat: ServiceCategoryDef, seed: string, rng: Rng): PortfolioItem[] {
  const n = rng.int(3, 6);
  return Array.from({ length: n }, (_, i) => ({
    id: `${seed}_pf_${i}`,
    image: themedImage(cat.keywords, `${seed}-pf-${i}`, 400, 300),
    title: `${rng.pick(JOB_TYPES)} — ${cat.label}`,
  }));
}

export function generateProvider(index: number, categoryId?: string): ServiceProvider {
  const rng = seededRng(90210, index);
  const cat = categoryId ? CATEGORY_BY_ID[categoryId] : rng.pick(SERVICE_CATEGORIES);
  const p = fullName(rng);
  const slug = slugify(`${p.name}-${cat.id}-${index}`);
  const seed = slug;
  const rating = rng.float(3.9, 5, 1);
  const jobsCompleted = rng.int(3, 480);
  const kycStatus = rng.bool(0.82) ? "VERIFIED" : rng.bool(0.6) ? "PENDING" : "REJECTED";
  const [lo, hi] = priceRange(cat.unit);
  const startingPrice = Math.round(rng.int(lo, hi) / 500) * 500;
  const lat = +(CITY_CENTER.lat + rng.float(-0.08, 0.08, 4)).toFixed(4);
  const lng = +(CITY_CENTER.lng + rng.float(-0.08, 0.08, 4)).toFixed(4);
  return {
    id: `prov_${index}`,
    slug,
    name: p.name,
    avatar: avatar(p.name),
    coverImage: themedImage(cat.keywords, `${seed}-cover`, 800, 400),
    categoryId: cat.id,
    categoryLabel: cat.label,
    group: cat.group,
    tagline: rng.pick(TAGLINES),
    bio: `${p.first} est ${cat.label.toLowerCase()} à Bamako depuis ${rng.int(2, 18)} ans. ${rng.pick(TAGLINES)}. Interventions dans tout le district de Bamako et environs.`,
    rating,
    reviewCount: Math.round(jobsCompleted * rng.float(0.4, 0.9)),
    jobsCompleted,
    yearsExperience: rng.int(1, 20),
    startingPrice,
    unit: cat.unit,
    priceLabel: `Dès ${fmt(startingPrice)} FCFA${UNIT_SUFFIX[cat.unit]}`,
    district: rng.pick(BAMAKO_DISTRICTS),
    address: `${rng.int(1, 400)} Rue ${rng.int(100, 900)}, ${rng.pick(BAMAKO_DISTRICTS)}`,
    lat,
    lng,
    distanceKm: rng.float(0.4, 14, 1),
    kycStatus,
    verified: kycStatus === "VERIFIED",
    badges: badgesFor(rng, rating, jobsCompleted, kycStatus),
    online: rng.bool(0.45),
    responseTimeMin: rng.pick([5, 10, 15, 20, 30, 45, 60]),
    completionRate: rng.int(88, 100),
    repeatClientRate: rng.int(20, 72),
    skills: rng.sample(SKILLS_POOL, rng.int(3, 6)),
    languages: rng.sample(LANGS, rng.int(2, 4)),
    phone: `+223 ${rng.pick(["70", "76", "66", "90", "94", "83"])} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)}`,
    memberSince: iso(rng.int(30, 900) * DAY),
    availability: availability(rng),
    portfolio: portfolio(cat, seed, rng),
    walletBalance: rng.int(5000, 320000),
  };
}

let _providersCache: ServiceProvider[] | null = null;
export function generateProviders(count = 2000): ServiceProvider[] {
  if (_providersCache && _providersCache.length === count) return _providersCache;
  // Répartition : au moins 3 prestataires par catégorie, le reste aléatoire.
  const list: ServiceProvider[] = [];
  let i = 0;
  for (const cat of SERVICE_CATEGORIES) {
    for (let k = 0; k < 3; k++) list.push(generateProvider(i++, cat.id));
  }
  while (list.length < count) list.push(generateProvider(i++));
  _providersCache = list;
  return list;
}

export function providerBySlug(slug: string): ServiceProvider | null {
  return generateProviders().find((p) => p.slug === slug) ?? null;
}

/** Prestataire « connecté » pour le portail /pro (démo). */
export function meProvider(): ServiceProvider {
  return featuredProviders(1)[0] ?? generateProviders()[0];
}

export interface ProviderQuery {
  category?: string;
  group?: ServiceGroup;
  q?: string;
  verifiedOnly?: boolean;
  onlineOnly?: boolean;
  sort?: "rating" | "price" | "distance" | "jobs";
  page?: number;
  pageSize?: number;
}

export function queryProviders(query: ProviderQuery = {}): { items: ServiceProvider[]; total: number } {
  let items = generateProviders();
  if (query.category) items = items.filter((p) => p.categoryId === query.category);
  if (query.group) items = items.filter((p) => p.group === query.group);
  if (query.verifiedOnly) items = items.filter((p) => p.verified);
  if (query.onlineOnly) items = items.filter((p) => p.online);
  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q),
    );
  }
  const sort = query.sort ?? "rating";
  items = [...items].sort((a, b) => {
    if (sort === "price") return a.startingPrice - b.startingPrice;
    if (sort === "distance") return a.distanceKm - b.distanceKm;
    if (sort === "jobs") return b.jobsCompleted - a.jobsCompleted;
    return b.rating * b.reviewCount - a.rating * a.reviewCount;
  });
  const total = items.length;
  const page = query.page ?? 0;
  const size = query.pageSize ?? 24;
  return { items: items.slice(page * size, page * size + size), total };
}

/** Catégories avec compteur de prestataires (pour la home services). */
export function serviceCategories(): (ServiceCategoryDef & { count: number })[] {
  const all = generateProviders();
  return SERVICE_CATEGORIES.map((c) => ({ ...c, count: all.filter((p) => p.categoryId === c.id).length }));
}

export function featuredProviders(n = 8): ServiceProvider[] {
  return [...generateProviders()]
    .filter((p) => p.verified && p.rating >= 4.5)
    .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
    .slice(0, n);
}

/* ────────────────────────────── avis ───────────────────────────── */

export function generateProviderReviews(providerId: string, count = 12): ServiceReview[] {
  const base = hashString(providerId);
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(base, i + 7);
    const p = fullName(rng);
    return {
      id: `srev_${providerId}_${i}`,
      providerId,
      author: p.name,
      avatar: avatar(p.name),
      rating: rng.int(3, 5),
      comment: rng.pick(REVIEW_COMMENTS),
      date: iso(rng.int(1, 240) * DAY),
      jobType: rng.pick(JOB_TYPES),
      verified: rng.bool(0.85),
    };
  });
}

/* ────────────────────────────── interventions ───────────────────────────── */

const STATUS_FLOW: InterventionStatus[] = [
  "REQUESTED", "QUOTED", "ACCEPTED", "SCHEDULED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED",
];

export const INTERVENTION_STATUS_META: Record<
  InterventionStatus,
  { label: string; tone: "info" | "warning" | "success" | "error" | "brand"; icon: string }
> = {
  REQUESTED: { label: "Demande envoyée", tone: "warning", icon: "Send" },
  QUOTED: { label: "Devis reçu", tone: "info", icon: "FileText" },
  ACCEPTED: { label: "Devis accepté", tone: "info", icon: "Check" },
  SCHEDULED: { label: "Planifiée", tone: "brand", icon: "CalendarClock" },
  EN_ROUTE: { label: "En route", tone: "brand", icon: "Navigation" },
  IN_PROGRESS: { label: "En cours", tone: "brand", icon: "Wrench" },
  COMPLETED: { label: "Terminée", tone: "success", icon: "CheckCircle2" },
  CANCELLED: { label: "Annulée", tone: "error", icon: "XCircle" },
  DISPUTED: { label: "Litige", tone: "error", icon: "AlertTriangle" },
};

const PAY_METHODS: ServicePaymentMethod[] = ["WALLET", "ORANGE_MONEY", "MOOV_MONEY", "WAVE", "CASH", "CARD"];

function timelineFor(status: InterventionStatus, createdMsAgo: number, rng: Rng): InterventionEvent[] {
  const idx = STATUS_FLOW.indexOf(status);
  const reached = idx >= 0 ? STATUS_FLOW.slice(0, idx + 1) : STATUS_FLOW.slice(0, 2);
  const events: InterventionEvent[] = reached.map((s, i) => ({
    at: iso(createdMsAgo - i * rng.int(2, 20) * 3_600_000),
    status: s,
    label: INTERVENTION_STATUS_META[s].label,
  }));
  if (status === "CANCELLED") events.push({ at: iso(createdMsAgo - 3_600_000), status: "CANCELLED", label: "Annulée par le client" });
  return events;
}

/** Interventions vues côté client ("me") ou prestataire selon le filtrage appelant. */
export function generateInterventions(count = 18, seedBase = 4242): ServiceIntervention[] {
  const providers = generateProviders();
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(seedBase, i);
    const prov = rng.pick(providers);
    const cat = CATEGORY_BY_ID[prov.categoryId];
    const statusPool: InterventionStatus[] =
      i < 2 ? ["REQUESTED", "QUOTED"] :
      i < 6 ? ["SCHEDULED", "EN_ROUTE", "IN_PROGRESS"] :
      ["COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED"];
    const status = rng.pick(statusPool);
    const createdMsAgo = rng.int(1, 60) * DAY;
    const quote = Math.round(rng.int(prov.startingPrice, prov.startingPrice * 4) / 500) * 500;
    const done = status === "COMPLETED";
    const client = fullName(rng);
    return {
      id: `intv_${seedBase}_${i}`,
      ref: `SRV-${(hashString(`${seedBase}-${i}`) % 1_000_000).toString().padStart(6, "0")}`,
      providerId: prov.id,
      providerName: prov.name,
      providerAvatar: prov.avatar,
      categoryId: cat.id,
      categoryLabel: cat.label,
      clientName: i < 8 ? "Seydou Tounkara" : client.name,
      clientAvatar: avatar(i < 8 ? "Seydou Tounkara" : client.name),
      status,
      urgent: rng.bool(0.2),
      createdAt: iso(createdMsAgo),
      scheduledAt: iso(createdMsAgo - rng.int(1, 5) * DAY),
      address: `${rng.int(1, 400)} Rue ${rng.int(100, 900)}`,
      district: rng.pick(BAMAKO_DISTRICTS),
      description: `${rng.pick(JOB_TYPES)} — ${cat.label.toLowerCase()}. ${rng.pick(TAGLINES)}.`,
      quoteAmount: quote,
      finalAmount: done ? quote + (rng.bool(0.3) ? rng.int(0, 5000) : 0) : 0,
      paymentMethod: rng.pick(PAY_METHODS),
      paid: done && rng.bool(0.9),
      rating: done ? rng.int(3, 5) : null,
      timeline: timelineFor(status, createdMsAgo, rng),
    };
  });
}

/** Interventions du client courant (pour /home-services/interventions). */
export function clientInterventions(): ServiceIntervention[] {
  return generateInterventions(10, 4242);
}

/** Interventions reçues par le prestataire courant (portail /pro). */
export function providerInterventions(): ServiceIntervention[] {
  return generateInterventions(16, 7777);
}

/* ────────────────────────────── portail prestataire ───────────────────────────── */

export function generateProviderDashboard(seed = 7777): ProviderDashboard {
  const rng = seededRng(seed, 3);
  const week = rng.int(4, 14);
  const weekRevenue = rng.int(120_000, 480_000);
  return {
    todayJobs: rng.int(0, 4),
    weekJobs: week,
    weekRevenue,
    monthRevenue: weekRevenue * rng.int(3, 5),
    pendingQuotes: rng.int(1, 8),
    rating: rng.float(4.2, 5, 1),
    reviewCount: rng.int(30, 220),
    completionRate: rng.int(90, 100),
    responseTimeMin: rng.pick([5, 10, 15, 20, 30]),
    repeatRate: rng.int(28, 68),
    upcomingCount: rng.int(2, 9),
    walletBalance: rng.int(40_000, 420_000),
    earningsSeries: Array.from({ length: 14 }, (_, i) => {
      const d = new Date(NOW - (13 - i) * DAY);
      return { label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), value: seededRng(seed, i + 40).int(0, 90_000) };
    }),
  };
}

export function generateProviderKyc(seed = 7777): ProviderKyc {
  const rng = seededRng(seed, 11);
  const mk = (type: string, label: string, status: ProviderKyc["docs"][number]["status"]): ProviderKyc["docs"][number] => ({
    type, label, status, uploadedAt: status === "PENDING" ? null : iso(rng.int(10, 200) * DAY),
  });
  return {
    status: "VERIFIED",
    submittedAt: iso(rng.int(30, 300) * DAY),
    note: "Compte vérifié. Pièces valides et à jour.",
    docs: [
      mk("id", "Carte d'identité (CNI/NINA)", "VERIFIED"),
      mk("selfie", "Selfie de vérification", "VERIFIED"),
      mk("proof", "Justificatif de domicile", "VERIFIED"),
      mk("certificate", "Attestation de métier", rng.bool(0.6) ? "VERIFIED" : "PENDING"),
      mk("insurance", "Assurance responsabilité", rng.bool(0.5) ? "VERIFIED" : "PENDING"),
    ],
  };
}

/* ────────────────────────────── back-office admin ───────────────────────────── */

export function generateServiceStats(): ServiceStats {
  const all = generateProviders();
  const interventions = DEMO_VOLUMES.services.interventions;
  return {
    providers: all.length,
    activeProviders: all.filter((p) => p.online || p.verified).length,
    interventions,
    completedInterventions: Math.round(interventions * 0.78),
    reviews: DEMO_VOLUMES.services.reviews,
    avgRating: +(all.reduce((s, p) => s + p.rating, 0) / all.length).toFixed(2),
    pendingKyc: all.filter((p) => p.kycStatus === "PENDING").length,
    gmv: 384_500_000,
  };
}

function toAdminRow(p: ServiceProvider): AdminProviderRow {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    avatar: p.avatar,
    categoryLabel: p.categoryLabel,
    district: p.district,
    rating: p.rating,
    jobsCompleted: p.jobsCompleted,
    kycStatus: p.kycStatus,
    online: p.online,
    gmv: p.jobsCompleted * p.startingPrice,
    joinedAt: p.memberSince,
  };
}

/** Table paginée des prestataires (back-office admin). */
export function generateAdminProviderRows(page = 0, pageSize = 15): { items: AdminProviderRow[]; total: number } {
  const all = generateProviders();
  const items = all.slice(page * pageSize, page * pageSize + pageSize).map(toAdminRow);
  return { items, total: all.length };
}

/** Prestataires dont le KYC est en attente (file de vérification admin, plafonnée). */
export function generatePendingKycRows(limit = 20): AdminProviderRow[] {
  return generateProviders()
    .filter((p) => p.kycStatus === "PENDING")
    .slice(0, limit)
    .map(toAdminRow);
}
