/** Assistant d'inscription commerçant — types, constantes & helpers déterministes. */

export type PayoutMethod = "ORANGE_MONEY" | "WAVE" | "MOOV_MONEY" | "BANK";

export interface OnboardingData {
  commerceType: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  documents: Record<string, boolean>;
  payoutMethod: PayoutMethod;
  payoutNumber: string;
  iban: string;
  walletEnabled: boolean;
  address: string;
  district: string;
  deliveryRadius: number;
  acceptTerms: boolean;
}

export const INITIAL_DATA: OnboardingData = {
  commerceType: "",
  businessName: "",
  ownerName: "",
  phone: "",
  email: "",
  documents: {},
  payoutMethod: "ORANGE_MONEY",
  payoutNumber: "",
  iban: "",
  walletEnabled: true,
  address: "",
  district: "",
  deliveryRadius: 5,
  acceptTerms: false,
};

export interface StepMeta {
  id: number;
  label: string;
  short: string;
  icon: string;
}

export const STEPS: StepMeta[] = [
  { id: 0, label: "Informations", short: "Infos", icon: "Store" },
  { id: 1, label: "Documents", short: "Docs", icon: "FileText" },
  { id: 2, label: "Informations bancaires", short: "Banque", icon: "Landmark" },
  { id: 3, label: "Adresse & zone", short: "Adresse", icon: "MapPin" },
  { id: 4, label: "Validation", short: "Validation", icon: "CheckCircle2" },
];

export interface CommerceType {
  key: string;
  label: string;
  icon: string;
}

export const COMMERCE_TYPES: CommerceType[] = [
  { key: "RESTAURANT", label: "Restaurant", icon: "UtensilsCrossed" },
  { key: "FAST_FOOD", label: "Fast Food", icon: "Sandwich" },
  { key: "SUPERMARKET", label: "Supermarché", icon: "ShoppingCart" },
  { key: "PHARMACY", label: "Pharmacie", icon: "Cross" },
  { key: "MARKET", label: "Marché", icon: "Store" },
  { key: "BAKERY", label: "Boulangerie", icon: "Croissant" },
  { key: "BUTCHER", label: "Boucherie", icon: "Beef" },
  { key: "FLORIST", label: "Fleuriste", icon: "Flower2" },
  { key: "PET_SHOP", label: "Animalerie", icon: "PawPrint" },
  { key: "ELECTRONICS", label: "Électronique", icon: "Cpu" },
  { key: "FASHION", label: "Mode", icon: "Shirt" },
  { key: "BEAUTY", label: "Beauté", icon: "Sparkles" },
  { key: "HEALTH", label: "Santé", icon: "HeartPulse" },
  { key: "SERVICES", label: "Services", icon: "Wrench" },
  { key: "CRAFTS", label: "Artisan", icon: "Hammer" },
];

export const COMMERCE_LABEL: Record<string, string> = Object.fromEntries(
  COMMERCE_TYPES.map((c) => [c.key, c.label]),
);

export interface DocDef {
  key: string;
  label: string;
  desc: string;
  icon: string;
  required: boolean;
}

export const DOCUMENTS: DocDef[] = [
  { key: "ID", label: "Pièce d'identité", desc: "CNI ou passeport du propriétaire", icon: "IdCard", required: true },
  { key: "RCCM", label: "RCCM", desc: "Registre du commerce et du crédit mobilier", icon: "FileText", required: true },
  { key: "NIF", label: "NIF", desc: "Numéro d'identification fiscale", icon: "FileDigit", required: false },
  { key: "IFU", label: "IFU", desc: "Identifiant fiscal unique", icon: "Receipt", required: false },
  { key: "LICENSE", label: "Licence", desc: "Licence d'exploitation (si applicable)", icon: "ScrollText", required: false },
  { key: "PERMITS", label: "Autorisations", desc: "Autorisations sanitaires / municipales", icon: "ShieldCheck", required: false },
];

export const PAYOUT_METHODS: { key: PayoutMethod; label: string; icon: string; hint: string; color: string }[] = [
  { key: "ORANGE_MONEY", label: "Orange Money", icon: "Smartphone", hint: "Numéro Orange Money", color: "text-orange-500" },
  { key: "WAVE", label: "Wave", icon: "Waves", hint: "Numéro Wave", color: "text-sky-500" },
  { key: "MOOV_MONEY", label: "Moov Money", icon: "Smartphone", hint: "Numéro Moov Money", color: "text-blue-500" },
  { key: "BANK", label: "Compte bancaire", icon: "Landmark", hint: "IBAN / numéro de compte", color: "text-ink" },
];

export const PAYOUT_LABEL: Record<PayoutMethod, string> = {
  ORANGE_MONEY: "Orange Money",
  WAVE: "Wave",
  MOOV_MONEY: "Moov Money",
  BANK: "Compte bancaire",
};

/** Nombre de fichiers minimum requis (pièces obligatoires). */
export const REQUIRED_DOCS = DOCUMENTS.filter((d) => d.required).map((d) => d.key);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8;
}

/** Validité de chaque étape (index 0..4). */
export function stepValidity(d: OnboardingData): boolean[] {
  const step1 =
    d.commerceType !== "" &&
    d.businessName.trim().length >= 2 &&
    d.ownerName.trim().length >= 2 &&
    isValidPhone(d.phone) &&
    isValidEmail(d.email);

  const step2 = REQUIRED_DOCS.every((k) => d.documents[k]);

  const step3 =
    d.payoutMethod === "BANK"
      ? d.iban.replace(/\s/g, "").length >= 8
      : isValidPhone(d.payoutNumber);

  const step4 = d.address.trim().length >= 3 && d.district !== "";

  const step5 = d.acceptTerms;

  return [step1, step2, step3, step4, step5];
}

/** Numéro de dossier déterministe (aucun Math.random/Date.now). */
export function dossierNumber(d: OnboardingData): string {
  const seed = `${d.businessName}|${d.ownerName}|${d.phone}|${d.commerceType}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = 10000 + (Math.abs(h) % 90000);
  return `MP-2026-${n}`;
}
