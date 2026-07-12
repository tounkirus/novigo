import type { StoreCategory } from "@/types";
import { hashString } from "./rng";

/**
 * Médiathèque NOVIGO — visuels HD cohérents avec chaque catégorie/produit.
 * Source principale : photos **Unsplash** curées et vérifiées (HTTP 200), en HD, servies
 * par `images.unsplash.com` (hôte autorisé dans next.config, ré-encodage WebP/AVIF par next/image).
 * Repli : loremflickr (photos réelles par mot-clé) pour les produits spécifiques non curés
 * (épicerie/pharmacie/tech), puis picsum via <MediaImage> si une source échoue.
 * Déterministe via le hash du `seed`. Signatures inchangées → aucun impact sur les consommateurs.
 */

/** Photos Unsplash curées (identifiants vérifiés 200). Plusieurs = variété déterministe. */
const PHOTO: Record<string, string[]> = {
  // Plats
  pizza: ["1513104890138-7c749659a591"],
  burger: ["1568901346375-23c9450c58cd", "1571091718767-18b5b1457add"],
  chicken: ["1598103442097-8b74394b95c6"],
  shawarma: ["1561651823-34feb02250e4", "1529006557810-274b9b2fc783"],
  tacos: ["1565299624946-b28f40a0ae38"],
  sandwich: ["1553909489-cd47e0907980"],
  fish: ["1544943910-4c1dc44aab44"],
  rice: ["1512058564366-18510be2db19"],
  meat: ["1607623814075-e51df1bdc82f"],
  salad: ["1512621776951-a57141f2eefd"],
  fries: ["1573080496219-bb080dd4f877"],
  icecream: ["1497034825429-c343d7c6a68f"],
  juice: ["1600271886742-f049cd451bba"],
  coffee: ["1511920170033-f8396924c348", "1447933601403-0c6688de566e"],
  pastry: ["1509440159596-0249088772ff"],
  bread: ["1608198093002-ad4e005484ec"],
  cake: ["1578985545062-69928b1d9587"],
  vegetables: ["1488459716781-31db52582fe9"],
  // Couvertures de commerces
  restaurant: ["1517248135467-4c7edcad34c4"],
  supermarket: ["1542838132-92c53300491e"],
  pharmacy: ["1587854692152-cbe660dbde88"],
  bakery: ["1517433670267-08bbd4be890f"],
  butcher: ["1602470520998-f4a52199a3d6"],
  market: ["1524594152303-9fd13543fe6e"],
  boutique: ["1441984904996-e0b6ba687e04"],
  // Services & mobilité
  taxi: ["1549194388-f61be84a6e9e", "1502877338535-766e1452684a"],
  moto: ["1558981403-c5f9899a28bc"],
  delivery: ["1526367790999-0150786686a2"],
  barber: ["1503951914875-452162b0f3f1"],
  plumber: ["1607472586893-edb57bdc0e39"],
  electrician: ["1621905251189-08b45d6a269e"],
  carpenter: ["1504148455328-c376907d081c"],
  mason: ["1503387762-592deb58ef4e"],
  handyman: ["1581578731548-c64695cc6952"],
};

/** Correspondance mot-clé → concept curé (première sous-chaîne trouvée l'emporte). */
const CONCEPT_MATCH: [string, string][] = [
  ["pizza", "pizza"], ["burger", "burger"], ["shawarma", "shawarma"], ["kebab", "shawarma"],
  ["tacos", "tacos"], ["sandwich", "sandwich"], ["fries", "fries"], ["salad", "salad"],
  ["icecream", "icecream"], ["cake", "cake"], ["donut", "cake"], ["dessert", "cake"], ["chocolate", "cake"],
  ["coffee", "coffee"], ["tea", "coffee"], ["juice", "juice"], ["hibiscus", "juice"], ["soda", "juice"],
  ["cola", "juice"], ["drink", "juice"], ["yogurt", "icecream"],
  ["croissant", "pastry"], ["brioche", "pastry"], ["eclair", "pastry"], ["tart", "pastry"],
  ["pastry", "pastry"], ["baguette", "bread"], ["bread", "bread"],
  ["chicken", "chicken"], ["fish", "fish"], ["seafood", "fish"], ["shrimp", "fish"],
  ["skewer", "meat"], ["barbecue", "meat"], ["beef", "meat"], ["lamb", "meat"], ["sausage", "meat"],
  ["grilled,meat", "meat"], ["minced", "meat"], ["meat", "meat"], ["rice", "rice"], ["couscous", "rice"],
  ["vegetable", "vegetables"], ["fruit", "vegetables"],
  // Services / mobilité
  ["taxi", "taxi"], ["moto", "moto"], ["motorbike", "moto"], ["scooter", "moto"], ["delivery", "delivery"],
  ["plumb", "plumber"], ["electric", "electrician"], ["carpenter", "carpenter"], ["wood", "carpenter"],
  ["mason", "mason"], ["construction", "mason"], ["barber", "barber"], ["hair", "barber"], ["haircut", "barber"],
];

