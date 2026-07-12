/**
 * Services à Domicile — types du module « artisans & professionnels ».
 * 50 catégories de métiers, prestataires (KYC, portfolio, disponibilité, avis),
 * demandes d'intervention (devis → réalisation → paiement), tableau de bord prestataire.
 * Prêt à brancher sur une vraie API : signatures et types stables.
 */

/** Grandes familles de métiers. */
export type ServiceGroup = "MAISON" | "BIENETRE" | "EVENEMENT" | "AUTO" | "NUMERIQUE" | "COURS" | "PRO";

/** Unité de tarification affichée. */
export type PriceUnit = "HOUR" | "JOB" | "DAY";

/** Définition d'une catégorie de service (métier). */
export interface ServiceCategoryDef {
  id: string; // slug stable, ex. "plomberie"
  label: string;
  icon: string; // nom d'icône Lucide
  group: ServiceGroup;
  gradient: string; // dégradé Tailwind (from-… to-…)
  keywords: string; // mots-clés médiathèque (images réalistes)
  unit: PriceUnit;
}

export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
export type ProviderBadge = "VERIFIED" | "TOP_RATED" | "FAST_RESPONSE" | "PRO" | "NEW" | "ELITE";

/** Créneau de disponibilité hebdomadaire (day 0 = dimanche). */
export interface Availability {
  day: number;
  from: string;
  to: string;
  off: boolean;
}

/** Élément du portfolio d'un prestataire. */
export interface PortfolioItem {
  id: string;
  image: string;
  title: string;
}

/** Fiche prestataire de service à domicile. */
export interface ServiceProvider {
  id: string;
  slug: string;
  name: string;
  avatar: string;
  coverImage: string;
  categoryId: string;
  categoryLabel: string;
  group: ServiceGroup;
  tagline: string;
  bio: string;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  yearsExperience: number;
  startingPrice: number; // FCFA
  unit: PriceUnit;
  priceLabel: string; // ex. « À partir de 5 000 FCFA/h »
  district: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  kycStatus: KycStatus;
  verified: boolean;
  badges: ProviderBadge[];
  online: boolean;
  responseTimeMin: number;
  completionRate: number; // %
  repeatClientRate: number; // %
  skills: string[];
  languages: string[];
  phone: string;
  memberSince: string; // ISO
  availability: Availability[];
  portfolio: PortfolioItem[];
  walletBalance: number;
}

export type InterventionStatus =
  | "REQUESTED"
  | "QUOTED"
  | "ACCEPTED"
  | "SCHEDULED"
  | "EN_ROUTE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type ServicePaymentMethod =
  | "WALLET"
  | "ORANGE_MONEY"
  | "MOOV_MONEY"
  | "WAVE"
  | "CASH"
  | "CARD";

/** Événement du fil de suivi d'une intervention. */
export interface InterventionEvent {
  at: string; // ISO
  status: InterventionStatus;
  label: string;
  note?: string;
}

/** Demande / intervention de service à domicile. */
export interface ServiceIntervention {
  id: string;
  ref: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  categoryId: string;
  categoryLabel: string;
  clientName: string;
  clientAvatar: string;
  status: InterventionStatus;
  urgent: boolean;
  createdAt: string;
  scheduledAt: string;
  address: string;
  district: string;
  description: string;
  quoteAmount: number;
  finalAmount: number;
  paymentMethod: ServicePaymentMethod;
  paid: boolean;
  rating: number | null;
  timeline: InterventionEvent[];
}

export interface ServiceReview {
  id: string;
  providerId: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  jobType: string;
  verified: boolean;
}

export interface ProviderKycDoc {
  type: string;
  label: string;
  status: KycStatus;
  uploadedAt: string | null;
}

export interface ProviderKyc {
  status: KycStatus;
  docs: ProviderKycDoc[];
  submittedAt: string;
  note: string;
}

/** Tableau de bord du portail prestataire. */
export interface ProviderDashboard {
  todayJobs: number;
  weekJobs: number;
  monthRevenue: number;
  weekRevenue: number;
  pendingQuotes: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
  responseTimeMin: number;
  repeatRate: number;
  upcomingCount: number;
  walletBalance: number;
  earningsSeries: { label: string; value: number }[];
}

/** Statistiques globales (back-office admin). */
export interface ServiceStats {
  providers: number;
  activeProviders: number;
  interventions: number;
  completedInterventions: number;
  reviews: number;
  avgRating: number;
  pendingKyc: number;
  gmv: number;
}

/** Ligne de suivi KYC côté admin. */
export interface AdminProviderRow {
  id: string;
  slug: string;
  name: string;
  avatar: string;
  categoryLabel: string;
  district: string;
  rating: number;
  jobsCompleted: number;
  kycStatus: KycStatus;
  online: boolean;
  gmv: number;
  joinedAt: string;
}
