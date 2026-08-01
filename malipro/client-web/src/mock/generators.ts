import type {
  Store, StoreCategory, Product, MenuSection, Review, Badge, StorePromotion,
  OpeningHour, StoreFaq, Driver, Order, OrderStatus, Coupon, Promotion, Notification, UserProfile,
} from "@/types";
import { Rng, seededRng, hashString } from "./rng";
import { avatar } from "./images";
import { productImage, storeImage } from "./media";
import {
  FIRST_NAMES, LAST_NAMES, RESTAURANT_NAMES, RESTAURANT_CUISINES, DISH_NAMES, GROCERY_NAMES,
  PHARMACY_NAMES, BAKERY_NAMES, BUTCHER_NAMES, SHOP_NAMES, MARKET_NAMES, DRINKS, DESSERTS,
  SLOGANS, REVIEW_COMMENTS, INGREDIENTS, ALLERGENS, VEHICLES,
} from "./pools";
import { BAMAKO_DISTRICTS, CITY_CENTER, NOW, STORE_CATEGORY_LABEL, ORDER_FLOW } from "@/constants";
import { slugify } from "@/lib/utils";

const ALL_BADGES: Badge[] = ["PREMIUM", "VERIFIED", "TOP_SELLER", "FREE_DELIVERY", "NEW", "FAST", "LOCAL", "PROMO"];

export function fullName(rng: Rng): { first: string; last: string; name: string } {
  const first = rng.pick(FIRST_NAMES);
  const last = rng.pick(LAST_NAMES);
  return { first, last, name: `${first} ${last}` };
}

function phone(rng: Rng): string {
  return `+223 ${rng.pick(["70", "76", "66", "90", "94", "83"])} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)}`;
}

function nearBamako(rng: Rng): { lat: number; lng: number } {
  return {
    lat: +(CITY_CENTER.lat + rng.float(-0.08, 0.08, 4)).toFixed(4),
    lng: +(CITY_CENTER.lng + rng.float(-0.08, 0.08, 4)).toFixed(4),
  };
}

function openingHours(rng: Rng): OpeningHour[] {
  return Array.from({ length: 7 }, (_, day) => {
    const closed = day === 0 && rng.bool(0.25);
    return { day, open: rng.pick(["07:00", "08:00", "09:00"]), close: rng.pick(["21:00", "22:00", "23:00"]), closed };
  });
}

const NAME_POOL: Record<StoreCategory, string[]> = {
  RESTAURANT: RESTAURANT_NAMES,
  SUPERMARKET: ["Supermarché", "Alimentation", "Market", "Boutique Express", "Épicerie"].flatMap((p) =>
    ["Fasokan", "Diarra", "Le Point", "Central", "du Fleuve", "Bagan"].map((s) => `${p} ${s}`)),
  PHARMACY: ["Pharmacie"].flatMap(() =>
    ["du Progrès", "Centrale", "de l'Indépendance", "Kènè", "du Rond-Point", "Nando", "de la Paix", "Djoliba"].map((s) => `Pharmacie ${s}`)),
  BAKERY: ["Boulangerie", "Pâtisserie", "Fournil"].flatMap((p) =>
    ["du Coin", "Dorée", "Faso", "Royale", "des Amis", "Soleil"].map((s) => `${p} ${s}`)),
  BUTCHER: ["Boucherie"].flatMap(() =>
    ["Moderne", "du Marché", "Halal", "Sahel", "Centrale", "du Quartier"].map((s) => `Boucherie ${s}`)),
  MARKET: ["Marché"].flatMap(() =>
    ["de Médine", "Dibida", "Rose", "Sugu", "de Sabalibougou", "Central"].map((s) => `Marché ${s}`)),
  SHOP: ["Boutique", "Concept Store", "Shop"].flatMap((p) =>
    ["Faso Style", "Bogolan", "Tech", "Mode", "Prestige", "Kènè"].map((s) => `${p} ${s}`)),
};

const PRODUCT_POOL: Record<StoreCategory, string[]> = {
  RESTAURANT: DISH_NAMES,
  SUPERMARKET: GROCERY_NAMES,
  PHARMACY: PHARMACY_NAMES,
  BAKERY: BAKERY_NAMES,
  BUTCHER: BUTCHER_NAMES,
  MARKET: MARKET_NAMES,
  SHOP: SHOP_NAMES,
};

