import type {
  CashRegister, CashRemittance, CashReconciliation, CashDiscrepancy, CashDashboard,
  RemittanceMethod, RemittanceStatus,
} from "@/types/wallet";
import { NOW } from "@/constants";
import { seededRng } from "./rng";
import { avatar } from "./images";
import { fullName } from "./generators";

const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

export function generateCashRegister(seed = 7): CashRegister {
  const rng = seededRng(seed, 61);
  const collected = rng.int(15000, 120000);
  const remitted = rng.int(0, collected);
  const balance = collected - remitted;
  const limit = 150000;
  return {
    driverId: "driver_me",
    driverName: "Seydou Tounkara",
    driverAvatar: avatar("Seydou Tounkara"),
    balance,
    collectedToday: collected,
    toRemit: balance,
    remittedToday: remitted,
    tips: rng.int(1000, 12000),
    commissions: rng.int(3000, 25000),
    limit,
    status: balance < 0 ? "NEGATIVE" : balance > limit ? "OVER_LIMIT" : "OK",
  };
}

export function generateCashRegisters(count = 40): CashRegister[] {
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(60601, i);
    const p = fullName(rng);
    const collected = rng.int(5000, 180000);
    const remitted = rng.int(0, collected);
    const balance = collected - remitted;
    const limit = 150000;
    return {
      driverId: `driver_${i}`,
      driverName: p.name,
      driverAvatar: avatar(p.name),
      balance,
      collectedToday: collected,
      toRemit: balance,
      remittedToday: remitted,
      tips: rng.int(0, 12000),
      commissions: rng.int(1000, 25000),
      limit,
      status: i % 19 === 0 ? "FROZEN" : balance > limit ? "OVER_LIMIT" : balance < 0 ? "NEGATIVE" : "OK",
    };
  });
}

export function generateRemittances(count = 30): CashRemittance[] {
  const methods: RemittanceMethod[] = ["QR_CODE", "OTP", "MANUAL", "AGENT"];
  const st: RemittanceStatus[] = ["PENDING", "VALIDATED", "REJECTED", "LATE"];
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(70701, i);
    const p = fullName(rng);
    const validator = fullName(seededRng(70702, i));
    const status = i < 4 ? "PENDING" : rng.pick(st);
    return {
      id: `remit_${i}`,
      ref: `RM-${rng.int(100000, 999999)}`,
      driverId: `driver_${rng.int(0, 40)}`,
      driverName: p.name,
      driverAvatar: avatar(p.name),
      amount: rng.int(10000, 200000),
      method: rng.pick(methods),
      status,
      createdAt: iso(i * 5_400_000 + rng.int(0, 3_000_000)),
      validatedAt: status === "VALIDATED" ? iso(i * 5_400_000 - 600_000) : undefined,
      validatedBy: status === "VALIDATED" ? validator.name : undefined,
      receiptId: status === "VALIDATED" ? `REC-${rng.int(10000, 99999)}` : undefined,
      signature: status === "VALIDATED",
    };
  });
}

export function generateReconciliations(count = 20): CashReconciliation[] {
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(80801, i);
    const p = fullName(rng);
    const collected = rng.int(50000, 400000);
    const declared = collected - (rng.bool(0.2) ? rng.int(500, 8000) : 0);
    const remitted = declared - (rng.bool(0.15) ? rng.int(500, 5000) : 0);
    const electronic = rng.int(80000, 600000);
    const gap = collected - declared + (declared - remitted);
    return {
      id: `recon_${i}`,
      date: iso(i * 86_400_000),
      driverName: p.name,
      collected,
      declared,
      remitted,
      electronic,
      gap,
      status: gap === 0 ? "BALANCED" : i < 3 ? "PENDING" : "GAP",
    };
  });
}

export function generateDiscrepancies(count = 14): CashDiscrepancy[] {
  const reasons = [
    "Écart entre espèces collectées et déclarées",
    "Remise inférieure au montant attendu",
    "Montant inhabituel détecté",
    "Remise en retard (> 48h)",
    "Solde de caisse négatif",
    "Double comptabilisation suspectée",
  ];
  const sev = ["LOW", "MEDIUM", "HIGH"] as const;
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(90901, i);
    const p = fullName(rng);
    return {
      id: `disc_${i}`,
      ref: `EC-${rng.int(10000, 99999)}`,
      driverName: p.name,
      amount: rng.int(1000, 45000),
      reason: rng.pick(reasons),
      severity: i < 3 ? "HIGH" : rng.pick(sev),
      status: i < 5 ? "OPEN" : "RESOLVED",
      createdAt: iso(i * 43_200_000),
    };
  });
}

export function generateCashDashboard(): CashDashboard {
  const registers = generateCashRegisters(40);
  const collectedToday = registers.reduce((s, r) => s + r.collectedToday, 0);
  const remittedToday = registers.reduce((s, r) => s + r.remittedToday, 0);
  const inCirculation = registers.reduce((s, r) => s + r.toRemit, 0);
  const gaps = generateReconciliations(20).reduce((s, r) => s + Math.abs(r.gap), 0);
  return {
    collectedToday,
    inCirculation,
    remittedToday,
    pending: collectedToday - remittedToday,
    gapsTotal: gaps,
    cashPayments: registers.length * 14,
    cashRatio: 38,
  };
}
