import 'api_client.dart';
import 'session.dart';

/// Coupon exposé par le backend finance (Spring, schéma finance) via le Gateway.
class CouponDto {
  final String code;
  final String label;
  final int discountPercent;
  final int minAmount;
  final bool active;
  final DateTime? expiresAt;
  const CouponDto({
    required this.code,
    required this.label,
    required this.discountPercent,
    required this.minAmount,
    required this.active,
    this.expiresAt,
  });

  factory CouponDto.fromJson(Map j) => CouponDto(
        code: (j['code'] ?? '').toString(),
        label: (j['label'] ?? '').toString(),
        discountPercent: int.tryParse('${j['discountPercent'] ?? 0}') ?? 0,
        minAmount: int.tryParse('${j['minAmount'] ?? 0}') ?? 0,
        active: j['active'] != false,
        expiresAt: DateTime.tryParse((j['expiresAt'] ?? '').toString())?.toLocal(),
      );

  bool get freeDelivery => discountPercent == 0;

  /// Conditions lisibles (« Dès 5 000 FCFA », « Toute commande »).
  String get conditions {
    if (minAmount > 0) {
      final amount = minAmount.toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]} ');
      return 'Dès $amount FCFA';
    }
    return 'Toute commande';
  }

  /// Étiquette d'expiration (« Expire le 31/07 »).
  String get expiry {
    final d = expiresAt;
    if (d == null) return 'Sans expiration';
    return 'Expire le ${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';
  }
}

/// Accès live aux coupons. Best-effort : lève en cas d'échec (repli mock à l'écran).
class CouponsApi {
  Future<List<CouponDto>> fetchActive() async {
    await session.ensureAuth();
    final data = await api.get('/coupons', query: {'active': true, 'size': 50, 'sort': 'minAmount'});
    // Spring renvoie une PageResponse {content:[...], ...} (hors enveloppe {success,data}).
    final list = (data is Map && data['content'] is List) ? data['content'] as List : const [];
    return list.whereType<Map>().map((e) => CouponDto.fromJson(e)).toList();
  }

  /// Valide un code saisi : renvoie le coupon si trouvé, sinon null.
  Future<CouponDto?> validate(String code) async {
    await session.ensureAuth();
    try {
      final data = await api.get('/coupons/${code.trim()}');
      if (data is Map && data['code'] != null) return CouponDto.fromJson(data);
    } catch (_) {
      // 404 => code inconnu
    }
    return null;
  }
}

final couponsApi = CouponsApi();
