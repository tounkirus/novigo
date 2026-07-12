import type {
  CmsBanner, CmsPage, CmsCollection, MediaAsset, CrmCustomer, CrmSegment, CustomerSegment,
  SupportTicket, InventoryItem, Supplier, Invoice, FinanceSummary, Role, FeatureFlag, SystemService, AuditLog,
} from "@/types/backoffice";
import { NOW, BAMAKO_DISTRICTS } from "@/constants";
import { seededRng } from "./rng";
import { avatar } from "./images";
import { themedImage } from "./media";
import { fullName } from "./generators";

const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

/* --------------------------------- CMS --------------------------------- */
export function generateBanners(): CmsBanner[] {
  const titles = [
    ["Offre du jour", "Jusqu'à -40% sur vos plats préférés", "HOME_HERO"],
    ["Livraison gratuite", "Ce week-end sur toute la ville", "HOME_STRIP"],
    ["Nouveau : Taxi NOVIGO", "Déplacez-vous en un clic", "HOME_HERO"],
    ["Ramadan Mubarak", "Menus spéciaux à découvrir", "CATEGORY"],
    ["Premium à -50%", "Le 1er mois offert", "CHECKOUT"],
    ["Produits locaux", "Soutenez les producteurs maliens", "HOME_STRIP"],
  ] as const;
  const st = ["PUBLISHED", "DRAFT", "SCHEDULED"] as const;
  return titles.map((t, i) => {
    const rng = seededRng(11001, i);
    return {
      id: `banner_${i}`,
      title: t[0],
      subtitle: t[1],
      image: themedImage("food,promotion,sale", `cms-banner-${i}`, 800, 400),
      placement: t[2],
      status: i === 0 ? "PUBLISHED" : rng.pick(st),
      clicks: rng.int(200, 8000),
      impressions: rng.int(10000, 220000),
      startAt: iso((i + 2) * 86_400_000),
      endAt: iso(-((i + 5) * 86_400_000)),
    };
  });
}

export function generatePages(): CmsPage[] {
  const defs = [
    ["Conditions générales", "cgu", "LEGAL"], ["Politique de confidentialité", "confidentialite", "LEGAL"],
    ["À propos de NOVIGO", "a-propos", "MARKETING"], ["Comment commander", "aide-commander", "HELP"],
    ["Devenir livreur", "devenir-livreur", "MARKETING"], ["Devenir partenaire", "devenir-partenaire", "MARKETING"],
    ["Paiement & remboursement", "paiement", "HELP"], ["Le blog NOVIGO", "blog", "BLOG"],
    ["Programme de fidélité", "fidelite", "MARKETING"], ["Mentions légales", "mentions-legales", "LEGAL"],
  ] as const;
  return defs.map((d, i) => {
    const rng = seededRng(11002, i);
    const p = fullName(rng);
    return {
      id: `page_${i}`,
      title: d[0],
      slug: d[1],
      type: d[2],
      status: rng.bool(0.8) ? "PUBLISHED" : "DRAFT",
      updatedAt: iso(i * 3 * 86_400_000),
      author: p.name,
      views: rng.int(120, 48000),
    };
  });
}

export function generateCollections(): CmsCollection[] {
  const defs = [
    ["Produits locaux 🇲🇱", "Le meilleur du terroir malien"],
    ["Healthy & équilibré", "Manger sain à Bamako"],
    ["Envie de sucré", "Pâtisseries & desserts"],
    ["Pharmacies 24/7", "Santé à toute heure"],
    ["Fast & Good", "Livré en moins de 25 min"],
    ["Spécial familles", "Grandes portions, petits prix"],
  ];
  return defs.map((d, i) => {
    const rng = seededRng(11003, i);
    return {
      id: `collection_${i}`,
      name: d[0],
      description: d[1],
      image: themedImage("food,african,cuisine", `cms-collection-${i}`, 600, 400),
      itemCount: rng.int(8, 60),
      status: rng.bool(0.85) ? "PUBLISHED" : "DRAFT",
      featured: i < 3,
    };
  });
}

