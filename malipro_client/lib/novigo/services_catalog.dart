import 'package:flutter/material.dart';

import 'data.dart' show categories;
import 'models.dart' show Category;
import 'screens/bills.dart';
import 'screens/category.dart';
import 'screens/home_services.dart';
import 'screens/hotels.dart';
import 'screens/location_screen.dart';
import 'screens/real_estate.dart';
import 'screens/recharge.dart';
import 'screens/ride.dart';
import 'screens/wallet_screen.dart';
import 'ui/tokens.dart';

/// Registre des services NOVIGO — **source unique de vérité**.
///
/// L'accueil, l'écran « Tous les services » et la recherche de services lisent
/// tous cette liste. Ajouter un service à l'application se fait donc en une
/// seule ligne ici, et il apparaît partout, correctement rangé.
///
/// Chaque entrée pointe vers une destination qui **existe réellement** dans le
/// projet. Les services encore à ouvrir (`available: false`) sont affichés dans
/// leur rubrique avec la mention « Bientôt » : la feuille de route reste
/// visible, sans jamais faire passer une maquette pour un parcours fonctionnel.
class NovigoService {
  final String id;
  final String label;
  final IconData icon;
  final Color tone;

  /// Écran ouvert au toucher. `null` quand le service n'est pas encore ouvert.
  final WidgetBuilder? destination;

  /// Ligne d'explication affichée dans « Tous les services ».
  final String? subtitle;

  /// Pastille posée sur la tuile (« Nouveau »…).
  final String? badge;

  const NovigoService({
    required this.id,
    required this.label,
    required this.icon,
    required this.tone,
    this.destination,
    this.subtitle,
    this.badge,
  });

  bool get available => destination != null;
}

/// Une rubrique de l'écran « Tous les services ».
class NovigoServiceGroup {
  final String id;
  final String title;
  final String subtitle;
  final List<NovigoService> services;
  const NovigoServiceGroup({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.services,
  });
}

/// Retrouve une catégorie de commerce par identifiant (`repas`, `pharmacie`…).
Category _cat(String id) => categories.firstWhere((c) => c.id == id);

WidgetBuilder _category(String id) => (_) => CategoryScreen(category: _cat(id));

// ───────────────────────────── Se déplacer ─────────────────────────────

const _move = NovigoServiceGroup(
  id: 'move',
  title: 'Se déplacer',
  subtitle: 'Un chauffeur en quelques minutes',
  services: [
    NovigoService(
      id: 'taxi',
      label: 'Trajet',
      icon: Icons.local_taxi_rounded,
      tone: Tone.ride,
      subtitle: 'Voiture avec chauffeur',
      destination: _rideTaxi,
    ),
    NovigoService(
      id: 'moto',
      label: 'Moto',
      icon: Icons.two_wheeler_rounded,
      tone: Tone.ride,
      subtitle: 'Le plus rapide aux heures de pointe',
      destination: _rideMoto,
    ),
    NovigoService(
      id: 'car_rental',
      label: 'Location',
      icon: Icons.car_rental_rounded,
      tone: Tone.ride,
      subtitle: 'Louer un véhicule à la journée',
      destination: _carRental,
    ),
  ],
);

Widget _rideTaxi(BuildContext _) => const RideScreen(mode: 'taxi');
Widget _rideMoto(BuildContext _) => const RideScreen(mode: 'moto');
Widget _carRental(BuildContext _) => const LocationScreen();

// ────────────────────────── Commander & livrer ──────────────────────────

NovigoServiceGroup get _deliver => NovigoServiceGroup(
      id: 'deliver',
      title: 'Commander & livrer',
      subtitle: 'Tout Bamako livré chez vous',
      services: [
        NovigoService(
          id: 'food',
          label: 'Repas',
          icon: Icons.restaurant_rounded,
          tone: Tone.food,
          subtitle: 'Restaurants et cuisine de quartier',
          destination: _category('repas'),
        ),
        NovigoService(
          id: 'grocery',
          label: 'Courses',
          icon: Icons.local_grocery_store_rounded,
          tone: Tone.grocery,
          subtitle: 'Supermarchés et supérettes',
          destination: _category('supermarche'),
        ),
        NovigoService(
          id: 'parcel',
          label: 'Colis',
          icon: Icons.local_shipping_rounded,
          tone: Tone.parcel,
          subtitle: 'Un coursier récupère et livre',
          destination: _category('colis'),
        ),
        NovigoService(
          id: 'pharmacy',
          label: 'Pharmacie',
          icon: Icons.local_pharmacy_rounded,
          tone: Tone.hotel,
          subtitle: 'Médicaments et parapharmacie',
          destination: _category('pharmacie'),
        ),
        NovigoService(
          id: 'market',
          label: 'Marché',
          icon: Icons.storefront_rounded,
          tone: Tone.grocery,
          subtitle: 'Produits frais des marchés',
          destination: _category('marche'),
        ),
        NovigoService(
          id: 'bakery',
          label: 'Boulangerie',
          icon: Icons.bakery_dining_rounded,
          tone: Tone.shopping,
          subtitle: 'Pains, viennoiseries, pâtisseries',
          destination: _category('boulangerie'),
        ),
      ],
    );

// ─────────────────────────── Services à domicile ───────────────────────────

