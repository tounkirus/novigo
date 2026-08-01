import 'package:flutter/material.dart';

import '../ui/tokens.dart';
import 'api_client.dart';
import 'env.dart';
import 'session.dart';

// ============================================================================
// SERVICES À DOMICILE — couche données.
//
// Seed MOCK réaliste Bamako (rendu instantané, démo offline), puis remplacement
// par les prestataires LIVE du Gateway (`/artisans`) via `hsServices` si
// NOVIGO_LIVE=true (repli mock si le backend ne répond pas).
//
// Ce fichier ne contient aucune interface : il vivait auparavant en tête d'un
// écran de 1 286 lignes, ce qui obligeait à traverser les modèles, le jeu de
// données et le client HTTP pour corriger un bouton.
// ============================================================================

// ----------------------------------------------------------------------------
// MODÈLE
// ----------------------------------------------------------------------------

/// Un service précis proposé par un prestataire, avec son prix « dès ».
class HsService {
  final String name;
  final int price; // FCFA
  const HsService(this.name, this.price);
}

/// Un métier (catégorie) : plombier, électricien, coiffeur…
class HsCategory {
  final String id;
  final String label;
  final IconData icon;
  final Color accent;
  final int count; // nombre de prestataires disponibles
  const HsCategory(this.id, this.label, this.icon, this.accent, this.count);
}

/// Un prestataire (artisan / pro à domicile).
class HsProvider {
  final String id;
  final String name;
  final String trade; // métier lisible
  final IconData icon;
  final Color accent;
  final double rating;
  final int reviews;
  final int jobs;
  final int priceFrom; // FCFA, dès
  final String district; // quartier
  final double distanceKm;
  final bool verified; // KYC
  final int years;
  final String bio;
  final List<HsService> services;
  final List<String> photos; // portfolio (assets)
  final String catId; // métier de rattachement (clé de regroupement)

  const HsProvider({
    required this.id,
    required this.name,
    required this.trade,
    required this.icon,
    required this.accent,
    required this.rating,
    required this.reviews,
    required this.jobs,
    required this.priceFrom,
    required this.district,
    required this.distanceKm,
    required this.verified,
    required this.years,
    required this.bio,
    required this.services,
    required this.photos,
    this.catId = '',
  });

  /// Vrai lorsque la fiche provient du backend (identifiant UUID) et non du jeu
  /// de démonstration — ce qui conditionne l'affichage des contenus réels.
  bool get isLive => id.contains('-');

  /// Même prestataire, avec ses prestations détaillées (chargées à l'ouverture
  /// de la fiche : la liste ne transporte que le prix d'appel).
  HsProvider withServices(List<HsService> full) => HsProvider(
        id: id,
        name: name,
        trade: trade,
        icon: icon,
        accent: accent,
        rating: rating,
        reviews: reviews,
        jobs: jobs,
        priceFrom: full.isEmpty ? priceFrom : full.map((e) => e.price).reduce((a, b) => a < b ? a : b),
        district: district,
        distanceKm: distanceKm,
        verified: verified,
        years: years,
        bio: bio,
        services: full.isEmpty ? services : full,
        photos: photos,
        catId: catId,
      );
}

// ----------------------------------------------------------------------------
// DONNÉES MOCK
// ----------------------------------------------------------------------------

const _brown = Color(0xFF8D6E63);
const _pink = Color(0xFFEC407A);
const _teal = Color(0xFF26A69A);
const _sky = Color(0xFF29B6F6);
const _blue = Color(0xFF42A5F5);

class _Trade {
  final String id, label;
  final IconData icon;
  final Color accent;
  final List<HsService> services;
  final bool female;
  final bool doctor;
  final int count;
  const _Trade(this.id, this.label, this.icon, this.accent, this.services,
      {this.female = false, this.doctor = false, this.count = 3});
}

