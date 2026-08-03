import 'dart:async';

import 'package:flutter/foundation.dart';
import 'models.dart';
import 'data.dart';
import 'data/env.dart';
import 'data/session.dart';
import 'data/driver_api.dart';
import 'data/brain_api.dart';
import 'data/voice_api.dart';
import 'voice_service.dart';
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

  /// Missions ouvertes tous métiers confondus (colis, course, dépannage…),
  /// classées POUR moi par le NOVIGO Brain. Vide hors ligne / hors mode live.
  final List<BrainMission> brainMissions = [];
  final List<EarningTx> earnings = List.of(kInitialEarnings);

  // Profil live (renseigné par goLive en mode LIVE ; sinon valeurs démo).
  String? driverName;
  String? driverPhone;
  int totalDeliveries = 0;

  /// Nom affiché : compte connecté en live, libellé générique sinon.
  String get displayName => driverName ?? 'Livreur NOVIGO';

  /// Prénom seul, pour les formules d'adresse (« Merci Moussa »).
  String get firstName => displayName.split(' ').first;

  /// Initiales pour l'avatar (2 lettres max).
  String get initials {
    final words = displayName.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    if (words.isEmpty) return 'NV';
    if (words.length == 1) {
      final w = words.first;
      return (w.length >= 2 ? w.substring(0, 2) : w).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Compteurs (valeurs de départ démo, remplacées par /drivers/me/earnings en live)
  int _todayEarnings = 12400;
  int _todayCount = 8;
  double rating = 4.9;
  int _available = 63200; // cumul des courses terminées
  int _week = 74600;

  int get todayEarnings => _todayEarnings;
  int get todayCount => _todayCount;
  int get availableEarnings => _available;
  int get weekEarnings => _week;

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

  // --- Arrivée chez le client et attente (CDC v0.75 §3) -------------------

  /// Attente en cours, telle que le SERVEUR la compte. `null` tant que le
  /// livreur n'a pas signalé son arrivée.
  WaitingStatus? waiting;

  bool get hasArrived => waiting?.started == true;

  /// « Je suis arrivé » : démarre le compteur d'attente ouvrant droit à
  /// indemnisation. Hors ligne, on se contente d'un état local.
  Future<void> markArrived() async {
    final id = active?.id;
    if (id == null) return;
    if (NovigoEnv.live) {
      try {
        await driverApi.arrive(id);
        await refreshWaiting();
        return;
      } catch (e) {
        debugPrint('[Driver] arrivée non enregistrée: $e');
      }
    }
    waiting = const WaitingStatus(
        waitedMinutes: 0.1, mayCancelForAbsence: false, compensation: 0);
    notifyListeners();
  }

  /// Relit l'attente auprès du serveur — c'est lui qui fait foi.
  Future<void> refreshWaiting() async {
    final id = active?.id;
    if (id == null || !NovigoEnv.live) return;
    final w = await driverApi.waiting(id);
    if (w == null) return;
    waiting = w;
    notifyListeners();
  }

  /// Abandon pour client absent. Renvoie l'indemnité obtenue, ou `null` si le
  /// serveur a refusé (délai non écoulé).
  Future<int?> reportAbsent() async {
    final id = active?.id;
    if (id == null) return null;
    if (!NovigoEnv.live) return waiting?.compensation ?? 0;
    try {
      final amount = await driverApi.reportAbsent(id);
      active = null;
      step = 0;
      waiting = null;
      notifyListeners();
      return amount;
    } catch (e) {
      debugPrint('[Driver] abandon refusé: $e');
      return null;
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
        driverPhone = profile.phone;
        totalDeliveries = profile.totalDeliveries;
        if (profile.rating > 0) rating = profile.rating;
        online = profile.isAvailable;
        notifyListeners();
      }
      await _loadEarnings();
      await _loadHistory();
      // Voix : préparée EN PARALLÈLE. Le moteur vocal d'un téléphone peut être
      // lent (ou absent) : l'attendre retarderait la connexion temps réel, donc
      // les courses elles-mêmes. La voix n'est jamais sur le chemin critique.
      unawaited(voice.init().then((_) => voice.loadSettings()));
      realtime.connectDriver(
        onNotification: (_) {
          if (online) _loadAvailable();
        },
        // Annonce vocale d'une mission attribuée : lue immédiatement.
        onVoice: (d) {
          voice.announce(VoiceAnnouncement.fromJson(d));
          _loadBrainMissions();
        },
      );
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

  /// Gains réels du livreur (courses terminées) — jamais bloquant.
  Future<void> _loadEarnings() async {
    try {
      final e = await driverApi.fetchEarnings();
      if (e == null) return;
      _todayEarnings = e.today;
      _todayCount = e.todayCount;
      _week = e.week;
      _available = e.total;
      totalDeliveries = e.totalCount;
      notifyListeners();
    } catch (err) {
      debugPrint('[Driver] fetchEarnings échec: $err'); // conserve les compteurs courants
    }
  }

  /// Historique réel : courses terminées du compte, pas le jeu de démo.
  /// Les retraits ne sont pas exposés par le backend : la liste n'affiche donc
  /// que des gains de course, aucune ligne inventée.
  Future<void> _loadHistory() async {
    try {
      final rows = await driverApi.fetchHistory();
      history
        ..clear()
        ..addAll(rows);
      earnings
        ..clear()
        ..addAll(rows.map((d) => EarningTx(
              label: 'Course · ${d.storeName}',
              when: d.when,
              amount: d.payout,
              isPayout: true,
            )));
      notifyListeners();
    } catch (err) {
      debugPrint('[Driver] fetchHistory échec: $err');
    }
  }

  /// Rafraîchit la liste des courses libres et les gains (pull-to-refresh).
  Future<void> refreshAvailable() async {
    if (!NovigoEnv.live) return;
    await _loadEarnings();
    await _loadHistory();
    if (online) {
      await _loadAvailable();
      await _loadBrainMissions();
    }
  }

  /// Missions classées par le Brain (GET /brain/missions/available).
  /// Best-effort : sans backend, la liste reste vide et l'écran n'affiche rien.
  Future<void> _loadBrainMissions() async {
    if (!NovigoEnv.live) return;
    try {
      final rows = await driverBrain.fetchRankedMissions(limit: 10);
      brainMissions
        ..clear()
        ..addAll(rows);
      notifyListeners();
    } catch (e) {
      debugPrint('[Driver] missions Brain indisponibles: $e');
    }
  }

  /// J'accepte une mission proposée par le Brain (hors file livraison).
  Future<void> acceptBrainMission(BrainMission m) async {
    brainMissions.removeWhere((x) => x.id == m.id);
    notifyListeners();
    try {
      await driverBrain.accept(m.id);
    } catch (e) {
      debugPrint('[Driver] accept mission Brain échec: $e');
    }
  }

  Future<void> _loadAvailable() async {
    try {
      final live = await driverApi.fetchAvailable(limit: 20);
      available
        ..clear()
        // Le backend renvoie déjà les courses CLASSÉES par le Brain pour ce
        // livreur (score + raisons) : on conserve son ordre tel quel.
        ..addAll(live);
      notifyListeners();
      await _loadBrainMissions();
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
      // Recale compteurs et historique : la course vient d'être encaissée.
      await _loadEarnings();
      await _loadHistory();
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