/**
 * Rayon d'un produit déduit de son nom.
 *
 * Le tirage aléatoire d'une sous-catégorie classait « Alloco poulet » en
 * Desserts ou « Savon de Marseille » en Frais : les menus et les rayons
 * n'avaient aucun sens. Première règle qui matche l'emporte ; à défaut on
 * retombe sur le rayon principal de la catégorie.
 */
const SUBCAT_RULES: Record<StoreCategory, [RegExp, string][]> = {
  RESTAURANT: [
    [/jus|bissap|café|thé|coca|fanta|sprite|eau minérale|djino|bouye|glacé/i, "Boissons"],
    [/dégué|thiakry|glace|gâteau|beignet|salade de fruits|pâtisserie/i, "Desserts"],
    [/salade|fataya|omelette|sandwich|shawarma|brochette/i, "Entrées"],
    [/frites|alloco|attiéké|foutou|couscous|riz cantonais/i, "Accompagnements"],
  ],
  SUPERMARKET: [
    [/eau|jus|lait|thé|café|boisson/i, "Boissons"],
    [/savon|détergent|hygiène|dentifrice|shampoing/i, "Hygiène"],
    [/yaourt|beurre|œuf|oeuf|fromage|crème/i, "Frais"],
    [/congelé|surgelé|glace/i, "Surgelés"],
  ],
  PHARMACY: [
    [/paracétamol|ibuprofène|antipaludéen|sirop|vitamine|fer|collyre/i, "Médicaments"],
    [/thermomètre|tensiomètre|masque|pansement|matériel/i, "Matériel"],
    [/bébé|nourrisson|couche/i, "Bébé"],
    [/crème|gel|alcool|sérum|hydratant/i, "Parapharmacie"],
  ],
  BAKERY: [
    [/croissant|pain au chocolat|chausson|brioche|pain au lait|raisin/i, "Viennoiseries"],
    [/tarte|éclair|millefeuille|cookie|muffin|cake/i, "Pâtisseries"],
    [/gâteau|anniversaire/i, "Gâteaux"],
    [/pain|baguette/i, "Pains"],
  ],
  BUTCHER: [
    [/poulet|volaille|dinde/i, "Volaille"],
    [/mouton|agneau|gigot|merguez/i, "Mouton"],
    [/poisson|capitaine|crevette/i, "Poisson"],
    [/bœuf|boeuf|filet|hachée|foie/i, "Bœuf"],
  ],
  MARKET: [
    [/mangue|banane|papaye|orange|fruit/i, "Fruits"],
    [/gombo|aubergine|feuille|manioc|patate|légume/i, "Légumes"],
    [/piment|tamarin|néré|soumbala|oseille|épice/i, "Épices"],
    [/arachide|mil|sorgho|riz|céréale/i, "Céréales"],
  ],
  SHOP: [
    [/écouteur|chargeur|powerbank|câble|enceinte|coque/i, "Électronique"],
    [/t-shirt|boubou|sandale|casquette/i, "Mode"],
    [/sac|montre|bracelet|lunettes|parfum/i, "Accessoires"],
  ],
};

function subCategoryFor(category: StoreCategory, name: string): string | null {
  for (const [re, sub] of SUBCAT_RULES[category]) if (re.test(name)) return sub;
  return null;
}

const SUBCATS: Record<StoreCategory, string[]> = {
  RESTAURANT: ["Plats", "Entrées", "Boissons", "Desserts", "Accompagnements"],
  SUPERMARKET: ["Épicerie", "Boissons", "Hygiène", "Frais", "Surgelés"],
  PHARMACY: ["Médicaments", "Parapharmacie", "Matériel", "Bébé"],
  BAKERY: ["Pains", "Viennoiseries", "Pâtisseries", "Gâteaux"],
  BUTCHER: ["Bœuf", "Volaille", "Mouton", "Poisson"],
  MARKET: ["Fruits", "Légumes", "Épices", "Céréales"],
  SHOP: ["Mode", "Électronique", "Accessoires", "Maison"],
};

function priceFor(cat: StoreCategory, rng: Rng): number {
  const ranges: Record<StoreCategory, [number, number]> = {
    RESTAURANT: [1000, 6000],
    SUPERMARKET: [500, 12000],
    PHARMACY: [500, 15000],
    BAKERY: [150, 5000],
    BUTCHER: [1500, 20000],
    MARKET: [300, 4000],
    SHOP: [2000, 45000],
  };
  const [lo, hi] = ranges[cat];
  return Math.round(rng.int(lo, hi) / 50) * 50;
}

