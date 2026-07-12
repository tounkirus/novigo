/** NOVIGO — Opérations commerçant (cuisine) & sécurité financière (fraude). */
import type { Id, ISODate } from "./index";

export type KitchenStatus = "WAITING" | "PREPARING" | "READY" | "LATE";

export interface KitchenTicket {
  id: Id;
  ref: string;
  customer: string;
  channel: "DELIVERY" | "PICKUP" | "DINE_IN";
  items: { name: string; qty: number; note?: string }[];
  status: KitchenStatus;
  placedAt: ISODate;
  etaMin: number;
  priority: boolean;
}

export type FraudRisk = "LOW" | "MEDIUM" | "HIGH";
export type FraudStatus = "OPEN" | "REVIEWING" | "CLEARED" | "CONFIRMED";

export interface FraudAlert {
  id: Id;
  ref: string;
  type: "VELOCITY" | "CHARGEBACK" | "CASH_GAP" | "MULTI_ACCOUNT" | "UNUSUAL_AMOUNT" | "REFUND_ABUSE";
  subject: string;
  subjectRole: "CLIENT" | "DRIVER" | "MERCHANT";
  amount: number;
  risk: FraudRisk;
  status: FraudStatus;
  reason: string;
  createdAt: ISODate;
}
