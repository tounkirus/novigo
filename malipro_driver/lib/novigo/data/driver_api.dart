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

/// Gains renvoyés par GET /drivers/me/earnings (calculés sur les courses terminées).
class DriverEarnings {
  final int today;
  final int todayCount;
  final int week;
  final int total;
  final int totalCount;
  const DriverEarnings({
    this.today = 0,
    this.todayCount = 0,
    this.week = 0,
    this.total = 0,
    this.totalCount = 0,
  });

  factory DriverEarnings.fromJson(Map j) => DriverEarnings(
        today: _amount(j['today']),
        todayCount: (j['todayCount'] as num?)?.toInt() ?? 0,
        week: _amount(j['week']),
        total: _amount(j['total']),
        totalCount: (j['totalCount'] as num?)?.toInt() ?? 0,
      );
}

String _whenLabel(dynamic raw) {
  final ts = DateTime.tryParse((raw ?? '').toString())?.toLocal();
  if (ts == null) return '';
  final d = DateTime.now().difference(ts);
  if (d.inMinutes < 1) return "À l'instant";
  if (d.inMinutes < 60) return 'Il y a ${d.inMinutes} min';
  if (d.inHours < 24) return 'Il y a ${d.inHours} h';
  if (d.inDays == 1) return 'Hier';
  return 'Il y a ${d.inDays} j';
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

int _amount(dynamic money) {
  if (money is Map) return ((money['amount'] as num?) ?? 0).round();
  if (money is num) return money.round();
  return 0;
}

String _initialsOf(String label) {
  final words = label.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
  if (words.isEmpty) return 'NV';
  if (words.length == 1) {
    final w = words.first;
    return (w.length >= 2 ? w.substring(0, 2) : w).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/// Mappe un DTO /deliveries/available vers le modèle de demande de course.
/// Tout vient du backend : commerce, client, articles, rémunération (= frais de
/// livraison de la commande). Rien n'est synthétisé — un champ absent reste vide
/// et l'écran masque la ligne correspondante.
DeliveryRequest requestFromDelivery(Map j) {
  final id = (j['id'] ?? '').toString();
  final orderId = (j['orderId'] ?? '').toString();
  final store = j['store'] is Map ? j['store'] as Map : null;

  final reference = (j['reference'] ?? '').toString();
  final storeName = (store?['name'] ?? '').toString().trim();
  final label = storeName.isNotEmpty
      ? storeName
      : (reference.isNotEmpty ? 'Commande $reference' : 'Course NOVIGO');

  final pickup = (store?['address'] ?? '').toString().trim();
  final drop = (j['dropoffAddress'] ?? '').toString().trim();
  final customer = (j['customerName'] ?? '').toString().trim();

  // Distance/ETA ne sont calculés qu'une fois la géoloc branchée (P4) : 0 = inconnu.
  final distanceMeters = (j['distanceMeters'] as num?)?.toDouble() ?? 0;
  final distanceKm = distanceMeters > 0 ? distanceMeters / 1000 : 0.0;
  final etaMinutes = (j['etaMinutes'] as num?)?.toInt() ?? 0;

  return DeliveryRequest(
    id: id,
    storeName: label,
    storeInitials: _initialsOf(storeName.isNotEmpty ? storeName : (reference.isNotEmpty ? reference : orderId)),
    storeAddress: pickup.isNotEmpty ? pickup : _fmtCoords(j['pickupLocation']),
    dropAddress: drop.isNotEmpty ? drop : _fmtCoords(j['dropoffLocation']),
    distanceKm: double.parse(distanceKm.toStringAsFixed(1)),
    payout: _amount(j['payout']),
    itemsCount: (j['itemsCount'] as num?)?.toInt() ?? 0,
    etaMin: etaMinutes,
    customerName: customer.isNotEmpty ? customer : 'Client NOVIGO',
    reference: reference.isNotEmpty ? reference : null,
    // Classement décidé par le Brain (Service Decision Engine) côté backend.
    brainScore: (j['brainScore'] as num?)?.round() ?? 0,
    brainReasons: ((j['brainReasons'] as List?) ?? const []).map((r) => r.toString()).toList(),
    recommended: j['recommended'] == true,
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

  /// GET /drivers/me/earnings — gains du jour / 7 jours / total.
  Future<DriverEarnings?> fetchEarnings() async {
    final data = await api.get('/drivers/me/earnings');
    return data is Map ? DriverEarnings.fromJson(data) : null;
  }

  /// GET /drivers/me/deliveries — mes courses (assignées / terminées).
  Future<List<Map>> fetchMyDeliveries() async {
    final data = await api.get('/drivers/me/deliveries');
    return (data as List?)?.whereType<Map>().toList() ?? const <Map>[];
  }

  /// Historique des courses terminées, prêt pour les écrans « Courses » et « Gains ».
  Future<List<PastDelivery>> fetchHistory() async {
    final rows = await fetchMyDeliveries();
    final done = rows.where((r) => (r['status'] ?? '').toString().toUpperCase() == 'COMPLETED');
    return done.map((r) {
      final ref = (r['reference'] ?? '').toString();
      final store = (r['storeName'] ?? '').toString().trim();
      return PastDelivery(
        id: ref.isNotEmpty ? ref : (r['id'] ?? '').toString(),
        storeName: store.isNotEmpty ? store : (ref.isNotEmpty ? 'Commande $ref' : 'Course NOVIGO'),
        when: _whenLabel(r['completedAt']),
        payout: _amount(r['payout']),
      );
    }).toList();
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
