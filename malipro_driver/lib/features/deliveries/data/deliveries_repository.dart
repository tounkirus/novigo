import '../../../core/api/api_client.dart';

/// Accès aux endpoints livraison/livreur du contrat MALIPRO.
class DeliveriesRepository {
  DeliveriesRepository(this._api);
  final ApiClient _api;

  // --- Profil livreur --------------------------------------------------------
  Future<Map<String, dynamic>> me() async =>
      await _api.get('/drivers/me') as Map<String, dynamic>;

  /// Onboarding : crée/complète le profil (POST /drivers/me).
  Future<Map<String, dynamic>> completeProfile(
      {String? vehicleType, String? plateNumber}) async {
    return await _api.post('/drivers/me', body: {
      if (vehicleType != null && vehicleType.isNotEmpty) 'vehicleType': vehicleType,
      if (plateNumber != null && plateNumber.isNotEmpty) 'plateNumber': plateNumber,
    }) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> setAvailability(bool isAvailable,
      {double? lat, double? lng}) async {
    final body = <String, dynamic>{'isAvailable': isAvailable};
    if (lat != null && lng != null) body['location'] = {'lat': lat, 'lng': lng};
    return await _api.patch('/drivers/me/availability', body: body)
        as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> myDeliveries() async {
    final data = await _api.get('/drivers/me/deliveries');
    return (data as List).cast<Map<String, dynamic>>();
  }

  // --- Courses ---------------------------------------------------------------
  Future<List<Map<String, dynamic>>> available() async {
    final data = await _api.get('/deliveries/available');
    return (data as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> get(String id) async =>
      await _api.get('/deliveries/$id') as Map<String, dynamic>;

  Future<Map<String, dynamic>> accept(String id) async =>
      await _api.post('/deliveries/$id/accept') as Map<String, dynamic>;

  Future<void> reject(String id) async =>
      await _api.post('/deliveries/$id/reject');

  Future<Map<String, dynamic>> start(String id) async =>
      await _api.post('/deliveries/$id/start') as Map<String, dynamic>;

  Future<Map<String, dynamic>> complete(String id) async =>
      await _api.post('/deliveries/$id/complete') as Map<String, dynamic>;

  Future<void> updateLocation(String id, double lat, double lng) async {
    await _api.post('/deliveries/$id/location', body: {'lat': lat, 'lng': lng});
  }

  Future<void> reportIssue(String id, String type, String description) async {
    await _api.post('/deliveries/$id/issues',
        body: {'type': type, 'description': description});
  }
}
