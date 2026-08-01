import 'package:flutter/foundation.dart';
import '../models.dart';
import '../data.dart' as mock;
import 'env.dart';
import 'api_client.dart';
import 'session.dart';
import 'mappers.dart';

/// Source du catalogue (commerces + produits).
///
/// Le backend porte l'intégralité du catalogue NOVIGO — le même que l'app web,
/// soit ~1 450 commerces et 43 000 produits. On ne charge donc jamais tout :
///  • les listes sont paginées **côté serveur**, par catégorie ;
///  • les produits d'une boutique ne sont chargés qu'à son ouverture ;
///  • la recherche interroge le backend.
///
/// Le seed mock reste affiché tant que le live n'a pas répondu (rendu instantané
/// et démo offline), puis il est remplacé catégorie par catégorie.
class CatalogModel extends ChangeNotifier {
  /// Taille d'une page de commerces.
  static const int pageSize = 20;

  /// Catégorie mobile -> catégorie backend.
  static const Map<String, String> backendCategory = {
    'repas': 'RESTAURANT',
    'supermarche': 'SUPERMARKET',
    'pharmacie': 'PHARMACY',
    'marche': 'MARKET',
    'boulangerie': 'BAKERY',
    'boutique': 'SHOP',
  };

  bool loading = false;
  String? error;

  /// Catégories déjà servies par le live (les autres gardent leur bucket mock).
  final Set<String> _liveCats = {};

  List<Store> _all = List.of(mock.allStores);
  final Map<String, List<Store>> _byCat = {
    for (final c in mock.categories) c.id: mock.storesForCategory(c.id),
  };
  final Map<String, int> _loadedPages = {};
  final Map<String, bool> _hasMore = {};
  final Map<String, bool> _loadingCat = {};

  /// Détails (produits) déjà récupérés, par identifiant de boutique.
  final Map<String, Store> _detailed = {};

  bool get liveLoaded => _liveCats.isNotEmpty;

  List<Store> get allStores => _all;
  List<Store> get foodStores => _byCat['repas'] ?? const [];
  List<Store> storesForCategory(String catId) => _byCat[catId] ?? const [];

  bool isLive(String catId) => _liveCats.contains(catId);
  bool isLoadingCategory(String catId) => _loadingCat[catId] == true;
  bool hasMore(String catId) => _hasMore[catId] ?? false;

  /// Démarrage : première page de chaque catégorie, en parallèle.
  Future<void> init() async {
    if (!NovigoEnv.live) return;
    loading = true;
    notifyListeners();
    try {
      await session.ensureAuth();
      await Future.wait(
        backendCategory.keys.map((c) => loadCategory(c, notify: false)),
      );
      _rebuildAll();
    } catch (e) {
      error = e.toString();
      debugPrint('[Catalog] live indisponible: $error');
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// (Re)charge la première page d'une catégorie.
  Future<void> loadCategory(String catId, {bool notify = true}) async {
    final backend = backendCategory[catId];
    if (!NovigoEnv.live || backend == null) return;
    _loadedPages[catId] = 0;
    await _fetchPage(catId, backend, 1, replace: true, notify: notify);
  }

  /// Page suivante (défilement infini / bouton « Voir plus »).
  Future<void> loadMore(String catId) async {
    final backend = backendCategory[catId];
    if (!NovigoEnv.live || backend == null) return;
    if (_loadingCat[catId] == true || !(_hasMore[catId] ?? false)) return;
    final next = (_loadedPages[catId] ?? 1) + 1;
    await _fetchPage(catId, backend, next, replace: false);
  }

  Future<void> _fetchPage(
    String catId,
    String backend,
    int page, {
    required bool replace,
    bool notify = true,
  }) async {
    _loadingCat[catId] = true;
    if (notify) notifyListeners();
    try {
      await session.ensureAuth();
      final res = await api.getPage('/stores', query: {
        'category': backend,
        'page': page,
        'limit': pageSize,
      });
      final rows = res.items;
      final base = replace ? 0 : (_byCat[catId]?.length ?? 0);
      final stores = <Store>[
        for (var i = 0; i < rows.length; i++) storeFromJson(rows[i], index: base + i),
      ];

      if (replace) {
        // Une catégorie live vide ne doit pas effacer le repli mock.
        if (stores.isEmpty) return;
        _byCat[catId] = stores;
        _liveCats.add(catId);
      } else {
        _byCat[catId] = [...?_byCat[catId], ...stores];
      }
      _loadedPages[catId] = page;
      _hasMore[catId] = page < res.totalPages;
      _rebuildAll();
    } catch (e) {
      debugPrint('[Catalog] $catId page $page: $e'); // garde la liste courante
    } finally {
      _loadingCat[catId] = false;
      if (notify) notifyListeners();
    }
  }

  void _rebuildAll() {
    final seen = <String>{};
    final merged = <Store>[];
    for (final c in mock.categories) {
      for (final s in _byCat[c.id] ?? const <Store>[]) {
        if (seen.add(s.id)) merged.add(s);
      }
    }
    if (merged.isNotEmpty) _all = merged;
  }

  /// Boutique avec ses produits. Le résumé de liste n'en contient pas : on va
  /// chercher le détail à l'ouverture de la fiche, puis on le met en cache.
  Future<Store> withProducts(Store store) async {
    if (store.products.isNotEmpty) return store;
    final cached = _detailed[store.id];
    if (cached != null) return cached;
    if (!NovigoEnv.live) return store;
    try {
      await session.ensureAuth();
      final detail = await api.get('/stores/${store.id}');
      if (detail is! Map) return store;
      final full = storeFromJson(detail, index: 0, fallback: store);
      _detailed[store.id] = full;
      _replaceInBuckets(full);
      notifyListeners();
      return full;
    } catch (e) {
      debugPrint('[Catalog] détail ${store.id}: $e');
      return store;
    }
  }

  void _replaceInBuckets(Store full) {
    for (final entry in _byCat.entries) {
      final i = entry.value.indexWhere((s) => s.id == full.id);
      if (i >= 0) entry.value[i] = full;
    }
    final j = _all.indexWhere((s) => s.id == full.id);
    if (j >= 0) _all[j] = full;
  }

  /// Recherche de commerces côté serveur (repli local en mode mock).
  Future<List<Store>> search(String query) async {
    final q = query.trim();
    if (q.isEmpty) return const [];
    if (!NovigoEnv.live) {
      final lower = q.toLowerCase();
      return _all.where((s) => s.name.toLowerCase().contains(lower)).toList();
    }
    try {
      await session.ensureAuth();
      final res = await api.getPage('/stores', query: {'search': q, 'limit': 30});
      return [
        for (var i = 0; i < res.items.length; i++) storeFromJson(res.items[i], index: i),
      ];
    } catch (e) {
      debugPrint('[Catalog] recherche "$q": $e');
      return const [];
    }
  }
}

final catalog = CatalogModel();
