/**
 * Volumétrie du jeu de démonstration NOVIGO (Phase 3).
 * Chiffres cibles du cahier des charges — affichés dans la console Super Admin.
 * Les listes sont générées de façon déterministe et paginée : on n'instancie jamais
 * 50 000 objets en mémoire, mais les agrégats/KPIs reflètent l'échelle réelle.
 */

export interface VolumeRow {
  group: string;
  icon: string;
  items: { label: string; value: number }[];
}

export const DEMO_VOLUMES = {
  wallet: {
    transactions: 50_000,
    clientWallets: 5_000,
    driverWallets: 500,
    merchantWallets: 1_000,
    adminWallets: 100,
  },
  cash: {
    payments: 20_000,
    remittances: 10_000,
    reconciliations: 5_000,
    discrepancies: 500,
  },
  services: {
    providers: 2_000,
    interventions: 10_000,
    reviews: 25_000,
  },
} as const;

/** Total de comptes wallet (tous rôles) — cohérent avec AdminFinanceOverview. */
export const TOTAL_WALLETS =
  DEMO_VOLUMES.wallet.clientWallets +
  DEMO_VOLUMES.wallet.driverWallets +
  DEMO_VOLUMES.wallet.merchantWallets +
  DEMO_VOLUMES.wallet.adminWallets;

/** Vue « volumétrie » prête à afficher (Super Admin). */
export function datasetVolumes(): VolumeRow[] {
  return [
    {
      group: "Portefeuilles & transactions",
      icon: "Wallet",
      items: [
        { label: "Transactions", value: DEMO_VOLUMES.wallet.transactions },
        { label: "Wallets clients", value: DEMO_VOLUMES.wallet.clientWallets },
        { label: "Wallets livreurs", value: DEMO_VOLUMES.wallet.driverWallets },
        { label: "Wallets commerçants", value: DEMO_VOLUMES.wallet.merchantWallets },
        { label: "Wallets admin", value: DEMO_VOLUMES.wallet.adminWallets },
      ],
    },
    {
      group: "Gestion de caisse (cash)",
      icon: "Banknote",
      items: [
        { label: "Paiements espèces", value: DEMO_VOLUMES.cash.payments },
        { label: "Remises", value: DEMO_VOLUMES.cash.remittances },
        { label: "Rapprochements", value: DEMO_VOLUMES.cash.reconciliations },
        { label: "Écarts détectés", value: DEMO_VOLUMES.cash.discrepancies },
      ],
    },
    {
      group: "Services à domicile",
      icon: "Wrench",
      items: [
        { label: "Prestataires", value: DEMO_VOLUMES.services.providers },
        { label: "Interventions", value: DEMO_VOLUMES.services.interventions },
        { label: "Avis clients", value: DEMO_VOLUMES.services.reviews },
      ],
    },
  ];
}
