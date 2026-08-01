import 'api_client.dart';
import 'env.dart';
import 'session.dart';

// ============================================================================
// VERTICALES « RÉSERVER » — hôtels et immobilier.
//
// Ces deux domaines n'ont **pas encore d'API** côté NOVIGO. Le contrat est donc
// posé ici sous forme d'interface, avec deux implémentations :
//
//   • `Mock…Repository`  — jeu de démonstration, explicitement étiqueté à
//     l'écran ; c'est ce qui tourne aujourd'hui.
//   • `Api…Repository`   — appelle le Gateway. Le jour où l'endpoint existe, il
//     n'y a qu'une ligne à changer (`hotelsRepository = …`).
//
// Les deux ne se mélangent jamais : un écran sait toujours d'où vient ce qu'il
// affiche, via `Vertical…Result.isDemo`.
// ============================================================================

/// Résultat d'une requête de verticale : les données + leur provenance.
class VerticalResult<T> {
  final List<T> items;

  /// Vrai lorsque les données proviennent du jeu de démonstration.
  final bool isDemo;

  const VerticalResult(this.items, {required this.isDemo});
}

// ─────────────────────────────── Hôtels ───────────────────────────────

class Hotel {
  final String id;
  final String name;
  final String district;
  final double rating;
  final int reviews;
  final int pricePerNight; // FCFA
  final String image;
  final List<String> amenities;
  final bool freeCancellation;

  const Hotel({
    required this.id,
    required this.name,
    required this.district,
    required this.rating,
    required this.reviews,
    required this.pricePerNight,
    required this.image,
    this.amenities = const [],
    this.freeCancellation = false,
  });

  factory Hotel.fromJson(Map j) => Hotel(
        id: (j['id'] ?? '').toString(),
        name: (j['name'] ?? 'Hôtel').toString(),
        district: (j['district'] ?? j['area'] ?? 'Bamako').toString(),
        rating: ((j['rating'] as num?) ?? 4.5).toDouble(),
        reviews: ((j['reviews'] as num?) ?? 0).toInt(),
        pricePerNight: ((j['pricePerNight'] as num?) ?? 0).round(),
        image: (j['image'] ?? '').toString(),
        amenities: [for (final a in (j['amenities'] as List?) ?? const []) a.toString()],
        freeCancellation: j['freeCancellation'] == true,
      );
}

abstract class HotelsRepository {
  Future<VerticalResult<Hotel>> search({String? destination});
  Future<List<String>> popularDestinations();
}

class MockHotelsRepository implements HotelsRepository {
  const MockHotelsRepository();

  static const _hotels = <Hotel>[
    Hotel(
      id: 'h1',
      name: 'Azalaï Hôtel Salam',
      district: 'ACI 2000',
      rating: 4.7,
      reviews: 412,
      pricePerNight: 85000,
      image: 'assets/img/store_1.jpg',
      amenities: ['Piscine', 'Wifi', 'Petit-déjeuner'],
      freeCancellation: true,
    ),
    Hotel(
      id: 'h2',
      name: 'Radisson Blu Bamako',
      district: 'Cité du Niger',
      rating: 4.8,
      reviews: 587,
      pricePerNight: 120000,
      image: 'assets/img/store_2.jpg',
      amenities: ['Piscine', 'Salle de sport', 'Restaurant'],
      freeCancellation: true,
    ),
    Hotel(
      id: 'h3',
      name: 'Hôtel Onomo',
      district: 'Badalabougou',
      rating: 4.4,
      reviews: 233,
      pricePerNight: 62000,
      image: 'assets/img/store_3.jpg',
      amenities: ['Wifi', 'Navette aéroport'],
    ),
    Hotel(
      id: 'h4',
      name: 'Résidence Kanu',
      district: 'Hamdallaye ACI',
      rating: 4.2,
      reviews: 96,
      pricePerNight: 38000,
      image: 'assets/img/store_4.jpg',
      amenities: ['Cuisine équipée', 'Wifi'],
      freeCancellation: true,
    ),
    Hotel(
      id: 'h5',
      name: 'Hôtel Nord-Sud',
      district: 'Niaréla',
      rating: 4.0,
      reviews: 148,
      pricePerNight: 29000,
      image: 'assets/img/store_5.jpg',
      amenities: ['Wifi', 'Parking'],
    ),
  ];

  @override
  Future<VerticalResult<Hotel>> search({String? destination}) async {
    final q = (destination ?? '').trim().toLowerCase();
    final items = q.isEmpty
        ? _hotels
        : [
            for (final h in _hotels)
              if (h.name.toLowerCase().contains(q) || h.district.toLowerCase().contains(q)) h,
          ];
    return VerticalResult(items, isDemo: true);
  }

  @override
  Future<List<String>> popularDestinations() async =>
      const ['Bamako', 'Sikasso', 'Ségou', 'Mopti', 'Kayes'];
}

class ApiHotelsRepository implements HotelsRepository {
  const ApiHotelsRepository();

  @override
  Future<VerticalResult<Hotel>> search({String? destination}) async {
    await session.ensureAuth();
    final data = await api.get('/hotels', query: {
      if (destination != null && destination.trim().isNotEmpty) 'destination': destination.trim(),
    });
    final list = data is List ? data : const [];
    return VerticalResult(
      list.whereType<Map>().map(Hotel.fromJson).toList(),
      isDemo: false,
    );
  }