export function generateProducts(store: { id: string; category: StoreCategory; slug: string }, count: number): Product[] {
  const rng = seededRng(hashString(store.id), 777);
  const pool = PRODUCT_POOL[store.category];
  const subcats = SUBCATS[store.category];
  const extras = store.category === "RESTAURANT" ? [...DRINKS, ...DESSERTS] : [];
  const names = [...pool, ...extras];

  return Array.from({ length: count }, (_, i) => {
    const base = names[i % names.length];
    const name = i < names.length ? base : `${base} ${["Maxi", "Familial", "Duo", "Premium", "Éco"][i % 5]}`;
    const price = priceFor(store.category, rng);
    const hasPromo = rng.bool(0.28);
    const oldPrice = hasPromo ? Math.round((price * rng.float(1.15, 1.5)) / 50) * 50 : undefined;
    const isDrink = DRINKS.includes(base);
    const isDessert = DESSERTS.includes(base);
    // Rayon déduit du produit ; le tirage aléatoire ne sert plus que de repli.
    const sub = isDrink
      ? "Boissons"
      : isDessert
        ? "Desserts"
        : (subCategoryFor(store.category, base) ?? subcats[0]);
    return {
      id: `${store.id}_p${i}`,
      storeId: store.id,
      name,
      description: buildProductDesc(store.category, base, rng),
      image: productImage(store.category, base, `${store.slug}-${slugify(base)}-${i}`, 600, 400),
      gallery: [
        productImage(store.category, base, `${store.slug}-${slugify(base)}-${i}-a`, 600, 400),
        productImage(store.category, base, `${store.slug}-${slugify(base)}-${i}-b`, 600, 400),
      ],
      price,
      oldPrice,
      category: sub,
      subCategory: sub,
      stock: rng.int(0, 120),
      available: rng.bool(0.92),
      weight: store.category === "MARKET" || store.category === "SUPERMARKET" ? rng.pick(["500 g", "1 kg", "2 kg", "1,5 L"]) : undefined,
      unit: rng.pick(["pièce", "portion", "kg", "L", "lot"]),
      variants: store.category === "SHOP" ? rng.sample(["S", "M", "L", "XL", "Noir", "Blanc", "Rouge"], rng.int(2, 4)) : undefined,
      options: store.category === "RESTAURANT" && !isDrink ? buildOptions(store.id, i, rng) : undefined,
      ingredients: store.category === "RESTAURANT" ? rng.sample(INGREDIENTS, rng.int(3, 6)) : undefined,
      allergens: store.category === "RESTAURANT" ? rng.sample(ALLERGENS, rng.int(0, 3)) : undefined,
      calories: store.category === "RESTAURANT" ? rng.int(180, 950) : undefined,
      popularity: rng.int(20, 100),
      rating: rng.float(3.6, 5, 1),
      reviewCount: rng.int(4, 850),
      tags: hasPromo ? (["PROMO"] as Badge[]) : [],
      isFeatured: rng.bool(0.18),
      isBestSeller: rng.bool(0.22),
      isNew: rng.bool(0.15),
    };
  });
}

function buildProductDesc(cat: StoreCategory, base: string, rng: Rng): string {
  const bits: Record<StoreCategory, string[]> = {
    RESTAURANT: ["Préparé maison avec des produits frais.", "Recette traditionnelle généreuse.", "Servi chaud, prêt à déguster.", "Le favori de nos clients."],
    SUPERMARKET: ["Produit de qualité, marque de confiance.", "Idéal pour toute la famille.", "Stock frais garanti.", "Meilleur prix du quartier."],
    PHARMACY: ["Conseil pharmaceutique disponible.", "Conservez hors de portée des enfants.", "Notice incluse.", "Sur ordonnance selon le cas."],
    BAKERY: ["Cuit ce matin dans notre fournil.", "Beurre pur, croustillant à souhait.", "À déguster tiède.", "Fabrication artisanale."],
    BUTCHER: ["Viande fraîche du jour, découpe sur mesure.", "Origine contrôlée, 100% halal.", "Idéal pour vos grillades.", "Sous vide sur demande."],
    MARKET: ["Récolté localement, arrivage du jour.", "Direct producteur.", "Frais et savoureux.", "Prix marché imbattable."],
    SHOP: ["Qualité premium, finitions soignées.", "Tendance et abordable.", "Garantie satisfaction.", "Édition limitée."],
  };
  return `${base} — ${rng.pick(bits[cat])}`;
}

