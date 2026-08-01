import 'api_client.dart';
import 'session.dart';

/// Couche NOVIGO Brain de l'application client.
///
/// Principe n°1 : le Brain décide, l'application exécute. Aucun tarif, aucun délai
/// n'est calculé ici : l'app demande une décision au Brain et l'affiche avec ses
/// raisons. Hors ligne (démo zéro-infra), on affiche une estimation explicitement
/// annoncée comme telle — jamais présentée comme une décision du Brain.

/// Une ligne du détail tarifaire (« Prise en charge », « Distance (3,4 km) »…).
class PriceLine {
  final String label;
  final int amount;
  const PriceLine(this.label, this.amount);

  factory PriceLine.fromJson(Map j) => PriceLine(
        (j['label'] ?? '').toString(),
        (j['amount'] as num?)?.round() ?? 0,
      );
}

/// Le Carré d'Équilibre NOVIGO : ce que la décision apporte à chaque pilier.
class BrainBalance {
  final int client;
  final int provider;
  final int partner;
  final int novigo;
  const BrainBalance({
    this.client = 0,
    this.provider = 0,
    this.partner = 0,
    this.novigo = 0,
  });

  factory BrainBalance.fromJson(Map j) => BrainBalance(
        client: (j['client'] as num?)?.round() ?? 0,
        provider: (j['provider'] as num?)?.round() ?? 0,
        partner: (j['partner'] as num?)?.round() ?? 0,
        novigo: (j['novigo'] as num?)?.round() ?? 0,
      );

  List<MapEntry<String, int>> get pillars => [
        MapEntry('Client', client),
        MapEntry('Prestataire', provider),
        MapEntry('Partenaire', partner),
        MapEntry('NOVIGO', novigo),
      ];
}

/// Décision de tarification + délai renvoyée par POST /brain/quote.
class BrainQuote {
  final String serviceKey;
  final String serviceLabel;
  final int amount;
  final int etaMinutes;
  final int distanceMeters;
  final double surge;
  final String zone;
  final List<PriceLine> breakdown;
  final List<String> reasons;
  final BrainBalance balance;
  final String? decisionId;

  /// Faux quand la décision vient d'une estimation locale (mode démo hors ligne).
  final bool live;

  const BrainQuote({
    required this.serviceKey,
    required this.serviceLabel,
    required this.amount,
    required this.etaMinutes,
    this.distanceMeters = 0,
    this.surge = 1,
    this.zone = '',
    this.breakdown = const [],
    this.reasons = const [],
    this.balance = const BrainBalance(),
    this.decisionId,
    this.live = true,
  });

  bool get busy => surge > 1.01;
  double get distanceKm => distanceMeters / 1000;

  factory BrainQuote.fromJson(Map j) {
    final price = j['price'];
    return BrainQuote(
      serviceKey: (j['serviceKey'] ?? '').toString(),
      serviceLabel: (j['serviceLabel'] ?? 'Service NOVIGO').toString(),
      amount: price is Map ? ((price['amount'] as num?)?.round() ?? 0) : 0,
      etaMinutes: (j['etaMinutes'] as num?)?.round() ?? 0,
      distanceMeters: (j['distanceMeters'] as num?)?.round() ?? 0,
      surge: (j['surge'] as num?)?.toDouble() ?? 1,
      zone: (j['zone'] ?? '').toString(),
      breakdown:
          ((j['breakdown'] as List?) ?? const []).whereType<Map>().map(PriceLine.fromJson).toList(),
      reasons: ((j['reasons'] as List?) ?? const []).map((r) => r.toString()).toList(),
      balance: j['balance'] is Map ? BrainBalance.fromJson(j['balance'] as Map) : const BrainBalance(),
      decisionId: j['decisionId']?.toString(),
      live: true,
    );
  }

  /// Estimation locale de repli, affichée comme telle (démo sans backend).
  factory BrainQuote.offline({required int deliveryFee, required int etaMinutes}) => BrainQuote(
        serviceKey: 'food_delivery',
        serviceLabel: 'Livraison NOVIGO',
        amount: deliveryFee,
        etaMinutes: etaMinutes,
        breakdown: [PriceLine('Livraison', deliveryFee)],
        reasons: const [
          'Mode démo hors ligne : estimation locale, non calculée par le Brain.',
        ],
        live: false,
      );
}

/// Score de confiance du client (GET /brain/trust/me).
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

/// Métier piloté par le Brain (GET /brain/services) — utile aux écrans services.
class BrainServiceInfo {
  final String key;
  final String label;
  final String family;
  final int slaMinutes;
  const BrainServiceInfo({
    required this.key,
    required this.label,
    required this.family,
    this.slaMinutes = 0,
  });

  factory BrainServiceInfo.fromJson(Map j) => BrainServiceInfo(
        key: (j['key'] ?? '').toString(),
        label: (j['label'] ?? '').toString(),
        family: (j['family'] ?? '').toString(),
        slaMinutes: (j['slaMinutes'] as num?)?.toInt() ?? 0,
      );
}

/// Demande une décision de tarif + délai au Brain (POST /brain/quote).
Future<BrainQuote?> fetchBrainQuote({
  String? serviceKey,
  String? orderType,
  String? storeId,
  String? zone,
  int? subtotal,
  int? itemsCount,
}) async {
  await session.ensureAuth();
  final data = await api.post('/brain/quote', body: {
    if (serviceKey != null) 'serviceKey': serviceKey,
    if (orderType != null) 'orderType': orderType,
    if (storeId != null && storeId.isNotEmpty) 'storeId': storeId,
    if (zone != null && zone.isNotEmpty) 'zone': zone,
    if (subtotal != null) 'subtotal': subtotal,
    if (itemsCount != null) 'itemsCount': itemsCount,
  });
  return data is Map ? BrainQuote.fromJson(data) : null;
}

/// Ma confiance NOVIGO (GET /brain/trust/me).
Future<BrainTrust?> fetchMyTrust() async {
  await session.ensureAuth();
  final data = await api.get('/brain/trust/me');
  return data is Map ? BrainTrust.fromJson(data) : null;
}

/// Métiers déclarés au Brain (GET /brain/services).
Future<List<BrainServiceInfo>> fetchBrainServices() async {
  await session.ensureAuth();
  final data = await api.get('/brain/services');
  final list = (data is List) ? data : const [];
  return list.whereType<Map>().map(BrainServiceInfo.fromJson).toList();
}

/// Explication complète d'une décision (GET /brain/decisions/:id).
Future<Map?> fetchDecision(String decisionId) async {
  await session.ensureAuth();
  final data = await api.get('/brain/decisions/$decisionId');
  return data is Map ? data : null;
}
