import 'package:flutter/foundation.dart';

import '../models.dart';
import 'api_client.dart';
import 'catalog_model.dart';
import 'env.dart';
import 'session.dart';

/// Nature d'une recommandation — détermine la mise en avant et la destination.
enum FeedKind { store, promo, reorder, service, category }

/// Un élément de la section « Pour vous » de l'accueil.
///
/// Le modèle est volontairement plat et indépendant de la source : le jour où
/// le NOVIGO Brain servira réellement ce flux, seule l'implémentation du
/// dépôt change, pas un seul widget.
class FeedItem {
  final String id;
  final FeedKind kind;
  final String title;
  final String subtitle;

  /// Chemin d'asset local **ou** URL renvoyée par le backend.
  final String image;

  /// Pastille posée sur le visuel (« -20 % », « Nouveau »).
  final String? badge;

  /// Ligne de contexte affichée sous le titre (note, délai, distance).
  final String? meta;

  /// Identifiant de commerce à ouvrir, quand la carte pointe vers une boutique.
  final String? storeId;

  /// Identifiant de service NOVIGO (voir `services_catalog.dart`).
  final String? serviceId;

  const FeedItem({
    required this.id,
    required this.kind,
    required this.title,
    required this.subtitle,
    required this.image,
    this.badge,
    this.meta,
    this.storeId,
    this.serviceId,
  });

  factory FeedItem.fromJson(Map j) => FeedItem(
        id: (j['id'] ?? '').toString(),
        kind: _kindFrom((j['kind'] ?? '').toString()),
        title: (j['title'] ?? '').toString(),
        subtitle: (j['subtitle'] ?? '').toString(),
        image: (j['image'] ?? '').toString(),
        badge: j['badge']?.toString(),
        meta: j['meta']?.toString(),
        storeId: j['storeId']?.toString(),
        serviceId: j['serviceId']?.toString(),
      );

  static FeedKind _kindFrom(String raw) {
    switch (raw.toUpperCase()) {
      case 'PROMO':
        return FeedKind.promo;
      case 'REORDER':
        return FeedKind.reorder;
      case 'SERVICE':
        return FeedKind.service;
      case 'CATEGORY':
        return FeedKind.category;
      default:
        return FeedKind.store;
    }
  }
}

/// Contrat de la source de recommandations.
///
/// Deux implémentations vivent côte à côte, comme pour le catalogue : la démo
/// hors ligne reste utilisable, et le passage au live ne demande aucun autre
/// changement que le drapeau d'environnement.
abstract class FeedRepository {
  Future<List<FeedItem>> forYou({int limit = 8});
}

/// Premier élément ou `null` (`firstOrNull` vient de `package:collection`,
/// que l'application n'embarque pas).
T? _first<T>(Iterable<T> it) {
  final i = it.iterator;
  return i.moveNext() ? i.current : null;
}

/// Recommandations dérivées du catalogue **réellement chargé**.
///
/// Rien n'est inventé : les commerces, notes, délais et frais viennent du
/// catalogue (mock au démarrage, live dès que le backend a répondu). C'est ce
/// qui permet de garder l'accueil crédible sans données de démonstration
/// parallèles qui divergeraient du reste de l'application.
class MockFeedRepository implements FeedRepository {
  const MockFeedRepository();

