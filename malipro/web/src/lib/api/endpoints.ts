"use client";

import { request } from "./client";
import type {
  AuditLog, AuthTokens, CommissionSettings, Driver, Envelope, KpiSummary, ListParams,
  Order, OrderTracking, Paginated, Payment, ReconciliationReport, User,
  SupportTicket, SupportMessage, Coupon, AdminMerchant, AdminArtisan,
  AdminMerchantDetail, AdminPendingProduct, MerchantStatus,
} from "./types";

// --- Auth --------------------------------------------------------------------
export function login(phone: string, password: string) {
  return request<Envelope<AuthTokens>>("/auth/login", {
    method: "POST",
    body: { phone, password },
    auth: false,
  });
}

export function getProfile() {
  return request<Envelope<User>>("/users/me");
}

export function logout() {
  return request<void>("/auth/logout", { method: "POST" });
}

// --- Analytics ---------------------------------------------------------------
export function getKpis(params: Pick<ListParams, "dateFrom" | "dateTo"> = {}) {
  return request<Envelope<KpiSummary>>("/analytics/kpis", { query: params });
}

// --- Admin -------------------------------------------------------------------
export function listOrders(params: ListParams = {}) {
  return request<Paginated<Order>>("/admin/orders", { query: params });
}
export function getOrder(orderId: string) {
  return request<Envelope<Order>>(`/orders/${orderId}`);
}
export function trackOrder(orderId: string) {
  return request<Envelope<OrderTracking>>(`/orders/${orderId}/tracking`);
}
export function cancelOrder(orderId: string, reason?: string) {
  return request<Envelope<Order>>(`/orders/${orderId}/cancel`, {
    method: "POST",
    body: { reason },
  });
}
export function listPayments(params: ListParams = {}) {
  return request<Paginated<Payment>>("/admin/payments", { query: params });
}
export function listUsers(params: ListParams = {}) {
  return request<Paginated<User>>("/admin/users", { query: params });
}
export function listAuditLogs(params: ListParams = {}) {
  return request<Paginated<AuditLog>>("/admin/audit-logs", { query: params });
}

// --- Livreurs (KYC, admin) ---------------------------------------------------
export function listDrivers(params: ListParams & { kycStatus?: string } = {}) {
  return request<Paginated<Driver>>("/admin/drivers", { query: params });
}
export function getDriver(driverId: string) {
  return request<Envelope<Driver>>(`/admin/drivers/${driverId}`);
}
export function validateDriver(
  driverId: string,
  decision: "APPROVED" | "REJECTED",
  reason?: string
) {
  return request<Envelope<Driver>>(`/drivers/${driverId}/validate`, {
    method: "POST",
    body: { decision, reason },
  });
}

// --- Réconciliation paiements (admin) ----------------------------------------
export function getReconciliation(params: {
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  return request<Envelope<ReconciliationReport>>("/payments/reconciliation", {
    query: params,
  });
}

// --- Commissions (admin) -----------------------------------------------------
export function getCommissions() {
  return request<Envelope<CommissionSettings>>("/admin/commissions");
}
export function updateCommissions(body: CommissionSettings) {
  return request<Envelope<CommissionSettings>>("/admin/commissions", {
    method: "PATCH",
    body,
  });
}

// --- Support (agent / admin) -------------------------------------------------
export function listSupportTickets(params: ListParams & { status?: string } = {}) {
  return request<Paginated<SupportTicket>>("/admin/support/tickets", { query: params });
}
export function getSupportTicket(id: string) {
  return request<Envelope<SupportTicket>>(`/admin/support/tickets/${id}`);
}
export function updateSupportTicket(id: string, body: { status?: string; priority?: string }) {
  return request<Envelope<SupportTicket>>(`/admin/support/tickets/${id}`, { method: "PATCH", body });
}
export function replySupportTicket(id: string, text: string) {
  return request<Envelope<SupportMessage>>(`/admin/support/tickets/${id}/messages`, {
    method: "POST", body: { body: text },
  });
}

// --- Coupons (admin) ---------------------------------------------------------
export function listCoupons() {
  return request<Envelope<Coupon[]>>("/admin/coupons");
}
export function createCoupon(body: Partial<Coupon>) {
  return request<Envelope<Coupon>>("/admin/coupons", { method: "POST", body });
}

// --- Remboursement paiement (admin) -----------------------------------------
export function refundPayment(id: string) {
  return request<Envelope<Payment>>(`/admin/payments/${id}/refund`, { method: "POST" });
}

// --- Diffusion notifications (admin) ----------------------------------------
export function broadcastNotification(body: { title: string; body: string; targetRole?: string }) {
  return request<Envelope<{ sent: number }>>("/admin/notifications/broadcast", { method: "POST", body });
}

// --- Partenaires (admin) -----------------------------------------------------
export function listMerchants(params: ListParams = {}) {
  return request<Paginated<AdminMerchant>>("/admin/merchants", { query: params });
}
export function setMerchantActive(id: string, isActive: boolean) {
  return request<Envelope<{ id: string; isActive: boolean }>>(`/admin/merchants/${id}`, { method: "PATCH", body: { isActive } });
}
export function getMerchant(id: string) {
  return request<Envelope<AdminMerchantDetail>>(`/admin/merchants/${id}`);
}
export function setMerchantStatus(id: string, status: MerchantStatus, reason?: string) {
  return request<Envelope<{ id: string; status: MerchantStatus; isActive: boolean }>>(
    `/admin/merchants/${id}/status`, { method: "PATCH", body: { status, reason } });
}
export function setMerchantAutoPublish(id: string, autoPublish: boolean) {
  return request<Envelope<{ id: string; autoPublish: boolean }>>(
    `/admin/merchants/${id}/auto-publish`, { method: "PATCH", body: { autoPublish } });
}
export function verifyMerchantDocument(docId: string, status: "PENDING" | "VERIFIED" | "REJECTED") {
  return request<Envelope<{ id: string; type: string; status: string }>>(
    `/admin/merchants/documents/${docId}`, { method: "PATCH", body: { status } });
}
export function listPendingProducts(params: ListParams = {}) {
  return request<Paginated<AdminPendingProduct>>("/admin/products/pending", { query: params });
}
export function moderateProduct(id: string, status: "PUBLISHED" | "REJECTED") {
  return request<Envelope<{ id: string; status: string }>>(
    `/admin/products/${id}/moderate`, { method: "PATCH", body: { status } });
}
export function listArtisans(params: ListParams = {}) {
  return request<Paginated<AdminArtisan>>("/admin/artisans", { query: params });
}
export function setArtisanAvailability(id: string, isAvailable: boolean) {
  return request<Envelope<{ id: string; isAvailable: boolean }>>(`/admin/artisans/${id}`, { method: "PATCH", body: { isAvailable } });
}
