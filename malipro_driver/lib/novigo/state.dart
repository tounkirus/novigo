import 'package:flutter/foundation.dart';
import 'models.dart';
import 'data.dart';
import 'data/env.dart';
import 'data/session.dart';
import 'data/driver_api.dart';
import 'data/realtime_client.dart';

/// État global du livreur — mock offline par défaut, réactif via ChangeNotifier.
/// En mode LIVE (--dart-define=NOVIGO_LIVE=true) le même état est hydraté depuis
/// le Gateway ; tout appel réseau est best-effort avec repli sur le mock.
class DriverState extends ChangeNotifier {
  // Disponibilité
  bool online = false;

  // Course en cours
  DeliveryRequest? active;
  int step = 0; // 0=aller commerce, 1=récupéré, 2=en route, 3=livré

  // Listes mock
  final List<DeliveryRequest> available = List.of(kInitialAvailable);
  final List<PastDelivery> history = List.of(kInitialHistory);
  final List<EarningTx> earnings = List.of(kInitialEarnings);

  // Profil live (renseigné par goLive en mode LIVE ; sinon valeurs démo).
  String? driverName;
  int totalDeliveries = 0;

  // Compteurs du jour (valeurs de départ démo)
  int _todayEarnings = 12400;
  int _todayCount = 8;
  double rating = 4.9;
  final double hoursOnline = 5.5;
  int _available = 63200; // gains disponibles au retrait

  int get todayEarnings => _todayEarnings;
  int get todayCount => _todayCount;
  int get availableEarnings => _available;
  int get weekEarnings => 74600;

  bool get hasActive => active != null;

  void toggleOnline() {
    online = !online;
    notifyListeners();
    if (NovigoEnv.live) _pushAvailability();
  }

  void setOnline(bool v) {
    if (online == v) return;
    online = v;
    notifyListeners();
    if (NovigoEnv.live) _pushAvailability();
  }

  void accept(DeliveryRequest req) {
    active = req;
    step = 0;
    available.removeWhere((r) => r.id == req.id);
    notifyListeners();
    if (NovigoEnv.live) _acceptLive(req.id);
  }

  void advanceStep() {
    if (active == null) return;
    if (step < 3) {
      step += 1;
      notifyListeners();
      // Étape "Démarrer la livraison" (2→3) = start côté backend (émet order.tracking IN_TRANSIT).
      if (NovigoEnv.live && step == 3 && active != null) _startLive(active!.id);
    }
  }

  // --- Intégration LIVE (best-effort ; repli silencieux sur le mock) ---

  bool _liveStarted = false;

  /// Démarrage : auth démo, profil, courses disponibles, temps réel.
  /// Ne fait rien en mode mock (démo offline). Jamais bloquant, jamais de crash.
  Future<void> goLive() async {
    if (!NovigoEnv.live || _liveStarted) return;
    _liveStarted = true;
    try {
      await session.ensureAuth();
      final profile = await driverApi.fetchProfile();
      if (profile != null) {
        driverName = profile.name;
        totalDeliveries = profile.totalDeliveries;
        if (profile.rating > 0) rating = profile.rating;
        online = profile.isAvailable;
        notifyListeners();
      }
      realtime.connectDriver(onNotification: (_) {
        if (online) _loadAvailable();
      });
      if (online) await _loadAvailable();
    } catch (e) {
      debugPrint('[Driver] live indisponible: $e'); // le mock reste en place
    }
  }

  Future<void> _pushAvailability() async {
    try {
      await driverApi.setAvailability(online);
      if (online) {
        await _loadAvailable();
      }
    } catch (e) {
      debugPrint('[Driver] setAvailability échec: $e');
    }
  }

  Future<void> _loadAvailable() async {
    try {
      final live = await driverApi.fetchAvailable(limit: 20);
      available
        ..clear()
        ..addAll(live);
      notifyListeners();
    } catch (e) {
      debugPrint('[Driver] fetchAvailable échec: $e'); // conserve la liste courante
    }
  }

  Future<void> _acceptLive(String id) async {
    try {
      await driverApi.accept(id);
    } catch (e) {
      debugPrint('[Driver] accept échec: $e'); // la course active locale est conservée
    }
  }

  Future<void> _startLive(String id) async {
    try {
      await driverApi.start(id);
    } catch (e) {
      debugPrint('[Driver] start échec: $e');
    }
  }

  Future<void> _completeLive(String id) async {
    try {
      await driverApi.complete(id);
    } catch (e) {
      debugPrint('[Driver] complete échec: $e');
    }
  }

  /// Clôture la course en cours : crédite les gains, met à jour l'historique
  /// et les compteurs du jour. Retourne le montant crédité.
  int completeActive() {
    final req = active;
    if (req == null) return 0;
    if (NovigoEnv.live) _completeLive(req.id); // émet order.tracking DELIVERED au client
    final amount = req.payout;
    _todayEarnings += amount;
    _todayCount += 1;
    _available += amount;
    history.insert(
      0,
      PastDelivery(
        id: req.id,
        storeName: req.storeName,
        when: 'À l\'instant',
        payout: amount,
      ),
    );
    earnings.insert(
      0,
      EarningTx(
        label: 'Course · ${req.storeName}',
        when: 'À l\'instant',
        amount: amount,
        isPayout: true,
      ),
    );
    active = null;
    step = 0;
    notifyListeners();
    return amount;
  }
}

/// Instance globale de l'état livreur.
final driver = DriverState();