function buildOptions(storeId: string, i: number, rng: Rng) {
  return [
    {
      id: `${storeId}_opt${i}_size`,
      name: "Taille",
      required: true,
      multiple: false,
      choices: [
        { id: "s", label: "Normal", price: 0 },
        { id: "m", label: "Grande faim (+500)", price: 500 },
        { id: "l", label: "Familial (+1500)", price: 1500 },
      ],
    },
    {
      id: `${storeId}_opt${i}_sup`,
      name: "Suppléments",
      required: false,
      multiple: true,
      max: 3,
      choices: rng.sample(
        [
          { id: "frites", label: "Frites", price: 500 },
          { id: "oeuf", label: "Œuf", price: 250 },
          { id: "fromage", label: "Fromage", price: 400 },
          { id: "piment", label: "Piment fort", price: 0 },
          { id: "avocat", label: "Avocat", price: 600 },
        ],
        rng.int(2, 4),
      ),
    },
  ];
}

export function generateMenu(store: { id: string; category: StoreCategory; slug: string }): MenuSection[] {
  const products = generateProducts(store, store.category === "RESTAURANT" ? 26 : 32);
  const bySub = new Map<string, Product[]>();
  for (const p of products) {
    const arr = bySub.get(p.category) ?? [];
    arr.push(p);
    bySub.set(p.category, arr);
  }
  return [...bySub.entries()].map(([name, ps], idx) => ({ id: `${store.id}_sec${idx}`, name, products: ps }));
}

function buildPromotions(store: { id: string; slug: string; category: StoreCategory }, rng: Rng): StorePromotion[] {
  const types: StorePromotion["type"][] = ["FLASH", "DISCOUNT", "FREE_DELIVERY", "COUPON", "HAPPY_HOUR", "PACK"];
  const n = rng.int(2, 4);
  return rng.sample(types, n).map((type, i) => ({
    id: `${store.id}_promo${i}`,
    title:
      type === "FLASH" ? "Vente flash -30%" :
      type === "FREE_DELIVERY" ? "Livraison offerte dès 5 000 FCFA" :
      type === "HAPPY_HOUR" ? "Happy Hour 17h-19h" :
      type === "PACK" ? "Menu duo à prix réduit" :
      type === "COUPON" ? "Code MALI10 : -10%" : "Réduction -20% aujourd'hui",
    subtitle: type === "FLASH" ? "Quantités limitées" : undefined,
    type,
    value: rng.pick([10, 15, 20, 25, 30]),
    image: storeImage(store.category, `${store.slug}-promo-${i}`, 640, 320),
    endsAt: new Date(NOW + rng.int(2, 72) * 3600_000).toISOString(),
    code: type === "COUPON" ? "MALI10" : undefined,
  }));
}

function buildFaq(cat: StoreCategory): StoreFaq[] {
  return [
    { q: "Quels sont vos délais de livraison ?", a: "En général entre 20 et 45 minutes selon votre quartier à Bamako." },
    { q: "Quels moyens de paiement acceptez-vous ?", a: "Orange Money, Moov Money, Wave, carte bancaire et espèces à la livraison." },
    { q: "Puis-je commander à l'avance ?", a: "Oui, planifiez votre commande jusqu'à 24h à l'avance depuis le panier." },
    { q: cat === "RESTAURANT" ? "Proposez-vous des plats sans piment ?" : "Vos produits sont-ils garantis ?", a: cat === "RESTAURANT" ? "Absolument, précisez-le dans les options du plat." : "Oui, satisfaction garantie ou remboursé sous 48h." },
  ];
}

