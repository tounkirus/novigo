import 'package:flutter/material.dart';
import 'models.dart';
import 'data.dart';
import 'data/env.dart';
import 'data/session.dart';
import 'data/merchant_api.dart' as mapi;
import 'data/realtime_client.dart';
import 'data/brain_api.dart';

/// État global du marchand — mock offline par défaut, mutations réactives via
/// ChangeNotifier. En mode live (`NovigoEnv.live`), les commandes et leur cycle
/// de vie sont synchronisés avec le Gateway (repli gracieux sur le mock si KO).
class MerchantState extends ChangeNotifier {
  /// Ce que le NOVIGO Brain a appris de ce commerce (null tant qu'il n'a pas
  /// répondu ou hors mode live : l'écran masque alors la section).
  BrainMerchantInsights? brainInsights;

  bool open = true;
  final List<MOrder> orders = seedOrders();
  final List<MProduct> products = seedProducts();

  // Note moyenne de la boutique.
  final double rating = 4.7;

  // Profil live (renseigné par goLive en mode live ; sinon null).
  String? businessName;

  final MerchantRealtime _realtime = MerchantRealtime();

  void toggleOpen() {
    open = !open;
    notifyListeners();
  }

  // ---- Branchement live ----

  /// Appelé au démarrage. Ne fait rien en mode mock (démo). En live : hydrate la
  /// liste de commandes depuis le Gateway puis ouvre le flux temps réel.
  Future<void> goLive() async {
    if (!NovigoEnv.live) return;
    try {
      await session.ensureAuth();
      final live = await mapi.fetchOrders();
      if (live.isNotEmpty) {
        orders
          ..clear()
          ..addAll(live);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[Merchant] commandes live indisponibles: $e'); // repli : le mock reste
    }
    try {
      final profile = await mapi.fetchProfile();
      if (profile != null) {
        businessName = profile['businessName']?.toString();
        notifyListeners();
      }
    } catch (_) {/* best-effort */}

    // NOVIGO Brain : conseils issus de ce qu'il a observé de ce commerce.
    await refreshBrain();

    // Temps réel : le serveur pousse dans la room du marchand (pas de subscribe).
    _realtime.connectMerchant(
      onNewOrder: (o) {
        orders.removeWhere((x) => x.id == o.id || (o.backendId != null && x.backendId == o.backendId));
        orders.insert(0, o); // en tête → badge « nouvelles » + aperçu tableau de bord
        notifyListeners();
      },
      onOrderUpdated: (id, status) {
        final o = _findByBackendId(id);
        if (o != null && o.status != status) {
          o.status = status;
          notifyListeners();
        }
      },
    );
  }

  /// Recharge les conseils du Brain (GET /brain/insights/merchant).
  Future<void> refreshBrain() async {
    if (!NovigoEnv.live) return;
    try {
      final insights = await merchantBrain.fetchInsights();
      if (insights != null) {
        brainInsights = insights;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[Merchant] conseils Brain indisponibles: $e'); // section masquée
    }
  }

  /// Pousse une transition vers le Gateway (fire-and-forget). L'état local a déjà
  /// été mis à jour ; un échec réseau ne fait que laisser l'optimistic update.
  void _pushLive(String? backendId, Future<void> Function(String id) call) {
    if (!NovigoEnv.live || backendId == null || backendId.isEmpty) return;
    call(backendId).catchError((e) => debugPrint('[Merchant] transition live échouée: $e'));
  }

  // ---- Cycle de vie d'une commande ----

  MOrder? _find(String id) {
    for (final o in orders) {
      if (o.id == id) return o;
    }
    return null;
  }

  MOrder? _findByBackendId(String id) {
    for (final o in orders) {
      if (o.backendId == id || o.id == id) return o;
    }
    return null;
  }

  void acceptOrder(String id) {
    final o = _find(id);
    if (o != null && o.status == MStatus.nouvelle) {
      o.status = MStatus.preparation;
      notifyListeners();
      // Le marchand collapse « accepter » + « lancer la préparation » : on pousse
      // les deux transitions backend (PENDING→CONFIRMED→PREPARING) pour que le
      // « Marquer prête » ultérieur (/ready, exige PREPARING) reste valide.
      _pushLive(o.backendId, (bid) async {
        await mapi.acceptOrder(bid);
        await mapi.setPreparing(bid);
      });
    }
  }

  void markReady(String id) {
    final o = _find(id);
    if (o != null && o.status == MStatus.preparation) {
      o.status = MStatus.prete;
      notifyListeners();
      _pushLive(o.backendId, mapi.setReady);
    }
  }

  void completeOrder(String id) {
    final o = _find(id);
    if (o != null && o.status == MStatus.prete) {
      o.status = MStatus.terminee;
      notifyListeners();
      // La remise au livreur / livraison est pilotée côté livreur : pas d'endpoint
      // marchand dédié — la mise à jour reste locale (le realtime confirmera).
    }
  }

  // ---- Filtres / compteurs ----

  List<MOrder> byStatus(String status) => orders.where((o) => o.status == status).toList();

  int get newCount => orders.where((o) => o.status == MStatus.nouvelle).length;

  /// Commandes à traiter (nouvelles + en préparation) — aperçu tableau de bord.
  List<MOrder> get toHandle =>
      orders.where((o) => o.status == MStatus.nouvelle || o.status == MStatus.preparation).toList();

  // ---- KPIs du jour (réactifs : se mettent à jour quand une commande se termine) ----

  int get _completedRevenue =>
      orders.where((o) => o.status == MStatus.terminee).fold(0, (s, o) => s + o.total);

  int get todayRevenue => 38400 + _completedRevenue;

  int get todayOrders => 15 + orders.where((o) => o.status == MStatus.terminee).length;

  int get avgBasket => todayOrders == 0 ? 0 : todayRevenue ~/ todayOrders;

  // ---- Menu ----

  void toggleAvailable(String id) {
    for (final p in products) {
      if (p.id == id) {
        p.available = !p.available;
        notifyListeners();
        return;
      }
    }
  }

  List<String> get sections {
    final out = <String>[];
    for (final p in products) {
      if (!out.contains(p.section)) out.add(p.section);
    }
    return out;
  }
}

/// Instance globale (comme `cart`/`favorites` côté client).
final merchant = MerchantState();
