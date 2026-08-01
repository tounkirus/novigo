import 'api_client.dart';

/// Couche NOVIGO Brain de l'application marchand.
///
/// Le Brain n'envoie pas des chiffres bruts : il restitue au commerçant ce que la
/// plateforme a appris de LUI (temps de préparation réel, confiance, tension de
/// son quartier, heures de pointe) et les conseils qui en découlent.

/// Score de confiance du commerçant (Trust Engine).
class BrainTrust {
  final double score;
  final String level;
  final int missions;
  final List<String> reasons;
  const BrainTrust({
    this.score = 50,
    this.level = 'NOUVEAU',
    this.missions = 0,
    this.reasons = const [],
  });

  factory BrainTrust.fromJson(Map j) => BrainTrust(
        score: (j['score'] as num?)?.toDouble() ?? 50,
        level: (j['level'] ?? 'NOUVEAU').toString(),
        missions: (j['missions'] as num?)?.toInt() ?? 0,
        reasons: ((j['reasons'] as List?) ?? const []).map((r) => r.toString()).toList(),
      );
}

/// Ce que le Brain a appris de ce commerce (GET /brain/insights/merchant).
class BrainMerchantInsights {
  final String zone;
  final int prepMinutes;
  final int prepSamples;
  final List<int> peakHours;
  final double tension;
  final BrainTrust trust;
  final List<String> advice;

  const BrainMerchantInsights({
    this.zone = '',
    this.prepMinutes = 0,
    this.prepSamples = 0,
    this.peakHours = const [],
    this.tension = 1,
    this.trust = const BrainTrust(),
    this.advice = const [],
  });

  /// Quartier tendu : peu de livreurs disponibles pour la demande observée.
  bool get busyZone => tension > 1.3;

  /// Le temps de préparation est-il vraiment appris (assez d'observations) ?
  bool get prepLearned => prepSamples >= 5;

  String get peakLabel => peakHours.map((h) => '${h}h').join(' · ');

  factory BrainMerchantInsights.fromJson(Map j) => BrainMerchantInsights(
        zone: (j['zone'] ?? '').toString(),
        prepMinutes: (j['prepMinutes'] as num?)?.round() ?? 0,
        prepSamples: (j['prepSamples'] as num?)?.toInt() ?? 0,
        peakHours: ((j['peakHours'] as List?) ?? const [])
            .map((h) => (h as num?)?.toInt() ?? 0)
            .toList(),
        tension: (j['tension'] as num?)?.toDouble() ?? 1,
        trust: j['trust'] is Map ? BrainTrust.fromJson(j['trust'] as Map) : const BrainTrust(),
        advice: ((j['advice'] as List?) ?? const []).map((a) => a.toString()).toList(),
      );
}

/// Appels Brain du marchand (mode LIVE uniquement, best-effort).
class MerchantBrainApi {
  /// GET /brain/insights/merchant — préparation apprise, confiance, conseils.
  Future<BrainMerchantInsights?> fetchInsights() async {
    final data = await api.get('/brain/insights/merchant');
    return data is Map ? BrainMerchantInsights.fromJson(data) : null;
  }

  /// GET /brain/insights/city — pouls du quartier (heures de pointe, tension).
  Future<Map?> fetchCity({String? zone}) async {
    final data = await api.get('/brain/insights/city', query: zone != null ? {'zone': zone} : null);
    return data is Map ? data : null;
  }
}

final merchantBrain = MerchantBrainApi();
