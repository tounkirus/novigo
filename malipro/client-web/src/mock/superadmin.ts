/**
 * Super Admin — données mock déterministes (command center & configuration).
 * Vue d'ensemble plateforme, commissions, limites wallet, fournisseurs de paiement,
 * zones de service, équipe d'administration. Aucun Math.random/Date.now.
 */
import type {
  PlatformOverview, CommissionRule, WalletLimit, PaymentProvider, ServiceZone, AdminStaff,
} from "@/types/backoffice";
import { NOW, BAMAKO_DISTRICTS } from "@/constants";
import { seededRng } from "./rng";
import { avatar } from "./images";
import { fullName } from "./generators";

const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

export function generatePlatformOverview(): PlatformOverview {
  return {
    users: 5_284,
    merchants: 1_012,
    drivers: 514,
    providers: 2_040,
    gmv30d: 1_284_000_000,
    ordersToday: 3_742,
    txToday: 8_915,
    uptime: 99.97,
    openIncidents: 1,
    pendingKyc: 63,
  };
}

export function generateCommissionRules(): CommissionRule[] {
  return [
    { id: "cm_food", vertical: "Repas", icon: "UtensilsCrossed", rate: 15, minFee: 250, active: true },
    { id: "cm_grocery", vertical: "Supermarché", icon: "ShoppingCart", rate: 10, minFee: 200, active: true },
    { id: "cm_pharmacy", vertical: "Pharmacie", icon: "Cross", rate: 8, minFee: 150, active: true },
    { id: "cm_market", vertical: "Marché", icon: "Store", rate: 12, minFee: 200, active: true },
    { id: "cm_taxi", vertical: "Taxi & Moto", icon: "Car", rate: 18, minFee: 300, active: true },
    { id: "cm_parcel", vertical: "Colis", icon: "Package", rate: 20, minFee: 300, active: true },
    { id: "cm_services", vertical: "Services à domicile", icon: "Wrench", rate: 14, minFee: 500, active: true },
  ];
}

export function generateWalletLimits(): WalletLimit[] {
  return [
    { id: "wl_client", role: "Client", dailyMax: 1_000_000, monthlyMax: 10_000_000, minPayout: 1_000 },
    { id: "wl_driver", role: "Livreur", dailyMax: 500_000, monthlyMax: 5_000_000, minPayout: 5_000 },
    { id: "wl_merchant", role: "Commerçant", dailyMax: 5_000_000, monthlyMax: 50_000_000, minPayout: 10_000 },
    { id: "wl_provider", role: "Prestataire", dailyMax: 2_000_000, monthlyMax: 20_000_000, minPayout: 5_000 },
  ];
}

export function generatePaymentProviders(): PaymentProvider[] {
  return [
    { id: "pp_om", name: "Orange Money", icon: "Smartphone", color: "text-orange-500", status: "OPERATIONAL", successRate: 98.4, volume30d: 512_000_000, fee: 1.5, enabled: true },
    { id: "pp_moov", name: "Moov Money", icon: "Smartphone", color: "text-sky-500", status: "OPERATIONAL", successRate: 97.1, volume30d: 288_000_000, fee: 1.5, enabled: true },
    { id: "pp_wave", name: "Wave", icon: "Waves", color: "text-blue-500", status: "DEGRADED", successRate: 91.2, volume30d: 342_000_000, fee: 1.0, enabled: true },
    { id: "pp_visa", name: "Visa / Mastercard", icon: "CreditCard", color: "text-ink", status: "OPERATIONAL", successRate: 95.8, volume30d: 96_000_000, fee: 2.4, enabled: true },
    { id: "pp_cash", name: "Espèces (cash)", icon: "Banknote", color: "text-success", status: "OPERATIONAL", successRate: 99.9, volume30d: 214_000_000, fee: 0, enabled: true },
    { id: "pp_bank", name: "Virement bancaire", icon: "Landmark", color: "text-violet-500", status: "OPERATIONAL", successRate: 99.2, volume30d: 78_000_000, fee: 0.8, enabled: false },
  ];
}

const ZONE_STATUS: ServiceZone["status"][] = ["ACTIVE", "ACTIVE", "ACTIVE", "PILOT", "PAUSED"];

export function generateServiceZones(): ServiceZone[] {
  return BAMAKO_DISTRICTS.slice(0, 16).map((name, i) => {
    const rng = seededRng(31337, i);
    const status = i < 10 ? "ACTIVE" : rng.pick(ZONE_STATUS);
    return {
      id: `zone_${i}`,
      name,
      status,
      drivers: status === "PAUSED" ? 0 : rng.int(8, 60),
      merchants: rng.int(15, 120),
      orders30d: status === "PAUSED" ? 0 : rng.int(200, 9_000),
      coverage: status === "ACTIVE" ? rng.int(80, 100) : status === "PILOT" ? rng.int(30, 65) : rng.int(0, 20),
    };
  });
}

const STAFF_ROLES = ["Super Admin", "Admin Finance", "Modérateur", "Support N2", "Ops Manager", "Analyste"];
const STAFF_STATUS: AdminStaff["status"][] = ["ACTIVE", "ACTIVE", "ACTIVE", "INVITED", "SUSPENDED"];

export function generateAdminStaff(count = 12): AdminStaff[] {
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(70707, i);
    const p = fullName(rng);
    const role = i === 0 ? "Super Admin" : rng.pick(STAFF_ROLES);
    const status = i < 8 ? "ACTIVE" : rng.pick(STAFF_STATUS);
    return {
      id: `staff_${i}`,
      name: p.name,
      avatar: avatar(p.name),
      email: `${p.first.toLowerCase()}.${p.last.toLowerCase()}@novigo.ml`.normalize("NFD").replace(/[̀-ͯ]/g, ""),
      role,
      status,
      twoFactor: role === "Super Admin" || role === "Admin Finance" ? true : rng.bool(0.6),
      lastActiveAt: status === "INVITED" ? iso(0) : iso(rng.int(1, 600) * 60_000 * (rng.bool(0.5) ? 1 : 60)),
    };
  });
}