function pick(ids: string[], seed: string): string {
  return ids[hashString(seed) % ids.length];
}

function unsplashUrl(id: string, w: number, h: number): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

/** Concept curé correspondant à une chaîne de mots-clés, sinon null. */
function matchConcept(keywords: string): string | null {
  const k = keywords.toLowerCase();
  if (PHOTO[k]) return k; // le mot-clé est déjà un concept curé (ex. storeImage)
  for (const [needle, concept] of CONCEPT_MATCH) if (k.includes(needle)) return concept;
  return null;
}

function mediaUrl(keywords: string, seed: string, w: number, h: number): string {
  const concept = matchConcept(keywords);
  if (concept && PHOTO[concept]) return unsplashUrl(pick(PHOTO[concept], seed), w, h);
  // Repli : photo réelle par mot-clé (produits spécifiques épicerie/pharmacie/tech).
  const lock = (hashString(seed) % 100000) + 1;
  const kw = encodeURIComponent(keywords);
  return `https://loremflickr.com/${w}/${h}/${kw}?lock=${lock}`;
}

/** Concept curé de couverture/galerie par type de commerce (photos storefront HD). */
const STORE_KEYWORDS: Record<StoreCategory, string> = {
  RESTAURANT: "restaurant",
  SUPERMARKET: "supermarket",
  PHARMACY: "pharmacy",
  BAKERY: "bakery",
  BUTCHER: "butcher",
  MARKET: "market",
  SHOP: "boutique",
};

/** Règles nom → mots-clés (première correspondance de sous-chaîne l'emporte). */
const RULES: [string, string][] = [
  // Cuisine malienne / africaine & plats
  ["pizza", "pizza,food"],
  ["burger", "burger,fastfood"],
  ["shawarma", "shawarma,kebab"], ["chawarma", "shawarma,kebab"], ["tacos", "tacos,food"],
  ["yassa", "chicken,african,food"],
  ["braisé", "grilled,chicken,food"], ["braise", "grilled,chicken,food"],
  ["poulet dg", "chicken,plantain,food"], ["poulet", "grilled,chicken,food"],
  ["mafé", "peanut,stew,food"], ["mafe", "peanut,stew,food"], ["tiguadèguèna", "peanut,stew,food"],
  ["tiéb", "rice,fish,food"], ["tieb", "rice,fish,food"], ["riz au gras", "rice,meat,food"],
  ["riz cantonais", "fried rice,food"], ["riz", "rice,food"],
  ["attiéké", "attieke,fish,food"], ["attieke", "attieke,fish,food"],
  ["capitaine", "grilled,fish,food"], ["poisson", "grilled,fish,food"],
  ["brochette", "skewer,grill,meat"], ["viande", "grilled,meat,food"], ["grillade", "barbecue,grill,meat"],
  ["couscous", "couscous,food"], ["frites", "fries,food"],
  ["sandwich", "sandwich,food"], ["salade avocat", "avocado,salad"], ["salade de fruits", "fruit,salad"], ["salade", "salad,food"],
  ["pâtes", "pasta,food"], ["spaghetti", "pasta,food"],
  ["alloco", "fried,plantain,food"], ["foutou", "african,food"], ["tô", "african,food"], ["fakoye", "african,soup"],
  ["ndolé", "african,stew"], ["soupou", "african,soup"], ["kandja", "okra,soup"], ["omelette", "omelette,food"],
  ["café", "coffee,cup"], ["thé", "tea,cup"],
  ["bissap", "hibiscus,drink"], ["gingembre", "ginger,juice"], ["bouye", "juice,drink"], ["djino", "soda,drink"],
  ["jus", "fruit,juice,drink"], ["coca", "cola,bottle"], ["fanta", "soda,bottle"], ["sprite", "soda,bottle"],
  ["dégué", "yogurt,dessert"], ["thiakry", "yogurt,dessert"], ["glace", "icecream,dessert"],
  ["beignet", "donut,pastry"], ["gâteau", "cake,dessert"], ["chocolat", "chocolate,cake"], ["dessert", "dessert,sweet"],
  // Boulangerie (avant l'épicerie pour éviter les collisions type « croissant au beurre »)
  ["baguette", "baguette,bread"], ["croissant", "croissant,bakery"], ["brioche", "brioche,bakery"],
  ["tarte", "tart,pastry"], ["éclair", "eclair,pastry"], ["millefeuille", "pastry,cake"],
  ["viennoiserie", "pastry,bakery"], ["cookie", "cookies"], ["muffin", "muffin"], ["chausson", "pastry"],
  ["pain au chocolat", "pastry,bakery"], ["pain", "bread,bakery"],
  // Supermarché
  ["huile", "cooking oil,bottle"], ["sucre", "sugar,pack"], ["lait", "milk,can"], ["tomate", "tomato,can"],
  ["farine", "flour,bag"], ["sel", "salt"], ["savon", "soap"], ["détergent", "detergent,cleaning"],
  ["eau minérale", "water,bottle"], ["sardine", "canned,fish"], ["haricot", "beans"], ["mil", "millet,grain"],
  ["sorgho", "sorghum,grain"], ["oignon", "onions,vegetable"], ["pomme de terre", "potatoes"],
  ["yaourt", "yogurt"], ["beurre", "butter"], ["œuf", "eggs"], ["oeuf", "eggs"], ["biscuit", "biscuits,cookies"],
  // Pharmacie
  ["paracétamol", "pills,medicine"], ["ibuprofène", "pills,medicine"], ["antipaludéen", "pills,medicine"],
  ["sérum", "first aid,medical"], ["pansement", "bandage,medical"], ["alcool", "medical,bottle"],
  ["vitamine", "vitamins,supplement"], ["sirop", "syrup,medicine"], ["thermomètre", "thermometer,medical"],
  ["masque", "face mask,medical"], ["gel", "hand sanitizer"], ["fer", "supplement,pills"],
  ["crème", "cream,cosmetic"], ["collyre", "eye drops,medical"], ["tensiomètre", "blood pressure,medical"],
  ["cake", "cake,bakery"],
  // Boucherie
  ["filet", "beef,meat"], ["bœuf", "beef,meat"], ["boeuf", "beef,meat"], ["agneau", "lamb,meat"],
  ["mouton", "lamb,meat"], ["gigot", "lamb,roast"], ["hachée", "minced,meat"], ["merguez", "sausage,meat"],
  ["foie", "liver,meat"], ["crevette", "shrimp,seafood"],
  // Marché
  ["mangue", "mango,fruit"], ["banane", "banana,plantain"], ["gombo", "okra,vegetable"], ["piment", "chili,pepper"],
  ["aubergine", "eggplant,vegetable"], ["arachide", "peanuts"], ["karité", "shea,cosmetic"], ["miel", "honey,jar"],
  ["tamarin", "tamarind,fruit"], ["manioc", "cassava,vegetable"], ["papaye", "papaya,fruit"], ["néré", "spice,africa"],
  // Boutique / tech / mode
  ["t-shirt", "tshirt,fashion"], ["boubou", "african,fashion"], ["sandale", "sandals,fashion"],
  ["chaussure", "shoes,fashion"], ["sac", "handbag,fashion"], ["montre", "watch,accessory"],
  ["écouteur", "earbuds,headphones"], ["chargeur", "charger,tech"], ["câble", "usb cable,tech"],
  ["coque", "phone case,tech"], ["parfum", "perfume,bottle"], ["bracelet", "bracelet,jewelry"],
  ["casquette", "cap,hat"], ["lunette", "sunglasses,fashion"], ["powerbank", "power bank,tech"],
  ["enceinte", "bluetooth speaker,tech"], ["téléphone", "smartphone,tech"], ["ordinateur", "laptop,tech"],
];