const _trades = <_Trade>[
  _Trade('plombier', 'Plombier', Icons.plumbing, NC.info, [
    HsService('Réparation de fuite', 8000),
    HsService('Débouchage canalisation', 12000),
    HsService('Installation robinet / WC', 15000),
    HsService('Pose chauffe-eau', 25000),
  ], count: 4),
  _Trade('electricien', 'Électricien', Icons.electrical_services, NC.gold, [
    HsService('Dépannage panne', 10000),
    HsService('Installation prise / interrupteur', 6000),
    HsService('Tableau électrique', 35000),
    HsService('Éclairage LED', 12000),
  ], count: 4),
  _Trade('macon', 'Maçon', Icons.foundation, NC.warning, [
    HsService('Réparation fissure', 15000),
    HsService('Crépissage de mur', 40000),
    HsService('Coulage dalle béton', 60000),
  ]),
  _Trade('menuisier', 'Menuisier', Icons.carpenter, _brown, [
    HsService('Réparation fenêtre / porte', 12000),
    HsService('Pose de porte', 30000),
    HsService('Meuble sur mesure', 80000),
  ]),
  _Trade('peintre', 'Peintre', Icons.format_paint, NC.violet, [
    HsService('Peinture chambre', 35000),
    HsService('Enduit décoratif', 45000),
    HsService('Peinture appartement', 150000),
  ]),
  _Trade('clim', 'Climatisation', Icons.ac_unit, _sky, [
    HsService('Entretien complet', 15000),
    HsService('Recharge de gaz', 20000),
    HsService('Installation split', 40000),
  ]),
  _Trade('nettoyage', 'Nettoyage', Icons.cleaning_services, NC.success, [
    HsService('Nettoyage vitres', 10000),
    HsService('Ménage complet', 15000),
    HsService('Nettoyage bureaux', 25000),
    HsService('Grand nettoyage', 30000),
  ], count: 4),
  _Trade('mecano', 'Mécanicien', Icons.car_repair, _teal, [
    HsService('Diagnostic', 5000),
    HsService('Vidange', 15000),
    HsService('Dépannage à domicile', 20000),
    HsService('Plaquettes de frein', 25000),
  ]),
  _Trade('info', 'Informaticien', Icons.desktop_windows, NC.info, [
    HsService('Dépannage PC', 10000),
    HsService('Installation Windows', 15000),
    HsService('Configuration Wifi / réseau', 20000),
    HsService('Récupération de données', 30000),
  ]),
  _Trade('coiffeur', 'Coiffeur', Icons.content_cut, NC.brandLight, [
    HsService('Coupe homme', 3000),
    HsService('Coupe + barbe', 5000),
    HsService('Coloration', 15000),
    HsService('Coiffure mariage', 40000),
  ]),
  _Trade('barbier', 'Barbier', Icons.cut, NC.gold, [
    HsService('Coupe classique', 2500),
    HsService('Dégradé', 4000),
    HsService('Rasage traditionnel', 3000),
    HsService('Barbe soignée', 2500),
  ]),
  _Trade('esthe', 'Esthéticienne', Icons.spa, _pink, [
    HsService('Manucure', 8000),
    HsService('Pédicure', 10000),
    HsService('Soin du visage', 15000),
    HsService('Maquillage', 20000),
  ], female: true),
  _Trade('medecin', 'Médecin', Icons.medical_services, _blue, [
    HsService('Consultation à domicile', 20000),
    HsService('Certificat médical', 10000),
    HsService('Suivi tension', 15000),
  ], doctor: true, count: 2),
  _Trade('infirmier', 'Infirmier', Icons.vaccines, NC.success, [
    HsService('Injection', 5000),
    HsService('Pansement', 6000),
    HsService('Prise de sang', 8000),
    HsService('Perfusion', 15000),
  ]),
];