export function generateMedia(): MediaAsset[] {
  return Array.from({ length: 12 }, (_, i) => {
    const rng = seededRng(11004, i);
    const isVideo = rng.bool(0.15);
    return {
      id: `media_${i}`,
      name: `${isVideo ? "video" : "visuel"}-novigo-${i + 1}.${isVideo ? "mp4" : "jpg"}`,
      url: themedImage("food,product,dish", `cms-media-${i}`, 400, 400),
      type: isVideo ? "VIDEO" : "IMAGE",
      size: `${rng.int(120, 4800)} Ko`,
      uploadedAt: iso(i * 2 * 86_400_000),
    };
  });
}

/* --------------------------------- CRM --------------------------------- */
const SEGMENTS: { name: CustomerSegment; label: string; color: string }[] = [
  { name: "VIP", label: "Clients VIP", color: "from-gold to-gold-dark" },
  { name: "FIDELE", label: "Clients fidèles", color: "from-brand to-brand-dark" },
  { name: "NOUVEAU", label: "Nouveaux clients", color: "from-sky-500 to-blue-600" },
  { name: "INACTIF", label: "Clients inactifs", color: "from-slate-400 to-slate-600" },
  { name: "A_RISQUE", label: "Clients à risque", color: "from-amber-500 to-orange-600" },
];

export function generateCrmCustomers(count = 60): CrmCustomer[] {
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(12001, i);
    const p = fullName(rng);
    const seg = rng.pick(SEGMENTS).name;
    const orders = seg === "VIP" ? rng.int(60, 320) : seg === "FIDELE" ? rng.int(20, 80) : seg === "NOUVEAU" ? rng.int(1, 5) : rng.int(0, 15);
    return {
      id: `cust_${i}`,
      name: p.name,
      avatar: avatar(p.name),
      phone: `+223 ${rng.pick(["70", "76", "66", "90"])} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)}`,
      email: `${p.first.toLowerCase()}.${p.last.toLowerCase()}@mail.ml`,
      district: rng.pick(BAMAKO_DISTRICTS),
      segment: seg,
      orders,
      ltv: orders * rng.int(2500, 6000),
      lastOrderAt: iso(rng.int(0, 90) * 86_400_000),
      joinedAt: iso(rng.int(30, 720) * 86_400_000),
      status: seg === "INACTIF" ? "INACTIVE" : seg === "A_RISQUE" ? "CHURN_RISK" : "ACTIVE",
      satisfaction: rng.int(58, 99),
    };
  });
}

export function generateCrmSegments(): CrmSegment[] {
  const customers = generateCrmCustomers(600);
  return SEGMENTS.map((s, i) => {
    const inSeg = customers.filter((c) => c.segment === s.name);
    const rng = seededRng(12002, i);
    return {
      id: `seg_${s.name}`,
      name: s.name,
      label: s.label,
      count: inSeg.length,
      revenue: inSeg.reduce((sum, c) => sum + c.ltv, 0),
      color: s.color,
      trend: rng.int(-8, 24),
    };
  });
}

export function generateTickets(count = 24): SupportTicket[] {
  const subjects = [
    "Commande non reçue", "Problème de paiement Orange Money", "Article manquant", "Livreur introuvable",
    "Demande de remboursement", "Erreur d'adresse", "Application lente", "Code promo invalide",
    "Compte bloqué", "Facture incorrecte",
  ];
  const ch = ["CHAT", "EMAIL", "PHONE", "APP"] as const;
  const pr = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
  const st = ["OPEN", "PENDING", "RESOLVED"] as const;
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(12003, i);
    const p = fullName(rng);
    const agent = fullName(seededRng(12004, i));
    return {
      id: `ticket_${i}`,
      ref: `TK-${rng.int(10000, 99999)}`,
      customer: p.name,
      avatar: avatar(p.name),
      subject: rng.pick(subjects),
      channel: rng.pick(ch),
      priority: i < 3 ? "URGENT" : rng.pick(pr),
      status: i < 6 ? "OPEN" : rng.pick(st),
      createdAt: iso(i * 3_600_000 + rng.int(0, 3_000_000)),
      agent: rng.bool(0.7) ? agent.name : undefined,
    };
  });
}

