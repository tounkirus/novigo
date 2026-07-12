import '../cart.dart';
import 'api_client.dart';
import 'session.dart';
import 'notifications_api.dart' show relativeTime;

/// Résultat d'une commande live.
class PlacedOrder {
  final String id;
  final String reference;
  const PlacedOrder(this.id, this.reference);
}

int _money(dynamic m) {
  if (m is Map) return int.tryParse('${m['amount'] ?? 0}') ?? 0;
  return int.tryParse('${m ?? 0}') ?? 0;
}

/// Commande telle que renvoyée par GET /orders (Nest).
class OrderDto {
  final String id;
  final String reference;
  final String type;
  final String status;
  final int total;
  final DateTime? createdAt;
  const OrderDto({
    required this.id,
    required this.reference,
    required this.type,
    required this.status,
    required this.total,
    this.createdAt,
  });

  factory OrderDto.fromJson(Map j) => OrderDto(
        id: (j['id'] ?? '').toString(),
        reference: (j['reference'] ?? '').toString(),
        type: (j['type'] ?? '').toString(),
        status: (j['status'] ?? '').toString().toUpperCase(),
        total: _money(j['total']),
        createdAt: DateTime.tryParse((j['createdAt'] ?? '').toString())?.toLocal(),
      );

  static const _closed = {'DELIVERED', 'CANCELLED', 'REFUNDED'};
  bool get inProgress => !_closed.contains(status);
  bool get delivered => status == 'DELIVERED';
  bool get cancelled => status == 'CANCELLED' || status == 'REFUNDED';

  String get whenLabel => relativeTime(createdAt);

  /// Libellé du type de commande (titre affiché à défaut de nom de commerce).
  String get typeLabel {
    switch (type.toUpperCase()) {
      case 'FOOD':
        return 'Repas';
      case 'PHARMACY':
        return 'Pharmacie';
      case 'GROCERY':
        return 'Épicerie';
      case 'MARKETPLACE':
        return 'Marché';
      case 'PARCEL':
        return 'Colis';
      case 'ARTISAN_SERVICE':
        return 'Service';
      default:
        return 'Commande';
    }
  }

  /// Statut lisible côté client.
  String get statusLabel {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmée';
      case 'PREPARING':
        return 'En préparation';
      case 'READY':
        return 'Prête';
      case 'ASSIGNED':
        return 'Coursier assigné';
      case 'IN_TRANSIT':
        return 'En route';
      case 'DELIVERED':
        return 'Livrée';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'Annulée';
      default:
        return status;
    }
  }
}

/// Liste des commandes de l'utilisateur (GET /orders via Gateway).
Future<List<OrderDto>> fetchLiveOrders({int limit = 20}) async {
  await session.ensureAuth();
  final data = await api.get('/orders', query: {'limit': limit});
  final list = (data is List) ? data : const [];
  return list.whereType<Map>().map((e) => OrderDto.fromJson(e)).toList();
}

String _orderType(String kind) {
  switch (kind) {
    case 'supermarche':
    case 'marche':
    case 'boulangerie':
      return 'GROCERY';
    case 'pharmacie':
      return 'PHARMACY';
    default:
      return 'FOOD';
  }
}

String _paymentMethod(int index) {
  switch (index) {
    case 0:
      return 'ORANGE_MONEY';
    case 1:
      return 'WAVE';
    default:
      return 'CASH';
  }
}

/// Place la commande sur le backend (POST /orders via Gateway) et renvoie id+référence.
Future<PlacedOrder> placeLiveOrder(CartModel cart, {int payIndex = 2}) async {
  await session.ensureAuth();
  final items = cart.lines
      .map((l) => {'productId': l.product.id, 'quantity': l.qty})
      .toList();
  final data = await api.post('/orders', body: {
    'type': _orderType(cart.store?.kind ?? 'repas'),
    'items': items,
    'deliveryAddress': {
      'line1': 'Rue 250, porte 74',
      'city': 'Bamako',
      'district': 'Hamdallaye ACI',
    },
    'paymentMethod': _paymentMethod(payIndex),
  });
  final map = data is Map ? data : const {};
  return PlacedOrder(
    (map['id'] ?? '').toString(),
    (map['reference'] ?? '').toString(),
  );
}