const _male = [
  'Amadou', 'Moussa', 'Ibrahim', 'Oumar', 'Boubacar', 'Sékou', 'Modibo', 'Adama',
  'Bakary', 'Fousseyni', 'Drissa', 'Mahamadou', 'Aliou', 'Cheick', 'Yaya',
  'Souleymane', 'Mamadou', 'Karim', 'Seydou', 'Abdoulaye',
];
const _fem = [
  'Aminata', 'Fatoumata', 'Kadiatou', 'Mariam', 'Awa', 'Rokia', 'Djénéba',
  'Hawa', 'Assitan', 'Oumou', 'Salimata', 'Nana',
];
const _sur = [
  'Traoré', 'Keïta', 'Diarra', 'Coulibaly', 'Diallo', 'Cissé', 'Konaté', 'Touré',
  'Sidibé', 'Maïga', 'Doumbia', 'Sangaré', 'Camara', 'Dembélé', 'Fofana', 'Kanté',
];
const _districts = [
  'Hamdallaye ACI', 'Badalabougou', 'Faladié', 'Kalaban Coura', 'Magnambougou',
  'Djélibougou', 'Sébénikoro', 'Sotuba', 'Niamakoro', 'Lafiabougou', 'Missira',
  'Quinzambougou', 'Banankabougou', 'Yirimadio',
];

int _minPrice(List<HsService> s) {
  var m = s.first.price;
  for (final e in s) {
    if (e.price < m) m = e.price;
  }
  return m;
}

Map<String, List<HsProvider>> _buildProviders() {
  final map = <String, List<HsProvider>>{};
  for (var ti = 0; ti < _trades.length; ti++) {
    final t = _trades[ti];
    final list = <HsProvider>[];
    for (var i = 0; i < t.count; i++) {
      final pool = t.female ? _fem : _male;
      final first = pool[(ti * 3 + i * 5) % pool.length];
      final sur = _sur[(ti * 5 + i * 2) % _sur.length];
      var name = '$first $sur';
      if (t.doctor) name = 'Dr $name';
      final rating = double.parse((4.5 + ((ti * 2 + i) % 5) * 0.1).toStringAsFixed(1));
      final reviews = 28 + ((ti * 13 + i * 37) % 240);
      final jobs = 45 + ((ti * 23 + i * 51) % 380);
      final years = 2 + ((ti + i * 2) % 13);
      final dist = 1.0 + ((ti + i * 3) % 9) + [0.2, 0.5, 0.8, 0.4][i % 4];
      final verified = (ti + i) % 4 != 0;
      list.add(HsProvider(
        id: '${t.id}_$i',
        name: name,
        trade: t.label,
        icon: t.icon,
        accent: t.accent,
        rating: rating,
        reviews: reviews,
        jobs: jobs,
        priceFrom: _minPrice(t.services),
        district: _districts[(ti * 2 + i * 4) % _districts.length],
        distanceKm: double.parse(dist.toStringAsFixed(1)),
        verified: verified,
        years: years,
        bio: '${t.label} indépendant à Bamako. $years ans d\'expérience, '
            'intervention rapide 7j/7, devis gratuit et travail garanti.',
        services: t.services,
        photos: [
          'assets/img/store_${(ti + i) % 6 + 1}.jpg',
          'assets/img/store_${(ti + i * 2 + 2) % 6 + 1}.jpg',
          'assets/img/store_${(ti + i * 3 + 4) % 6 + 1}.jpg',
        ],
        catId: t.id,
      ));
    }
    map[t.id] = list;
  }
  return map;
}

// ----------------------------------------------------------------------------
// SOURCE LIVE (/artisans) + REPLI MOCK — hsServices
// ----------------------------------------------------------------------------

int _svcMoney(dynamic m) {
  if (m is Map) return ((m['amount'] as num?) ?? 0).round();
  if (m is num) return m.round();
  return 0;
}

/// Style visuel (icône + couleur + id métier) déduit du libellé de profession
/// renvoyé par le backend (ex. « Électricien », « Coiffure à domicile »…).
class _TradeStyle {
  final String id, label;
  final IconData icon;
  final Color accent;
  const _TradeStyle(this.id, this.label, this.icon, this.accent);
}

String _normTrade(String s) {
  const from = 'àâäéèêëîïôöùûüç';
  const to = 'aaaeeeeiioouuuc';
  var r = s.toLowerCase();
  for (var i = 0; i < from.length; i++) {
    r = r.replaceAll(from[i], to[i]);
  }
  return r;
}