/* --------------------------------- ERP --------------------------------- */
export function generateInventory(count = 40): InventoryItem[] {
  const products = ["Riz parfumé 5kg", "Huile 5L", "Sucre 1kg", "Lait concentré", "Tomate concentrée", "Spaghetti 500g", "Farine 1kg", "Thé vert", "Savon", "Eau 1,5L", "Sardines", "Mil 5kg", "Oignons 2kg", "Poulet 1,2kg", "Yaourt x4", "Œufs x12", "Café 200g", "Biscuits"];
  const cats = ["Épicerie", "Boissons", "Hygiène", "Frais", "Surgelés"];
  const suppliers = ["Grossiste Bamako", "Import Sahel", "Coopérative Ségou", "Distrib Mali", "Fournisseur Kayes"];
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(13001, i);
    const stock = rng.int(0, 300);
    const reorder = rng.int(20, 60);
    const cost = rng.int(300, 8000);
    return {
      id: `inv_${i}`,
      name: `${products[i % products.length]}${i >= products.length ? " " + (Math.floor(i / products.length) + 1) : ""}`,
      sku: `SKU-${1000 + i}`,
      category: rng.pick(cats),
      supplier: rng.pick(suppliers),
      stock,
      reorderLevel: reorder,
      costPrice: cost,
      sellPrice: Math.round((cost * rng.float(1.2, 1.8)) / 50) * 50,
      status: stock === 0 ? "OUT" : stock <= reorder ? "LOW" : "IN_STOCK",
    };
  });
}

export function generateSuppliers(count = 18): Supplier[] {
  const names = ["Grossiste Bamako", "Import Sahel", "Coopérative Ségou", "Distrib Mali", "Fournisseur Kayes", "Agro Sikasso", "Négoce Niger", "Comptoir Mopti"];
  const cats = ["Épicerie", "Boissons", "Frais", "Hygiène", "Céréales"];
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(13002, i);
    const p = fullName(rng);
    return {
      id: `sup_${i}`,
      name: `${names[i % names.length]}${i >= names.length ? " " + (Math.floor(i / names.length) + 1) : ""}`,
      contact: p.name,
      phone: `+223 ${rng.pick(["70", "76", "66"])} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)}`,
      category: rng.pick(cats),
      items: rng.int(8, 120),
      reliability: rng.int(72, 99),
      balance: rng.int(-200000, 800000),
    };
  });
}

export function generateInvoices(count = 30): Invoice[] {
  const types = ["PAYOUT", "INVOICE", "COMMISSION"] as const;
  const st = ["PAID", "PENDING", "OVERDUE"] as const;
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(13003, i);
    const p = fullName(rng);
    return {
      id: `invoice_${i}`,
      ref: `FA-2026-${String(1000 + i)}`,
      party: rng.bool(0.5) ? p.name : ["Chez Fatou", "Supermarché Fasokan", "Le Balafon", "Pharmacie Centrale"][i % 4],
      type: rng.pick(types),
      amount: rng.int(25000, 1_500_000),
      status: i < 4 ? "OVERDUE" : rng.pick(st),
      dueAt: iso(-((i - 6) * 86_400_000)),
    };
  });
}

export function generateFinanceSummary(): FinanceSummary {
  return { revenue: 184_500_000, commissions: 27_675_000, payouts: 148_200_000, pending: 8_620_000, netProfit: 27_675_000 };
}