  @override
  Future<List<String>> popularDestinations() async {
    await session.ensureAuth();
    final data = await api.get('/hotels/destinations');
    final list = data is List ? data : const [];
    return list.map((e) => e.toString()).toList();
  }
}

// ───────────────────────────── Immobilier ─────────────────────────────

enum ListingKind { rent, sale }

class Property {
  final String id;
  final String title;
  final String district;
  final ListingKind kind;
  final int price; // FCFA (par mois en location, total en vente)
  final int rooms;
  final int surface; // m²
  final String image;
  final bool furnished;

  const Property({
    required this.id,
    required this.title,
    required this.district,
    required this.kind,
    required this.price,
    required this.rooms,
    required this.surface,
    required this.image,
    this.furnished = false,
  });

  factory Property.fromJson(Map j) => Property(
        id: (j['id'] ?? '').toString(),
        title: (j['title'] ?? 'Bien').toString(),
        district: (j['district'] ?? 'Bamako').toString(),
        kind: (j['kind'] ?? 'RENT').toString().toUpperCase() == 'SALE'
            ? ListingKind.sale
            : ListingKind.rent,
        price: ((j['price'] as num?) ?? 0).round(),
        rooms: ((j['rooms'] as num?) ?? 0).toInt(),
        surface: ((j['surface'] as num?) ?? 0).toInt(),
        image: (j['image'] ?? '').toString(),
        furnished: j['furnished'] == true,
      );
}

abstract class RealEstateRepository {
  Future<VerticalResult<Property>> search({required ListingKind kind, String? area});
  Future<List<String>> popularDistricts();
}

class MockRealEstateRepository implements RealEstateRepository {
  const MockRealEstateRepository();

  static const _properties = <Property>[
    Property(
      id: 'p1',
      title: 'Villa 4 chambres avec cour',
      district: 'Badalabougou',
      kind: ListingKind.rent,
      price: 450000,
      rooms: 4,
      surface: 220,
      image: 'assets/img/store_2.jpg',
    ),
    Property(
      id: 'p2',
      title: 'Appartement meublé standing',
      district: 'ACI 2000',
      kind: ListingKind.rent,
      price: 300000,
      rooms: 3,
      surface: 110,
      image: 'assets/img/store_6.jpg',
      furnished: true,
    ),
    Property(
      id: 'p3',
      title: 'Studio proche université',
      district: 'Kalaban Coura',
      kind: ListingKind.rent,
      price: 85000,
      rooms: 1,
      surface: 32,
      image: 'assets/img/store_4.jpg',
      furnished: true,
    ),
    Property(
      id: 'p4',
      title: 'Terrain viabilisé 300 m²',
      district: 'Yirimadio',
      kind: ListingKind.sale,
      price: 12000000,
      rooms: 0,
      surface: 300,
      image: 'assets/img/store_5.jpg',
    ),
    Property(
      id: 'p5',
      title: 'Villa duplex 5 chambres',
      district: 'Sébénikoro',
      kind: ListingKind.sale,
      price: 68000000,
      rooms: 5,
      surface: 340,
      image: 'assets/img/store_1.jpg',
    ),
    Property(
      id: 'p6',
      title: 'Immeuble de rapport R+2',
      district: 'Magnambougou',
      kind: ListingKind.sale,
      price: 145000000,
      rooms: 9,
      surface: 520,
      image: 'assets/img/store_3.jpg',
    ),
  ];

  @override
  Future<VerticalResult<Property>> search({required ListingKind kind, String? area}) async {
    final q = (area ?? '').trim().toLowerCase();
    final items = [
      for (final p in _properties)
        if (p.kind == kind &&
            (q.isEmpty ||
                p.district.toLowerCase().contains(q) ||
                p.title.toLowerCase().contains(q)))
          p,
    ];
    return VerticalResult(items, isDemo: true);
  }

  @override
  Future<List<String>> popularDistricts() async =>
      const ['ACI 2000', 'Badalabougou', 'Hamdallaye', 'Sébénikoro', 'Yirimadio'];
}

class ApiRealEstateRepository implements RealEstateRepository {
  const ApiRealEstateRepository();

  @override
  Future<VerticalResult<Property>> search({required ListingKind kind, String? area}) async {
    await session.ensureAuth();
    final data = await api.get('/properties', query: {
      'kind': kind == ListingKind.sale ? 'SALE' : 'RENT',
      if (area != null && area.trim().isNotEmpty) 'area': area.trim(),
    });
    final list = data is List ? data : const [];
    return VerticalResult(
      list.whereType<Map>().map(Property.fromJson).toList(),
      isDemo: false,
    );
  }

  @override
  Future<List<String>> popularDistricts() async {
    await session.ensureAuth();
    final data = await api.get('/properties/districts');
    final list = data is List ? data : const [];
    return list.map((e) => e.toString()).toList();
  }
}

// ──────────────────────────── Sélection ────────────────────────────

/// Implémentations actives.
///
/// Tant que le backend n'expose pas ces domaines, le jeu de démonstration reste
/// la source, **y compris en mode live** : l'écran l'affiche noir sur blanc. Pour
/// basculer, il suffira de remplacer la valeur par l'implémentation API.
const bool _verticalsBackendReady = false;

const HotelsRepository hotelsRepository = NovigoEnv.live && _verticalsBackendReady
    ? ApiHotelsRepository()
    : MockHotelsRepository();

const RealEstateRepository realEstateRepository = NovigoEnv.live && _verticalsBackendReady
    ? ApiRealEstateRepository()
    : MockRealEstateRepository();
