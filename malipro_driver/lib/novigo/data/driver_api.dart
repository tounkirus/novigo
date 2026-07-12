import '../models.dart';
import 'api_client.dart';

/// Profil livreur renvoyé par GET /drivers/me.
class DriverProfile {
  final String id;
  final String? name;
  final String? phone;
  final bool isAvailable;
  final double rating;
  final int totalDeliveries;
  const DriverProfile({
    required this.id,
    this.name,
    this.phone,
    this.isAvailable = false,
    this.rating = 0,
    this.totalDeliveries = 0,
  });

  factory DriverProfile.fromJson(Map j) => DriverProfile(
        id: (j['id'] ?? '').toString(),
        name: (j['userName'] as String?)?.trim().isNotEmpty == true ? j['userName'] as String : null,
        phone: j['userPhone'] as String?,
        isAvailable: j['isAvailable'] == true,
        rating: (j['rating'] as num?)?.toDouble() ?? 0,
        totalDeliveries: (j['totalDeliveries'] as num?)?.toInt() ?? 0,
      );
}

double _coord(dynamic loc, String key) {
  if (loc is Map && loc[key] is num) return (loc[key] as num).toDouble();
  return 0;
}

String _fmtCoords(dynamic loc) {
  if (loc is! Map || loc['lat'] == null || loc['lng'] == null) return 'Bamako';
  final lat = _coord(loc, 'lat').toStringAsFixed(4);
  final lng = _coord(loc, 'lng').toStringAsFixed(4);
  return '$lat, $lng';
}

/// Mappe un DTO /deliveries/available vers le modèle de demande de course de l'app.
/// Les champs absents côté backend (nom commerce, client, payout) sont synthétisés
/// de façon déterministe pour préserver le rendu premium des écrans existants.
DeliveryRequest requestFromDelivery(Map j) {
  final id = (j['id'] ?? '').toString();
  final orderId = (j['orderId'] ?? '').toString();
  final distanceMeters = (j['distanceMeters'] as num?)?.toDouble() ?? 0;
  final distanceKm = distanceMeters > 0 ? (distanceMeters / 1000) : 2.5;
  final etaMinutes = (j['etaMinutes'] as num?)?.toInt() ?? (10 + (distanceKm * 4).round());
  final ref = orderId.length > 6 ? orderId.substring(orderId.length - 6).toUpperCase() : orderId.toUpperCase();
  final label = ref.isNotEmpty ? 'Commande $ref' : 'Course NOVIGO';
  final initials = ref.isNotEmpty ? ref.substring(0, ref.length >= 2 ? 2 : 1) : 'NV';
  final seed = id.hashCode.abs();
  final payout = (500 + distanceKm * 250).round();
  return DeliveryRequest(
    id: id,
    storeName: label,
    storeInitials: initials,
    storeAddress: 'Retrait · ${_fmtCoords(j['pickupLocation'])}',
    dropAddress: 'Client · ${_fmtCoords(j['dropoffLocation'])}',
    distanceKm: double.parse(distanceKm.toStringAsFixed(1)),
    payout: payout,
    itemsCount: 1 + (seed % 5),
    etaMin: etaMinutes,
    customerName: 'Client NOVIGO',
  );
}

/// Appels REST livreur vers le Gateway (mode LIVE uniquement, best-effort).
class DriverApi {
  /// GET /drivers/me — profil, stats, disponibilité.
  Future<DriverProfile?> fetchProfile() async {
    final data = await api.get('/drivers/me');
    return data is Map ? DriverProfile.fromJson(data) : null;
  }

  /// PATCH /drivers/me/availability — bascule en ligne / hors ligne.
  Future<void> setAvailability(bool available) async {
    await api.patch('/drivers/me/availability', body: {'isAvailable': available});
  }

  /// GET /deliveries/available — courses libres à proximité.
  Future<List<DeliveryRequest>> fetchAvailable({int limit = 20}) async {
    final data = await api.get('/deliveries/available', query: {'limit': limit});
    final rows = (data as List?)?.whereType<Map>() ?? const <Map>[];
    return rows.map(requestFromDelivery).toList();
  }

  /// GET /drivers/me/deliveries — mes courses (assignées / terminées).
  Future<List<Map>> fetchMyDeliveries() async {
    final data = await api.get('/drivers/me/deliveries');
    return (data as List?)?.whereType<Map>().toList() ?? const <Map>[];
  }

  /// POST /deliveries/:id/accept — prend la course (status → ACCEPTED, commande → ASSIGNED).
  Future<void> accept(String id) async {
    await api.post('/deliveries/$id/accept');
  }

  /// POST /deliveries/:id/start — démarre la livraison (émet order.tracking IN_TRANSIT).
  Future<void> start(String id) async {
    await api.post('/deliveries/$id/start');
  }

  /// POST /deliveries/:id/complete — clôture (émet order.tracking DELIVERED).
  Future<void> complete(String id) async {
    await api.post('/deliveries/$id/complete');
  }

  /// POST /deliveries/:id/location — remonte la position GPS du livreur (optionnel).
  Future<void> sendLocation(String id, double lat, double lng) async {
    await api.post('/deliveries/$id/location', body: {'lat': lat, 'lng': lng});
  }
}

final driverApi = DriverApi();
