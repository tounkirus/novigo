import type { KitchenTicket, KitchenStatus, FraudAlert, FraudRisk, FraudStatus } from "@/types/ops";
import { NOW } from "@/constants";
import { seededRng } from "./rng";
import { fullName } from "./generators";
import { DISH_NAMES, DRINKS } from "./pools";

const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

export function generateKitchenTickets(count = 18): KitchenTicket[] {
  const statuses: KitchenStatus[] = ["WAITING", "PREPARING", "READY", "LATE"];
  const channels = ["DELIVERY", "PICKUP", "DINE_IN"] as const;
  const dishes = [...DISH_NAMES, ...DRINKS];
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(30303, i);
    const p = fullName(rng);
    const status: KitchenStatus =
      i < 5 ? "WAITING" : i < 10 ? "PREPARING" : i < 14 ? "READY" : rng.pick(statuses);
    const lineCount = rng.int(1, 4);
    return {
      id: `ticket_${i}`,
      ref: `#${1000 + i}`,
      customer: p.name,
      channel: rng.pick(channels),
      items: Array.from({ length: lineCount }, () => ({
        name: rng.pick(dishes),
        qty: rng.int(1, 3),
        note: rng.bool(0.25) ? rng.pick(["Sans piment", "Bien cuit", "À emporter", "Extra sauce"]) : undefined,
      })),
      status: i >= 14 ? "LATE" : status,
      placedAt: iso(i * 90_000 + rng.int(0, 60_000)),
      etaMin: rng.int(5, 35),
      priority: rng.bool(0.2),
    };
  });
}

export function generateFraudAlerts(count = 16): FraudAlert[] {
  const types = ["VELOCITY", "CHARGEBACK", "CASH_GAP", "MULTI_ACCOUNT", "UNUSUAL_AMOUNT", "REFUND_ABUSE"] as const;
  const roles = ["CLIENT", "DRIVER", "MERCHANT"] as const;
  const reasons: Record<(typeof types)[number], string> = {
    VELOCITY: "Trop de transactions en peu de temps",
    CHARGEBACK: "Litige de paiement carte bancaire",
    CASH_GAP: "Écart entre espèces collectées et remises",
    MULTI_ACCOUNT: "Plusieurs comptes liés au même appareil",
    UNUSUAL_AMOUNT: "Montant inhabituel par rapport à l'historique",
    REFUND_ABUSE: "Demandes de remboursement répétées",
  };
  const risks: FraudRisk[] = ["LOW", "MEDIUM", "HIGH"];
  const st: FraudStatus[] = ["OPEN", "REVIEWING", "CLEARED", "CONFIRMED"];
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(40404, i);
    const p = fullName(rng);
    const type = rng.pick(types);
    return {
      id: `fraud_${i}`,
      ref: `FR-${rng.int(10000, 99999)}`,
      type,
      subject: p.name,
      subjectRole: rng.pick(roles),
      amount: rng.int(5000, 800000),
      risk: i < 3 ? "HIGH" : rng.pick(risks),
      status: i < 5 ? "OPEN" : rng.pick(st),
      reason: reasons[type],
      createdAt: iso(i * 3_600_000 + rng.int(0, 2_000_000)),
    };
  });
}