const _tradeStems = <String, String>{
  'plomb': 'plombier', 'electric': 'electricien', 'macon': 'macon',
  'menuis': 'menuisier', 'peint': 'peintre', 'clim': 'clim', 'froid': 'clim',
  'nettoy': 'nettoyage', 'menage': 'nettoyage', 'mecan': 'mecano',
  'coiff': 'coiffeur', 'barb': 'barbier', 'esthe': 'esthe',
  'medec': 'medecin', 'infirm': 'infirmier', 'informat': 'info',
};

_TradeStyle _styleForProfession(String profession) {
  final n = _normTrade(profession);
  for (final e in _tradeStems.entries) {
    if (n.contains(e.key)) {
      final t = _trades.firstWhere((x) => x.id == e.value, orElse: () => _trades.first);
      return _TradeStyle(t.id, t.label, t.icon, t.accent);
    }
  }
  final id = n.replaceAll(RegExp(r'[^a-z0-9]+'), '_');
  return _TradeStyle(id.isEmpty ? 'autre' : id, profession, Icons.handyman_rounded, NC.brand);
}

/// Catalogue des services à domicile exposé aux écrans avec les mêmes points
/// d'accès que le mock. Seed synchrone depuis le mock, puis remplacement live.
class ServicesModel extends ChangeNotifier {
  bool liveLoaded = false;

  /// Vrai pendant le premier chargement live — permet aux écrans d'afficher un
  /// squelette plutôt que de laisser croire que le mock est le catalogue réel.
  bool loading = false;

  late Map<String, List<HsProvider>> _byCat;
  late List<HsCategory> _cats;
  late List<HsProvider> _popular;

  ServicesModel() {
    _byCat = _buildProviders();
    _cats = [
      for (final t in _trades)
        HsCategory(t.id, t.label, t.icon, t.accent, (_byCat[t.id] ?? const []).length),
    ];
    _popular = [
      for (final id in ['electricien', 'nettoyage', 'clim', 'plombier'])
        if ((_byCat[id] ?? const []).isNotEmpty) _byCat[id]!.first,
    ];
  }

  List<HsProvider> providersFor(String id) => _byCat[id] ?? const [];
  List<HsCategory> get categories => _cats;
  List<HsProvider> get popular => _popular;

  /// Tous les prestataires, à plat (recherche).
  List<HsProvider> get allProviders => [for (final e in _byCat.entries) ...e.value];

  /// Recherche sur le nom, le métier et le quartier, insensible à la casse et
  /// aux accents.
  List<HsProvider> search(String query) {
    final q = _normTrade(query.trim());
    if (q.isEmpty) return const [];
    return [
      for (final p in allProviders)
        if (_normTrade(p.name).contains(q) ||
            _normTrade(p.trade).contains(q) ||
            _normTrade(p.district).contains(q))
          p,
    ];
  }

  /// Envoie une demande de devis/réservation au prestataire (fire-and-forget,
  /// même esprit que l'optimistic update : l'écran de confirmation s'affiche
  /// quoi qu'il arrive). Ne poste que pour un prestataire LIVE (id = UUID ; les
  /// prestataires mock ont un id du type « electricien_0 » et sont ignorés).
  Future<void> requestQuotation({
    required String artisanId,
    required String description,
    required int budget,
  }) async {
    if (!NovigoEnv.live || !artisanId.contains('-')) return;
    try {
      await session.ensureAuth();
      await api.post('/artisans/$artisanId/quotations',
          body: {'description': description, 'budget': budget});
    } catch (e) {
      debugPrint('[Services] demande de devis live échouée: $e');
    }
  }

  /// Appelé au démarrage. Ne fait rien en mode mock (démo).
  Future<void> init() async {
    if (!NovigoEnv.live) return;
    await load();
  }

  /// Prestations détaillées d'un prestataire, mémorisées après le premier appel.
  final Map<String, List<HsService>> _servicesCache = {};

  Future<List<HsService>> servicesOf(String artisanId) async {
    final cached = _servicesCache[artisanId];
    if (cached != null) return cached;
    try {
      await session.ensureAuth();
      final d = await api.get('/artisans/$artisanId');
      final list = <HsService>[
        for (final s in (d is Map ? d['services'] as List? : null) ?? const [])
          if (s is Map) HsService((s['title'] ?? 'Prestation').toString(), _svcMoney(s['price'])),
      ];
      _servicesCache[artisanId] = list;
      return list;
    } catch (e) {
      debugPrint('[Services] prestations $artisanId: $e');
      return const [];
    }
  }