/// Métiers issus du catalogue de services à domicile réellement chargé
/// (`hsServices`, mock au démarrage puis live). Les quatre premiers apparaissent
/// en raccourci, le reste via « Tous les métiers ».
NovigoServiceGroup get _homeServices {
  final trades = hsServices.categories.take(4).toList();
  return NovigoServiceGroup(
    id: 'services',
    title: 'Services à domicile',
    subtitle: '${hsServices.categories.length} métier'
        '${hsServices.categories.length > 1 ? 's' : ''}, prestataires vérifiés',
    services: [
      for (final t in trades)
        NovigoService(
          id: 'hs_${t.id}',
          label: t.label,
          icon: t.icon,
          tone: t.accent,
          subtitle: '${t.count} prestataires disponibles',
          destination: (_) => HsCategoryScreen(category: t),
        ),
      NovigoService(
        id: 'hs_all',
        label: 'Tous les métiers',
        icon: Icons.handyman_rounded,
        tone: Tone.service,
        subtitle: 'Plombier, électricien, coiffeur, ménage…',
        destination: _allTrades,
      ),
    ],
  );
}

Widget _allTrades(BuildContext _) => const HomeServicesScreen();

// ──────────────────────────────── Acheter ────────────────────────────────

NovigoServiceGroup get _buy => NovigoServiceGroup(
      id: 'buy',
      title: 'Acheter',
      subtitle: 'Les boutiques de la marketplace',
      services: [
        NovigoService(
          id: 'shop',
          label: 'Boutiques',
          icon: Icons.shopping_bag_rounded,
          tone: Tone.shopping,
          subtitle: 'Mode, électronique, maison',
          destination: _category('boutique'),
        ),
      ],
    );

// ───────────────────────────── Payer & régler ─────────────────────────────

const _pay = NovigoServiceGroup(
  id: 'pay',
  title: 'Payer & régler',
  subtitle: 'Votre argent au même endroit',
  services: [
    NovigoService(
      id: 'wallet',
      label: 'NOVIGO Pay',
      icon: Icons.account_balance_wallet_rounded,
      tone: Tone.pay,
      subtitle: 'Solde, envois et paiements',
      destination: _wallet,
    ),
    NovigoService(
      id: 'topup',
      label: 'Recharge',
      icon: Icons.phone_iphone_rounded,
      tone: Tone.pay,
      subtitle: 'Crédit téléphone et internet',
      destination: _topup,
    ),
    NovigoService(
      id: 'bills',
      label: 'Factures',
      icon: Icons.receipt_long_rounded,
      tone: Tone.pay,
      subtitle: 'Eau, électricité, abonnements',
      destination: _bills,
    ),
  ],
);

Widget _wallet(BuildContext _) => const WalletScreen();
Widget _topup(BuildContext _) => const RechargeScreen();
Widget _bills(BuildContext _) => const BillsScreen();

// ──────────────────────────────── Réserver ────────────────────────────────
//
// Verticales annoncées mais pas encore ouvertes côté backend. Elles restent
// visibles pour situer la trajectoire de la super app, sans destination : un
// écran de démonstration ici ferait croire à un parcours utilisable.

const _book = NovigoServiceGroup(
  id: 'book',
  title: 'Réserver',
  subtitle: 'Séjours et logements',
  services: [
    NovigoService(
      id: 'hotel',
      label: 'Hôtels',
      icon: Icons.hotel_rounded,
      tone: Tone.hotel,
      subtitle: 'Chambres et séjours à Bamako',
      badge: 'Nouveau',
      destination: _hotels,
    ),
    NovigoService(
      id: 'realestate',
      label: 'Immobilier',
      icon: Icons.home_work_rounded,
      tone: Tone.realEstate,
      subtitle: 'Acheter ou louer un logement',
      badge: 'Nouveau',
      destination: _realEstate,
    ),
    NovigoService(
      id: 'travel',
      label: 'Voyages',
      icon: Icons.flight_takeoff_rounded,
      tone: Tone.hotel,
      subtitle: 'Billets d\'avion et de bus',
    ),
    NovigoService(
      id: 'tickets',
      label: 'Billetterie',
      icon: Icons.confirmation_number_rounded,
      tone: Tone.parcel,
      subtitle: 'Concerts, matchs, événements',
    ),
  ],
);

Widget _hotels(BuildContext _) => const HotelsScreen();
Widget _realEstate(BuildContext _) => const RealEstateScreen();

/// Toutes les rubriques, dans l'ordre d'affichage de « Tous les services ».
List<NovigoServiceGroup> get novigoServiceGroups =>
    [_move, _deliver, _homeServices, _buy, _pay, _book];

/// Tous les services, à plat (recherche).
List<NovigoService> get allNovigoServices =>
    [for (final g in novigoServiceGroups) ...g.services];

/// Les sept services mis en avant sur l'accueil.
///
/// Sept, et pas davantage : la huitième case de la grille est occupée par
/// « Plus », qui ouvre le catalogue complet. Un accueil qui déroule vingt
/// services oblige à les lire tous pour en choisir un.
const _homeOrder = ['taxi', 'food', 'parcel', 'grocery', 'pharmacy', 'hs_all', 'wallet'];

List<NovigoService> get homeServices {
  final all = {for (final s in allNovigoServices) s.id: s};
  return [
    for (final id in _homeOrder)
      if (all[id] != null) all[id]!,
  ];
}

/// Recherche de service par libellé (utilisée par l'onglet Explorer).
List<NovigoService> searchNovigoServices(String query) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return const [];
  return [
    for (final s in allNovigoServices)
      if (s.label.toLowerCase().contains(q) || (s.subtitle ?? '').toLowerCase().contains(q)) s,
  ];
}
