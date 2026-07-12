/**
 * Factories NOVIGO — builders déterministes avec surcharges partielles.
 * Utiles pour les tests, Storybook, ou générer des variantes ciblées.
 * Ex : makeProduct({ price: 1000, oldPrice: 1500 })
 */
import type { Product, Order, Address, Review, Store } from "@/types";
import type { WalletTx } from "@/types/modules";
import { NOW, BAMAKO_DISTRICTS } from "@/constants";
import { photo, avatar } from "./images";

let seq = 0;
const nextId = (p: string) => `${p}_f${seq++}`;

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const id = overrides.id ?? nextId("prod");
  return {
    id,
    storeId: overrides.storeId ?? "store_0",
    name: "Produit test",
    description: "Description de démonstration.",
    image: photo(id, 600, 400),
    price: 2000,
    category: "Plats",
    stock: 25,
    available: true,
    popularity: 60,
    rating: 4.5,
    reviewCount: 42,
    ...overrides,
  };
}

export function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: overrides.id ?? nextId("addr"),
    label: "Maison",
    line: "Rue 224, porte 12",
    district: BAMAKO_DISTRICTS[0],
    city: "Bamako",
    location: { lat: 12.63, lng: -8.0 },
    ...overrides,
  };
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  const authorName = overrides.authorName ?? "Aminata Traoré";
  return {
    id: overrides.id ?? nextId("rev"),
    storeId: overrides.storeId ?? "store_0",
    authorName,
    authorAvatar: avatar(authorName),
    rating: 5,
    comment: "Excellent, je recommande !",
    createdAt: new Date(NOW - 86_400_000).toISOString(),
    likes: 3,
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  const id = overrides.id ?? nextId("order");
  return {
    id,
    ref: `MP-${id.slice(-6)}`,
    storeId: "store_0",
    storeName: "Chez Fatou",
    storeLogo: avatar("Chez Fatou"),
    status: "DELIVERED",
    items: [{ productId: "p0", name: "Tiéboudienne", image: photo("tieb", 200, 200), quantity: 1, price: 2500 }],
    subtotal: 2500,
    deliveryFee: 1000,
    discount: 0,
    total: 3500,
    paymentMethod: "ORANGE_MONEY",
    address: makeAddress(),
    createdAt: new Date(NOW - 3 * 86_400_000).toISOString(),
    etaMinutes: 0,
    timeline: [],
    ...overrides,
  };
}

export function makeWalletTx(overrides: Partial<WalletTx> = {}): WalletTx {
  return {
    id: overrides.id ?? nextId("wtx"),
    type: "PAYMENT",
    label: "Commande de démonstration",
    amount: -2500,
    balanceAfter: 22000,
    createdAt: new Date(NOW - 3600_000).toISOString(),
    status: "COMPLETED",
    icon: "ShoppingBag",
    ...overrides,
  };
}

/** Construit une liste via un builder + surcharges par index. */
export function makeMany<T>(factory: (o?: Partial<T>) => T, count: number, each?: (i: number) => Partial<T>): T[] {
  return Array.from({ length: count }, (_, i) => factory(each?.(i)));
}

export type { Store };