let storeIndex = 0;
function makeStore(category: StoreCategory, rng: Rng): Store {
  const namePool = NAME_POOL[category];
  const idx = storeIndex++;
  const baseName = namePool[idx % namePool.length];
  const suffix = idx >= namePool.length ? ` ${Math.floor(idx / namePool.length) + 1}` : "";
  const name = `${baseName}${suffix}`;
  const slug = `${slugify(name)}-${idx}`;
  const id = `store_${idx}`;
  const district = rng.pick(BAMAKO_DISTRICTS);
  const rating = rng.float(3.7, 5, 1);
  const badges = rng.sample(ALL_BADGES, rng.int(1, 4));
  const cuisines = category === "RESTAURANT" ? rng.pick(RESTAURANT_CUISINES) : SUBCATS[category].slice(0, 3);

  return {
    id,
    slug,
    name,
    slogan: rng.pick(SLOGANS),
    description: `${name} vous propose le meilleur de ${STORE_CATEGORY_LABEL[category].toLowerCase()} à ${district}, Bamako. Qualité, fraîcheur et service rapide au cœur de la ville.`,
    category,
    subCategories: cuisines,
    logo: avatar(name),
    cover: storeImage(category, `${slug}-cover`, 1200, 500),
    gallery: Array.from({ length: 6 }, (_, i) => storeImage(category, `${slug}-g${i}`, 700, 500)),
    videoUrl: rng.bool(0.2) ? "https://example.com/video" : undefined,
    district,
    city: "Bamako",
    address: `${rng.int(1, 400)} Rue ${rng.int(100, 900)}, ${district}`,
    location: nearBamako(rng),
    phone: phone(rng),
    whatsapp: phone(rng),
    email: `contact@${slugify(baseName)}.ml`,
    website: rng.bool(0.4) ? `www.${slugify(baseName)}.ml` : undefined,
    openingHours: openingHours(rng),
    isOpen: rng.bool(0.82),
    deliveryTimeMin: rng.int(15, 55),
    prepTimeMin: rng.int(8, 30),
    distanceKm: rng.float(0.4, 12, 1),
    deliveryFee: badges.includes("FREE_DELIVERY") ? 0 : rng.pick([500, 750, 1000, 1250, 1500]),
    minOrder: rng.pick([0, 1000, 1500, 2000, 3000]),
    avgPrice: priceFor(category, rng),
    rating,
    reviewCount: rng.int(24, 4200),
    orderCount: rng.int(120, 48000),
    badges,
    promotions: buildPromotions({ id, slug, category }, rng),
    menu: [],
    faq: buildFaq(category),
    featuredProductIds: [],
  };
}

/** Génère toutes les boutiques (métadonnées eager, menus paresseux). */
export function generateStores(counts: Record<StoreCategory, number>): Store[] {
  storeIndex = 0;
  const out: Store[] = [];
  (Object.keys(counts) as StoreCategory[]).forEach((cat, ci) => {
    for (let i = 0; i < counts[cat]; i++) {
      out.push(makeStore(cat, seededRng(hashString(cat), i + ci * 1000)));
    }
  });
  return out;
}