  @override
  Future<List<FeedItem>> forYou({int limit = 8}) async {
    final stores = catalog.allStores;
    if (stores.isEmpty) return const [];

    final items = <FeedItem>[];

    // 1. Le mieux noté à proximité.
    final byRating = [...stores]..sort((a, b) => b.rating.compareTo(a.rating));
    final top = byRating.first;
    items.add(_fromStore(top, kind: FeedKind.store, subtitle: 'Le mieux noté près de vous'));

    // 2. Une vraie remise du catalogue, s'il en existe une.
    final discounted = stores.firstWhere(
      (s) => s.products.any((p) => p.discount != null),
      orElse: () => stores.first,
    );
    final deal = _first(discounted.products.where((p) => p.discount != null));
    items.add(FeedItem(
      id: 'promo_${discounted.id}',
      kind: FeedKind.promo,
      title: deal?.name ?? discounted.name,
      subtitle: discounted.name,
      image: deal != null && deal.image.isNotEmpty ? deal.image : discounted.image,
      badge: deal?.discount != null ? '-${deal!.discount}%' : 'Offre',
      meta: deal != null ? fcfa(deal.price) : null,
      storeId: discounted.id,
    ));

    // 3. Le plus proche.
    final byDistance = [...stores]..sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
    final near = byDistance.firstWhere((s) => s.id != top.id, orElse: () => byDistance.first);
    items.add(_fromStore(near, kind: FeedKind.store, subtitle: 'À deux pas de chez vous'));

    // 4. Livraison offerte.
    final free =
        _first(stores.where((s) => s.freeDelivery && s.id != top.id && s.id != near.id));
    if (free != null) {
      items.add(_fromStore(free, kind: FeedKind.promo, subtitle: 'Livraison offerte aujourd\'hui')
          .copyWith(badge: 'Gratuit'));
    }

    // 5. Le reste du classement, pour nourrir « Voir tout ».
    for (final s in byRating.skip(1)) {
      if (items.length >= limit) break;
      if (items.any((i) => i.storeId == s.id)) continue;
      items.add(_fromStore(s, kind: FeedKind.store, subtitle: 'Recommandé pour vous'));
    }

    return items.take(limit).toList();
  }

  FeedItem _fromStore(Store s, {required FeedKind kind, required String subtitle}) => FeedItem(
        id: 'feed_${s.id}',
        kind: kind,
        title: s.name,
        subtitle: subtitle,
        image: s.image,
        meta: '★ ${s.rating.toStringAsFixed(1)} · ${s.etaMin} min',
        storeId: s.id,
      );
}

/// Recommandations servies par le backend (`GET /brain/feed`).
///
/// Le point d'entrée n'existe pas encore côté serveur : l'appel est donc écrit,
/// mais toute erreur retombe silencieusement sur le dépôt local. L'interface est
/// prête, le jour où le Brain répond il n'y a rien à changer ici.
class ApiFeedRepository implements FeedRepository {
  final FeedRepository fallback;
  const ApiFeedRepository({this.fallback = const MockFeedRepository()});

  @override
  Future<List<FeedItem>> forYou({int limit = 8}) async {
    try {
      await session.ensureAuth();
      final data = await api.get('/brain/feed', query: {'limit': limit});
      final list = (data is List) ? data : const [];
      final items = list.whereType<Map>().map(FeedItem.fromJson).toList();
      if (items.isNotEmpty) return items;
    } catch (e) {
      debugPrint('[Feed] live indisponible: $e');
    }
    return fallback.forYou(limit: limit);
  }
}

/// Dépôt actif, choisi une seule fois selon l'environnement.
FeedRepository get feedRepository =>
    NovigoEnv.live ? const ApiFeedRepository() : const MockFeedRepository();

/// État observable de la section « Pour vous ».
class FeedModel extends ChangeNotifier {
  List<FeedItem> items = const [];
  bool loading = false;
  Object? error;

  bool get isEmpty => items.isEmpty;

  /// Charge (ou recharge) le flux. `force` ignore le contenu déjà présent.
  Future<void> load({bool force = false}) async {
    if (loading) return;
    if (items.isNotEmpty && !force) return;
    loading = true;
    error = null;
    notifyListeners();
    try {
      items = await feedRepository.forYou();
    } catch (e) {
      error = e;
      debugPrint('[Feed] $e');
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}

final feed = FeedModel();

extension on FeedItem {
  FeedItem copyWith({String? badge}) => FeedItem(
        id: id,
        kind: kind,
        title: title,
        subtitle: subtitle,
        image: image,
        badge: badge ?? this.badge,
        meta: meta,
        storeId: storeId,
        serviceId: serviceId,
      );
}
