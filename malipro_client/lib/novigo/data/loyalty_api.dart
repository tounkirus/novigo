import 'api_client.dart';
import 'session.dart';
import 'notifications_api.dart' show relativeTime;

/// Palier de fidélité (label français + couleur gérée à l'écran).
String tierLabel(String tier) {
  switch (tier.toUpperCase()) {
    case 'GOLD':
      return 'Or';
    case 'SILVER':
      return 'Argent';
    default:
      return 'Bronze';
  }
}

/// Solde de fidélité de l'utilisateur (backend finance /loyalty/me).
class LoyaltyAccountDto {
  final int points;
  final String tier;
  final int nextTierPoints;
  final String nextTier;
  final int toNext;
  const LoyaltyAccountDto({
    required this.points,
    required this.tier,
    required this.nextTierPoints,
    required this.nextTier,
    required this.toNext,
  });

  factory LoyaltyAccountDto.fromJson(Map j) => LoyaltyAccountDto(
        points: int.tryParse('${j['points'] ?? 0}') ?? 0,
        tier: (j['tier'] ?? 'BRONZE').toString(),
        nextTierPoints: int.tryParse('${j['nextTierPoints'] ?? 0}') ?? 0,
        nextTier: (j['nextTier'] ?? 'GOLD').toString(),
        toNext: int.tryParse('${j['toNext'] ?? 0}') ?? 0,
      );

  double get progress =>
      nextTierPoints <= 0 ? 1 : (points / nextTierPoints).clamp(0.0, 1.0);
}

/// Écriture d'historique de points.
class LoyaltyEntryDto {
  final int delta;
  final String label;
  final String when;
  const LoyaltyEntryDto(this.delta, this.label, this.when);

  factory LoyaltyEntryDto.fromJson(Map j) => LoyaltyEntryDto(
        int.tryParse('${j['delta'] ?? 0}') ?? 0,
        (j['label'] ?? '').toString(),
        relativeTime(DateTime.tryParse((j['createdAt'] ?? '').toString())?.toLocal()),
      );
}

/// Récompense échangeable.
class RewardDto {
  final String id;
  final String title;
  final int cost;
  final bool affordable;
  const RewardDto(this.id, this.title, this.cost, this.affordable);

  factory RewardDto.fromJson(Map j) => RewardDto(
        (j['id'] ?? '').toString(),
        (j['title'] ?? '').toString(),
        int.tryParse('${j['cost'] ?? 0}') ?? 0,
        j['affordable'] == true,
      );
}

/// Accès live à la fidélité. Best-effort : lève en cas d'échec (repli mock à l'écran).
class LoyaltyApi {
  Future<LoyaltyAccountDto> me() async {
    await session.ensureAuth();
    final data = await api.get('/loyalty/me');
    return LoyaltyAccountDto.fromJson(data is Map ? data : const {});
  }

  Future<List<LoyaltyEntryDto>> history() async {
    await session.ensureAuth();
    final data = await api.get('/loyalty/history');
    final list = (data is List) ? data : const [];
    return list.whereType<Map>().map((e) => LoyaltyEntryDto.fromJson(e)).toList();
  }

  Future<List<RewardDto>> rewards() async {
    await session.ensureAuth();
    final data = await api.get('/loyalty/rewards');
    final list = (data is List) ? data : const [];
    return list.whereType<Map>().map((e) => RewardDto.fromJson(e)).toList();
  }

  Future<LoyaltyAccountDto> redeem(String rewardId) async {
    await session.ensureAuth();
    final data = await api.post('/loyalty/rewards/$rewardId/redeem');
    return LoyaltyAccountDto.fromJson(data is Map ? data : const {});
  }
}

final loyaltyApi = LoyaltyApi();