/* ------------------------------ Super Admin ---------------------------- */
export function generateRoles(): Role[] {
  return [
    { id: "superadmin", name: "Super Admin", users: 3, permissions: 128, color: "from-brand to-brand-dark", description: "Accès total à la plateforme" },
    { id: "admin", name: "Administrateur", users: 12, permissions: 96, color: "from-violet-500 to-purple-700", description: "Gestion opérationnelle" },
    { id: "ops", name: "Opérations", users: 28, permissions: 54, color: "from-sky-500 to-blue-600", description: "Commandes & logistique" },
    { id: "support", name: "Support client", users: 45, permissions: 32, color: "from-emerald-500 to-green-600", description: "Tickets & assistance" },
    { id: "finance", name: "Finance", users: 8, permissions: 40, color: "from-amber-500 to-orange-600", description: "Paiements & reversements" },
    { id: "marketing", name: "Marketing", users: 15, permissions: 38, color: "from-pink-500 to-rose-600", description: "CMS, promos & publicité" },
  ];
}

export function generateFeatureFlags(): FeatureFlag[] {
  const defs = [
    ["taxi_module", "Module Taxi", "Active la réservation de courses", true, 100],
    ["ai_reco", "Recommandations IA", "Suggestions personnalisées sur la home", true, 100],
    ["premium_v2", "Premium V2", "Nouvelle grille d'abonnement", true, 60],
    ["live_tracking", "Suivi temps réel", "Position du livreur sur carte", true, 80],
    ["parcel_module", "Envoi de colis", "Service logistique C2C", true, 100],
    ["wave_payment", "Paiement Wave", "Intégration Wave", true, 100],
    ["dark_theme_auto", "Thème auto", "Bascule selon l'heure", false, 0],
    ["group_orders", "Commandes groupées", "Panier partagé entre amis", false, 15],
  ] as const;
  return defs.map((d, i) => ({
    id: `flag_${i}`,
    key: d[0],
    label: d[1],
    description: d[2],
    enabled: d[3],
    rollout: d[4],
    env: i % 4 === 3 ? "STAGING" : "PROD",
  }));
}

export function generateSystemServices(): SystemService[] {
  const defs: [string, SystemService["status"], number, number][] = [
    ["API Gateway", "OPERATIONAL", 99.98, 42],
    ["Base de données", "OPERATIONAL", 99.99, 8],
    ["Service Paiements", "OPERATIONAL", 99.95, 120],
    ["Notifications Push", "DEGRADED", 98.7, 340],
    ["WebSocket temps réel", "OPERATIONAL", 99.9, 24],
    ["Moteur de recherche", "OPERATIONAL", 99.97, 36],
    ["Service Cartographie", "OPERATIONAL", 99.92, 88],
    ["Stockage média", "OPERATIONAL", 99.99, 15],
  ];
  return defs.map((d, i) => ({ id: `svc_${i}`, name: d[0], status: d[1], uptime: d[2], latencyMs: d[3] }));
}

export function generateAuditLogs(count = 20): AuditLog[] {
  const actions = [
    ["a validé le commerce", "Chez Fatou", "INFO"], ["a suspendu l'utilisateur", "cust_204", "WARNING"],
    ["a modifié le rôle", "Support client", "INFO"], ["a publié la bannière", "Offre du jour", "INFO"],
    ["a remboursé la commande", "MP-100234", "INFO"], ["a activé le flag", "premium_v2", "WARNING"],
    ["a supprimé la page CMS", "blog", "CRITICAL"], ["a exporté la base clients", "600 clients", "CRITICAL"],
    ["a ajusté le stock", "SKU-1004", "INFO"], ["a créé une campagne pub", "Menu du midi -20%", "INFO"],
  ] as const;
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(14001, i);
    const p = fullName(rng);
    const a = actions[i % actions.length];
    return {
      id: `audit_${i}`,
      actor: p.name,
      action: a[0],
      target: a[1],
      at: iso(i * 1_800_000 + rng.int(0, 1_000_000)),
      ip: `197.${rng.int(0, 255)}.${rng.int(0, 255)}.${rng.int(1, 254)}`,
      level: a[2],
    };
  });
}