const CATEGORY_DEFAULT: Record<StoreCategory, string> = {
  RESTAURANT: "african,food,meal",
  SUPERMARKET: "grocery,product",
  PHARMACY: "pharmacy,medicine",
  BAKERY: "bakery,pastry",
  BUTCHER: "meat,butcher",
  MARKET: "vegetables,fruit,market",
  SHOP: "product,fashion",
};

/** Mots-clés d'un produit d'après son nom + sa catégorie de commerce. */
export function productKeywords(category: StoreCategory, name: string): string {
  const n = name.toLowerCase();
  for (const [needle, kw] of RULES) if (n.includes(needle)) return kw;
  return CATEGORY_DEFAULT[category];
}

/** Image produit réaliste (déterministe). */
export function productImage(category: StoreCategory, name: string, seed: string, w = 600, h = 400): string {
  return mediaUrl(productKeywords(category, name), seed, w, h);
}

/** Couverture / galerie d'un commerce. */
export function storeImage(category: StoreCategory, seed: string, w: number, h: number): string {
  return mediaUrl(STORE_KEYWORDS[category], seed, w, h);
}

/** Image thématique libre (bannières, collections). */
export function themedImage(keywords: string, seed: string, w: number, h: number): string {
  return mediaUrl(keywords, seed, w, h);
}

/**
 * Repli déterministe et fiable (picsum) calculé à partir d'une URL média.
 * Utilisé par <MediaImage> si la source principale (Unsplash/loremflickr) échoue.
 */
export function fallbackImage(src: string): string {
  // Dimensions depuis loremflickr (/w/h/) ou Unsplash (?w=&h=).
  const lf = /loremflickr\.com\/(\d+)\/(\d+)\//.exec(src);
  const uw = /[?&]w=(\d+)/.exec(src);
  const uh = /[?&]h=(\d+)/.exec(src);
  const w = lf ? lf[1] : uw ? uw[1] : "800";
  const h = lf ? lf[2] : uh ? uh[1] : "600";
  const seed = (hashString(src) % 1000) + 1;
  return `https://picsum.photos/seed/mp${seed}/${w}/${h}`;
}
