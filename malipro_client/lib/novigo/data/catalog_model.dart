import 'package:flutter/foundation.dart';
import '../models.dart';
import '../data.dart' as mock;
import 'env.dart';
import 'api_client.dart';
import 'session.dart';
import 'mappers.dart';

/// Source du catalogue (commerces + produits) exposée aux écrans avec les mêmes
/// points d'accès que le mock. Seed synchrone depuis le mock (rendu instantané,
/// démo offline), puis remplacement par les données LIVE du Gateway si activé.
/// Hybride : une catégorie sans commerce live conserve son bucket mock.
class CatalogModel extends ChangeNotifier {
  bool loading = false;
  bool liveLoaded = false;
  String? error;

  List<Store> _all = List.of(mock.allStores);
  final Map<String, List<Store>> _byCat = {
    for (final c in mock.categories) c.id: mock.storesForCategory(c.id),
  };

  List<Store> get allStores => _all;
  List<Store> get foodStores => _byCat['repas'] ?? const [];
  List<Store> storesForCategory(String catId) => _byCat[catId] ?? _all;

  /// Appelé au démarrage. Ne fait rien en mode mock (démo).
  Future<void> init() async {
    if (!NovigoEnv.live) return;
    await load();
  }

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      await session.ensureAuth();
      final list = await api.get('/stores', query: {'limit': 50});
      final summaries = (list as List).whereType<Map>().toList();
      final stores = <Store>[];
      for (var i = 0; i < summaries.length; i++) {
        // Détail = commerce + ses produits (le résumé n'a pas les produits).
        final detail = await api.get('/stores/${summaries[i]['id']}');
        if (detail is Map) stores.add(storeFromJson(detail, index: i));
      }
      if (stores.isNotEmpty) {
        _all = stores;
        for (final c in mock.categories) {
          final live = stores.where((s) => s.kind == c.id).toList();
          _byCat[c.id] = live.isNotEmpty ? live : mock.storesForCategory(c.id);
        }
        liveLoaded = true;
      }
    } catch (e) {
      error = e.toString(); // repli silencieux : le seed mock reste en place
      debugPrint('[Catalog] live indisponible: $error');
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}

final catalog = CatalogModel();