export function generateReviews(store: Store, count: number): Review[] {
  const rng = seededRng(hashString(store.id), 555);
  return Array.from({ length: count }, (_, i) => {
    const p = fullName(rng);
    const rating = rng.bool(0.75) ? rng.int(4, 5) : rng.int(2, 4);
    const daysAgo = rng.int(0, 240);
    return {
      id: `${store.id}_rev${i}`,
      storeId: store.id,
      authorName: p.name,
      authorAvatar: avatar(p.name),
      rating,
      comment: rng.pick(REVIEW_COMMENTS),
      createdAt: new Date(NOW - daysAgo * 86400_000 - rng.int(0, 86400) * 1000).toISOString(),
      likes: rng.int(0, 120),
      images: rng.bool(0.2) ? [storeImage(store.category, `${store.slug}-rev${i}`, 400, 300)] : undefined,
      reply: rng.bool(0.3)
        ? { text: "Merci pour votre retour, à très bientôt sur NOVIGO !", createdAt: new Date(NOW - daysAgo * 86400_000 + 3600_000).toISOString() }
        : undefined,
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function generateDrivers(count: number): Driver[] {
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(4242, i);
    const p = fullName(rng);
    return {
      id: `driver_${i}`,
      name: p.name,
      avatar: avatar(p.name),
      phone: phone(rng),
      rating: rng.float(4.1, 5, 1),
      vehicle: rng.pick(VEHICLES),
      plate: `${rng.pick(["BA", "MA", "KT"])} ${rng.int(1000, 9999)} ${rng.pick(["ML", "MB"])}`,
      location: nearBamako(rng),
      deliveries: rng.int(40, 5200),
    };
  });
}

export function generateOrdersForUser(user: { id: string }, stores: Store[], count: number): Order[] {
  const drivers = generateDrivers(20);
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(hashString(user.id), i + 1);
    const store = rng.pick(stores);
    const menu = generateMenu(store);
    const allProducts = menu.flatMap((s) => s.products);
    const lineCount = rng.int(1, 4);
    const items = rng.sample(allProducts, lineCount).map((p) => ({
      productId: p.id,
      name: p.name,
      image: p.image,
      quantity: rng.int(1, 3),
      price: p.price,
    }));
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const deliveryFee = store.deliveryFee;
    const discount = rng.bool(0.3) ? Math.round((subtotal * rng.pick([10, 15, 20])) / 100 / 50) * 50 : 0;
    const isActive = i === 0;
    const status: OrderStatus = isActive
      ? "DELIVERING"
      : rng.bool(0.86)
      ? "DELIVERED"
      : rng.pick(["CANCELLED", "REFUNDED"] as OrderStatus[]);
    const daysAgo = isActive ? 0 : rng.int(1, 180);
    const createdAt = new Date(NOW - daysAgo * 86400_000 - (isActive ? 0 : rng.int(0, 80000) * 1000)).toISOString();
    const flowIdx = ORDER_FLOW.indexOf(status === "DELIVERING" ? "DELIVERING" : "DELIVERED");
    const timeline = ORDER_FLOW.slice(0, flowIdx + 1).map((st, ti) => ({
      status: st,
      at: new Date(new Date(createdAt).getTime() + ti * rng.int(4, 12) * 60000).toISOString(),
    }));
    return {
      id: `order_${user.id}_${i}`,
      ref: `MP-${String(100000 + i * 7 + hashString(user.id) % 1000).slice(0, 6)}`,
      storeId: store.id,
      storeName: store.name,
      storeLogo: store.logo,
      status,
      items,
      subtotal,
      deliveryFee,
      discount,
      total: subtotal + deliveryFee - discount,
      paymentMethod: rng.pick(["ORANGE_MONEY", "WAVE", "CASH", "MOOV_MONEY", "CARD"] as const),
      address: {
        id: "addr_home",
        label: "Maison",
        line: `${rng.int(1, 400)} Rue ${rng.int(100, 900)}`,
        district: rng.pick(BAMAKO_DISTRICTS),
        city: "Bamako",
        location: nearBamako(rng),
      },
      createdAt,
      etaMinutes: isActive ? rng.int(6, 22) : 0,
      driver: status === "DELIVERING" || status === "DELIVERED" ? rng.pick(drivers) : undefined,
      rating: status === "DELIVERED" && rng.bool(0.6) ? rng.int(4, 5) : undefined,
      timeline,
    };
  });
}

export function generateCoupons(count: number): Coupon[] {
  const titles = [
    { code: "MALI10", title: "-10% sur votre commande", type: "PERCENT" as const, value: 10 },
    { code: "BIENVENUE", title: "-2 000 FCFA offerts", type: "AMOUNT" as const, value: 2000 },
    { code: "LIVRAISON0", title: "Livraison gratuite", type: "FREE_DELIVERY" as const, value: 0 },
    { code: "WEEKEND20", title: "-20% le week-end", type: "PERCENT" as const, value: 20 },
    { code: "FASO15", title: "-15% produits locaux", type: "PERCENT" as const, value: 15 },
    { code: "PHARMA5", title: "-5% en pharmacie", type: "PERCENT" as const, value: 5 },
  ];
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(9001, i);
    const t = titles[i % titles.length];
    return {
      id: `coupon_${i}`,
      code: i < titles.length ? t.code : `${t.code}${i}`,
      title: t.title,
      description: "Valable sur une sélection de commerces partenaires NOVIGO à Bamako.",
      type: t.type,
      value: t.value,
      minOrder: rng.pick([0, 2000, 3000, 5000]),
      expiresAt: new Date(NOW + rng.int(2, 40) * 86400_000).toISOString(),
      used: rng.bool(0.2),
    };
  });
}