  /// Nombre de prestataires ramenés par page (le backend en héberge ~2 000,
  /// répartis sur 50 métiers).
  static const int _pageSize = 60;

  /// Nombre de pages parcourues au démarrage pour couvrir tous les métiers.
  static const int _pages = 6;

  Future<void> load() async {
    loading = true;
    notifyListeners();
    try {
      await session.ensureAuth();
      // Pages parallèles : le résumé porte déjà `startingPrice`, donc plus
      // aucun appel de détail par prestataire (c'était 50 requêtes en série).
      final pages = await Future.wait([
        for (var p = 1; p <= _pages; p++)
          api
              .get('/artisans', query: {'page': p, 'limit': _pageSize})
              .then(_asList)
              .catchError((_) => const <Map>[]),
      ]);
      final rows = [for (final page in pages) ...page];
      if (rows.isEmpty) return;
      final providers = <HsProvider>[];
      final styles = <String, _TradeStyle>{};
      for (final r in rows) {
        final profession = (r['profession'] ?? 'Service').toString();
        final st = _styleForProfession(profession);
        styles.putIfAbsent(st.id, () => st);
        // Les prestations détaillées sont chargées à l'ouverture de la fiche.
        final from = _svcMoney(r['startingPrice']);
        final svcs = <HsService>[
          if (from > 0) HsService('À partir de', from),
        ];
        final h = r['id'].toString().hashCode.abs();
        final ratingRaw = (r['rating'] as num?)?.toDouble() ?? 0;
        providers.add(HsProvider(
          id: r['id'].toString(),
          name: (r['name'] ?? 'Prestataire NOVIGO').toString(),
          trade: profession,
          icon: st.icon,
          accent: st.accent,
          rating: ratingRaw <= 0 ? 4.6 : double.parse(ratingRaw.toStringAsFixed(1)),
          reviews: 24 + (h % 200),
          jobs: 40 + (h % 320),
          priceFrom: svcs.isEmpty ? 0 : svcs.map((e) => e.price).reduce((a, b) => a < b ? a : b),
          district: (r['serviceArea'] ?? 'Bamako').toString(),
          distanceKm: double.parse((1.0 + (h % 750) / 100).toStringAsFixed(1)),
          verified: (r['isAvailable'] ?? true) == true,
          years: 2 + (h % 12),
          bio: (r['bio'] ??
                  'Prestataire à domicile à Bamako. Intervention rapide, devis gratuit et travail garanti.')
              .toString(),
          services: svcs.isEmpty ? const [HsService('Prestation', 0)] : svcs,
          photos: [
            'assets/img/store_${h % 6 + 1}.jpg',
            'assets/img/store_${(h + 2) % 6 + 1}.jpg',
            'assets/img/store_${(h + 4) % 6 + 1}.jpg',
          ],
          catId: st.id,
        ));
      }
      if (providers.isEmpty) return;
      final map = <String, List<HsProvider>>{};
      for (final p in providers) {
        map.putIfAbsent(p.catId, () => []).add(p);
      }
      _byCat = map;
      _cats = [
        for (final e in map.entries)
          HsCategory(e.key, styles[e.key]?.label ?? e.value.first.trade, e.value.first.icon,
              e.value.first.accent, e.value.length),
      ];
      _popular = ([...providers]..sort((a, b) => b.rating.compareTo(a.rating))).take(4).toList();
      liveLoaded = true;
    } catch (e) {
      debugPrint('[Services] live indisponible: $e'); // repli silencieux : le seed mock reste
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  List<Map> _asList(dynamic resp) {
    if (resp is List) return resp.whereType<Map>().toList();
    if (resp is Map) {
      if (resp['data'] is List) return (resp['data'] as List).whereType<Map>().toList();
      if (resp['items'] is List) return (resp['items'] as List).whereType<Map>().toList();
    }
    return const [];
  }
}

/// Singleton (même pattern que `catalog`).
final hsServices = ServicesModel();
