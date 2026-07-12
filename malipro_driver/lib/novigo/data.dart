import 'models.dart';

/// Demandes de course à proximité (mock offline, autour de Bamako).
const List<DeliveryRequest> kInitialAvailable = [
  DeliveryRequest(
    id: 'C-4821',
    storeName: 'Aux Trois Fleuves',
    storeInitials: 'AF',
    storeAddress: 'Hamdallaye ACI 2000, Rue 390',
    dropAddress: 'Badalabougou Est, Rue 27',
    distanceKm: 3.2,
    payout: 1500,
    itemsCount: 3,
    etaMin: 17,
    customerName: 'Aïcha D.',
  ),
  DeliveryRequest(
    id: 'C-4822',
    storeName: 'Pharmacie du Point G',
    storeInitials: 'PP',
    storeAddress: 'Point G, Avenue de l\'Hôpital',
    dropAddress: 'Hamdallaye, Rue 210',
    distanceKm: 2.1,
    payout: 1100,
    itemsCount: 2,
    etaMin: 12,
    customerName: 'Modibo T.',
  ),
  DeliveryRequest(
    id: 'C-4823',
    storeName: 'Fourou Market',
    storeInitials: 'FM',
    storeAddress: 'ACI 2000, Boulevard du 22 Octobre',
    dropAddress: 'Sébénikoro, Rue 88',
    distanceKm: 5.4,
    payout: 2300,
    itemsCount: 8,
    etaMin: 26,
    customerName: 'Fanta K.',
  ),
  DeliveryRequest(
    id: 'C-4824',
    storeName: 'Le Balafon',
    storeInitials: 'LB',
    storeAddress: 'Niarela, Rue 402',
    dropAddress: 'Quinzambougou, Rue 314',
    distanceKm: 1.6,
    payout: 900,
    itemsCount: 2,
    etaMin: 10,
    customerName: 'Ibrahim S.',
  ),
  DeliveryRequest(
    id: 'C-4825',
    storeName: 'Boulangerie Badala',
    storeInitials: 'BB',
    storeAddress: 'Badalabougou, Rue 33',
    dropAddress: 'ACI 2000, Rue 456',
    distanceKm: 4.0,
    payout: 1800,
    itemsCount: 5,
    etaMin: 21,
    customerName: 'Mariam C.',
  ),
  DeliveryRequest(
    id: 'C-4826',
    storeName: 'Chez Fatou',
    storeInitials: 'CF',
    storeAddress: 'Magnambougou, Rue 500',
    dropAddress: 'Faladié, Rue 800',
    distanceKm: 2.7,
    payout: 1300,
    itemsCount: 4,
    etaMin: 15,
    customerName: 'Oumar B.',
  ),
];

/// Historique des courses livrées.
const List<PastDelivery> kInitialHistory = [
  PastDelivery(id: 'C-4790', storeName: 'Le Balafon', when: 'Aujourd\'hui · 13:20', payout: 1200),
  PastDelivery(id: 'C-4788', storeName: 'Pharmacie du Point G', when: 'Aujourd\'hui · 11:05', payout: 1000),
  PastDelivery(id: 'C-4781', storeName: 'Aux Trois Fleuves', when: 'Hier · 20:40', payout: 1600),
  PastDelivery(id: 'C-4776', storeName: 'Fourou Market', when: 'Hier · 18:12', payout: 2100),
  PastDelivery(id: 'C-4770', storeName: 'Chez Fatou', when: 'Lun · 19:30', payout: 1400),
  PastDelivery(id: 'C-4762', storeName: 'Boulangerie Badala', when: 'Lun · 08:15', payout: 800),
];

/// Journal des gains (crédits course + retraits).
const List<EarningTx> kInitialEarnings = [
  EarningTx(label: 'Course · Le Balafon', when: 'Aujourd\'hui · 13:20', amount: 1200, isPayout: true),
  EarningTx(label: 'Course · Pharmacie du Point G', when: 'Aujourd\'hui · 11:05', amount: 1000, isPayout: true),
  EarningTx(label: 'Retrait Orange Money', when: 'Hier · 21:00', amount: -15000, isPayout: false),
  EarningTx(label: 'Course · Aux Trois Fleuves', when: 'Hier · 20:40', amount: 1600, isPayout: true),
  EarningTx(label: 'Course · Fourou Market', when: 'Hier · 18:12', amount: 2100, isPayout: true),
  EarningTx(label: 'Bonus heures de pointe', when: 'Hier · 14:00', amount: 2500, isPayout: true),
  EarningTx(label: 'Course · Chez Fatou', when: 'Lun · 19:30', amount: 1400, isPayout: true),
];