export function generatePromotions(stores: Store[], count: number): Promotion[] {
  // Vraies bannières publicitaires (style Uber Eats / Glovo), charte Rouge + graphite (Noir/Gris).
  // Chaque offre est explicite : remise chiffrée, livraison offerte, ou mécanique 2=1.
  const OFFERS: { title: string; sub: (name: string) => string; cta: string; accent: string }[] = [
    { title: "-25%", sub: (n) => `${n} · sur toute la carte aujourd'hui`, cta: "J'en profite", accent: "from-brand to-brand-dark" },
    { title: "Livraison offerte", sub: (n) => `${n} · frais de livraison à 0 FCFA`, cta: "Commander", accent: "from-neutral-800 to-neutral-950" },
    { title: "2 achetés = 1 offert", sub: (n) => `${n} · sur une sélection de plats`, cta: "En profiter", accent: "from-brand to-brand-dark" },
    { title: "Vente Flash -40%", sub: (n) => `${n} · jusqu'à 22h seulement`, cta: "Foncer", accent: "from-zinc-800 to-neutral-950" },
    { title: "-30%", sub: (n) => `${n} · nouveau partenaire NOVIGO`, cta: "Découvrir", accent: "from-brand to-brand-dark" },
    { title: "Week-end gourmand", sub: (n) => `${n} · -20% + dessert offert`, cta: "J'y vais", accent: "from-neutral-800 to-neutral-950" },
  ];
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(31337, i);
    const store = rng.pick(stores);
    const offer = OFFERS[i % OFFERS.length];
    return {
      id: `promotion_${i}`,
      title: offer.title,
      subtitle: offer.sub(store.name),
      image: storeImage(store.category, `promo-banner-${i}`, 900, 500),
      storeId: store.id,
      cta: offer.cta,
      accent: offer.accent,
    };
  });
}

export function generateNotifications(count: number): Notification[] {
  const templates: { type: Notification["type"]; title: string; body: string; icon: string }[] = [
    { type: "ORDER", title: "Votre commande est en route 🛵", body: "Le livreur arrive dans 8 minutes.", icon: "Truck" },
    { type: "ORDER", title: "Commande livrée ✅", body: "Notez votre expérience pour gagner des points.", icon: "PackageCheck" },
    { type: "PROMO", title: "-30% chez Chez Fatou 🔥", body: "Vente flash jusqu'à 22h, ne la manquez pas.", icon: "Tag" },
    { type: "WALLET", title: "Portefeuille rechargé", body: "5 000 FCFA ajoutés à votre solde NOVIGO.", icon: "Wallet" },
    { type: "SYSTEM", title: "Bienvenue sur NOVIGO 🎉", body: "Profitez de -10% avec le code MALI10.", icon: "Sparkles" },
    { type: "PROMO", title: "Nouveaux restaurants près de vous", body: "12 nouvelles adresses à Hamdallaye ACI.", icon: "MapPin" },
  ];
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(5150, i);
    const t = templates[i % templates.length];
    return {
      id: `notif_${i}`,
      type: t.type,
      title: t.title,
      body: t.body,
      icon: t.icon,
      read: i > 3 && rng.bool(0.6),
      createdAt: new Date(NOW - rng.int(0, 30) * 86400_000 - rng.int(0, 86400) * 1000).toISOString(),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function generateUser(stores: Store[]): UserProfile {
  const rng = seededRng(1, 1);
  const first = "Seydou";
  const last = "Tounkara";
  const name = `${first} ${last}`;
  return {
    id: "user_me",
    firstName: first,
    lastName: last,
    phone: "+223 76 12 34 56",
    email: "seydou.tounkara@novigo.ml",
    avatar: avatar(name),
    walletBalance: 24500,
    loyaltyPoints: 1280,
    memberSince: new Date(NOW - 420 * 86400_000).toISOString(),
    addresses: [
      { id: "addr_home", label: "Maison", line: "Cité UNICEF, Rue 224", district: "Hamdallaye ACI 2000", city: "Bamako", location: nearBamako(rng), isDefault: true, note: "Portail bleu, sonner deux fois" },
      { id: "addr_work", label: "Bureau", line: "Immeuble Sonavie, 3e étage", district: "Hippodrome", city: "Bamako", location: nearBamako(rng) },
      { id: "addr_mom", label: "Chez maman", line: "Rue 118, porte 45", district: "Badalabougou", city: "Bamako", location: nearBamako(rng) },
    ],
    paymentMethods: [
      { id: "pm_om", type: "ORANGE_MONEY", label: "Orange Money", detail: "•• 34 56", isDefault: true },
      { id: "pm_wave", type: "WAVE", label: "Wave", detail: "•• 78 90" },
      { id: "pm_card", type: "CARD", label: "Visa", detail: "•••• 4218" },
      { id: "pm_wallet", type: "WALLET", label: "Portefeuille NOVIGO", detail: "24 500 FCFA" },
    ],
    favoriteStoreIds: rng.sample(stores, 8).map((s) => s.id),
  };
}
