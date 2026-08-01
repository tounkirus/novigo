import 'api_client.dart';

/// Couche NOVIGO Brain de l'application livreur.
///
/// Le Brain décide QUI reçoit QUELLE mission et pourquoi (Service Decision
/// Engine). L'application se contente d'afficher le score de compatibilité et
/// les raisons : elle ne re-trie ni ne re-filtre selon ses propres critères.

/// Mission ouverte proposée au prestataire connecté, telle que le Brain la note.
class BrainMission {
  final String id;
  final String reference;
  final String serviceKey;
  final String serviceLabel;
  final String status;
  final String zone;
  final int etaMinutes;
  final int distanceMeters;
  final int price;
  final int payout;

  /// Score de compatibilité sur 100 calculé par le Brain POUR ce prestataire.
  final int score;
  final bool eligible;
  final List<String> reasons;

  const BrainMission({
    required this.id,
    required this.reference,
    required this.serviceKey,
    required this.serviceLabel,
    required this.status,
    this.zone = '',
    this.etaMinutes = 0,
    this.distanceMeters = 0,
    this.price = 0,
    this.payout = 0,
    this.score = 0,
    this.eligible = true,
    this.reasons = const [],
  });

  double get distanceKm => distanceMeters / 1000;
  bool get recommended => eligible && score >= 60;

  factory BrainMission.fromJson(Map j) {
    final price = j['price'];
    return BrainMission(
      id: (j['id'] ?? '').toString(),
      reference: (j['reference'] ?? '').toString(),
      serviceKey: (j['serviceKey'] ?? '').toString(),
      serviceLabel: (j['serviceLabel'] ?? 'Mission NOVIGO').toString(),
      status: (j['status'] ?? '').toString(),
      zone: (j['zone'] ?? '').toString(),
      etaMinutes: (j['etaMinutes'] as num?)?.toInt() ?? 0,
      distanceMeters: (j['distanceMeters'] as num?)?.toInt() ?? 0,
      price: price is Map ? ((price['amount'] as num?)?.round() ?? 0) : 0,
      payout: (j['payout'] as num?)?.round() ?? 0,
      score: (j['score'] as num?)?.round() ?? 0,
      eligible: j['eligible'] != false,
      reasons: ((j['reasons'] as List?) ?? const []).map((r) => r.toString()).toList(),
    );
  }
}

/// Appels Brain du livreur (mode LIVE uniquement, best-effort).
class DriverBrainApi {
  /// GET /brain/missions/available — missions ouvertes, classées pour moi.
  /// Couvre TOUS les métiers du Brain (livraison, colis, course, dépannage…),
  /// pas seulement les livraisons du catalogue.
  Future<List<BrainMission>> fetchRankedMissions({int limit = 20}) async {
    final data = await api.get('/brain/missions/available', query: {'limit': limit});
    final rows = (data as List?)?.whereType<Map>() ?? const <Map>[];
    return rows.map(BrainMission.fromJson).toList();
  }

  /// POST /brain/missions/:id/accept — j'accepte la mission attribuée.
  Future<void> accept(String missionId) async {
    await api.post('/brain/missions/$missionId/accept');
  }

  /// POST /brain/missions/:id/start — je démarre la mission.
  Future<void> start(String missionId) async {
    await api.post('/brain/missions/$missionId/start');
  }

  /// POST /brain/missions/:id/complete — mission terminée (le Brain apprend).
  Future<void> complete(String missionId) async {
    await api.post('/brain/missions/$missionId/complete');
  }

  /// GET /brain/missions/:id/decisions — pourquoi cette mission m'a été confiée.
  Future<List<Map>> decisions(String missionId) async {
    final data = await api.get('/brain/missions/$missionId/decisions');
    return (data as List?)?.whereType<Map>().toList() ?? const <Map>[];
  }
}

final driverBrain = DriverBrainApi();
