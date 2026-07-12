// Types de domaine — miroir du contrat OpenAPI 3.1 de NOVIGO.
// Peut être remplacé par une génération automatique :
//   npx openapi-typescript novigo-openapi.yaml -o src/lib/api/generated.ts

export type Role =
  | "CUSTOMER" | "DRIVER" | "ARTISAN" | "MERCHANT"
  | "ADMIN" | "SUPER_ADMIN" | "SUPPORT_AGENT";

export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "BANNED";

export type OrderType =
  | "FOOD" | "PHARMACY" | "GROCERY" | "PARCEL" | "ARTISAN_SERVICE" | "MARKETPLACE";

export type OrderStatus =
  | "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "ASSIGNED"
  | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export type PaymentMethod = "ORANGE_MONEY" | "WAVE" | "CARD" | "WALLET" | "CASH";

export type PaymentStatus =
  | "INITIATED" | "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";

export type DeliveryStatus =
  | "UNASSIGNED" | "ASSIGNED" | "ACCEPTED" | "EN_ROUTE_PICKUP"
  | "PICKED_UP" | "EN_ROUTE_DROPOFF" | "COMPLETED" | "FAILED";

export interface Money {
  amount: number; // unité mineure FCFA, sans décimale
  currency: "XOF";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface Paginated<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface Envelope<T> {
  success: true;
  data: T;
  message?: string | null;
}

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  roles: Role[];
  status: UserStatus;
  locale?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address {
  id?: string;
  label?: string;
  line1: string;
  line2?: string | null;
  city: string;
  district?: string | null;
  location?: GeoPoint;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Money;
}

export interface Order {
  id: string;
  reference?: string;
  customerId: string;
  storeId?: string | null;
  type: OrderType;
  status: OrderStatus;
  items?: OrderItem[];
  deliveryAddress?: Address;
  subtotal?: Money;
  deliveryFee?: Money;
  total: Money;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverId?: string | null;
  status: DeliveryStatus;
  pickupLocation?: GeoPoint;
  dropoffLocation?: GeoPoint;
  etaMinutes?: number | null;
  distanceMeters?: number | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
}

export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  driverLocation?: GeoPoint;
  etaMinutes?: number | null;
}

export interface Payment {
  id: string;
  orderId?: string | null;
  userId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: Money;
  providerRef?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string | null;
  ip?: string | null;
  createdAt: string;
}

export interface KpiSummary {
  gmv: Money;
  ordersCount: number;
  activeDrivers: number;
  newCustomers: number;
  avgDeliveryMinutes: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user?: User;
}

export interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: string;
  dateFrom?: string;
  dateTo?: string;
  role?: Role;
  [key: string]: string | number | undefined;
}

// ---------- Livreurs / KYC ----------
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface DriverDocument {
  id: string;
  type: "ID_CARD" | "DRIVER_LICENSE" | "VEHICLE_REG" | "INSURANCE";
  url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  uploadedAt?: string;
}

export interface Driver {
  id: string;
  userId: string;
  userName?: string | null;
  userPhone?: string | null;
  vehicleType?: "MOTO" | "CAR" | "BICYCLE" | "VAN";
  plateNumber?: string | null;
  kycStatus: KycStatus;
  isAvailable: boolean;
  rating?: number;
  totalDeliveries?: number;
  documents?: DriverDocument[];
  createdAt: string;
}

// ---------- Réconciliation paiements ----------
export type ReconciliationStatus =
  | "MATCHED" | "MISSING_IN_PROVIDER" | "MISSING_IN_INTERNAL" | "AMOUNT_MISMATCH";

export interface ReconciliationLine {
  internalRef?: string | null;
  providerRef?: string | null;
  provider: "ORANGE_MONEY" | "WAVE" | "CARD";
  internalAmount?: Money;
  providerAmount?: Money;
  status: ReconciliationStatus;
  occurredAt?: string | null;
}

export interface ReconciliationSummary {
  internalTotal: Money;
  providerTotal: Money;
  difference?: Money;
  matched: number;
  discrepancies: number;
}

export interface ReconciliationReport {
  provider: "ORANGE_MONEY" | "WAVE" | "CARD";
  periodFrom?: string | null;
  periodTo?: string | null;
  summary: ReconciliationSummary;
  lines: ReconciliationLine[];
}

// ---------- Commissions ----------
export interface CommissionSettings {
  deliveryPercent: number;
  merchantPercent: number;
  artisanPercent: number;
  updatedAt?: string | null;
}

// --- Support ---------------------------------------------------------------
export type SupportStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
export interface SupportMessage {
  id: string; ticketId: string; senderId: string; body: string; isStaff: boolean; createdAt: string;
}
export interface SupportTicket {
  id: string; userId: string; subject: string; category: string; orderId?: string | null;
  status: SupportStatus; priority: string; messages?: SupportMessage[]; createdAt: string; updatedAt: string;
}

// --- Coupons ---------------------------------------------------------------
export interface Coupon {
  id: string; code: string; type: "PERCENT" | "AMOUNT"; value: number;
  minAmount?: number | null; maxDiscount?: number | null; usageLimit?: number | null;
  usedCount: number; isActive: boolean; expiresAt?: string | null; createdAt: string;
}

// --- Partenaires (vue admin) -----------------------------------------------
export type MerchantStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface AdminMerchant {
  id: string; businessName: string; category?: string | null; isActive: boolean;
  status: MerchantStatus; autoPublish: boolean;
  storeCount: number; owner?: string | null; phone?: string; createdAt: string;
}

export interface MerchantDoc { id: string; type: string; url: string; status: "PENDING" | "VERIFIED" | "REJECTED"; }
export interface AdminMerchantDetail {
  id: string; businessName: string; category?: string | null;
  status: MerchantStatus; isActive: boolean; autoPublish: boolean; rejectReason?: string;
  owner?: string | null; phone?: string;
  documents: MerchantDoc[];
  stores: { id: string; name: string; category?: string | null; isOpen: boolean; productCount: number }[];
}

export interface AdminPendingProduct {
  id: string; name: string; price: Money; imageUrl?: string | null;
  status: string; storeName?: string; merchant?: string | null;
}
export interface AdminArtisan {
  id: string; profession: string; rating: number; isAvailable: boolean;
  serviceCount: number; name?: string | null; phone?: string; createdAt: string;
}
