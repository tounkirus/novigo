import '../../../core/api/api_client.dart';

/// Accès aux endpoints artisan du contrat MALIPRO (préfixe /artisans/me).
class ArtisanRepository {
  ArtisanRepository(this._api);
  final ApiClient _api;

  // --- Profil ----------------------------------------------------------------
  Future<Map<String, dynamic>> me() async =>
      await _api.get('/artisans/me') as Map<String, dynamic>;

  Future<Map<String, dynamic>> updateProfile(
      {String? profession, String? bio, String? serviceArea}) async {
    return await _api.patch('/artisans/me', body: {
      if (profession != null) 'profession': profession,
      if (bio != null) 'bio': bio,
      if (serviceArea != null) 'serviceArea': serviceArea,
    }) as Map<String, dynamic>;
  }

  /// Onboarding : crée/complète le profil (POST /artisans/me).
  Future<Map<String, dynamic>> completeProfile(
      {required String profession, String? bio, String? serviceArea}) async {
    return await _api.post('/artisans/me', body: {
      'profession': profession,
      if (bio != null && bio.isNotEmpty) 'bio': bio,
      if (serviceArea != null && serviceArea.isNotEmpty) 'serviceArea': serviceArea,
    }) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> earnings() async =>
      await _api.get('/artisans/me/earnings') as Map<String, dynamic>;

  // --- Services --------------------------------------------------------------
  Future<List<Map<String, dynamic>>> listServices() async {
    final data = await _api.get('/artisans/me/services');
    return (data as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createService(
      String title, String? description, int price, int? durationMinutes) async {
    return await _api.post('/artisans/me/services', body: {
      'title': title,
      if (description != null && description.isNotEmpty) 'description': description,
      'price': price,
      if (durationMinutes != null) 'durationMinutes': durationMinutes,
    }) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateService(String serviceId, String title,
      String? description, int price, int? durationMinutes) async {
    return await _api.patch('/artisans/me/services/$serviceId', body: {
      'title': title,
      if (description != null) 'description': description,
      'price': price,
      if (durationMinutes != null) 'durationMinutes': durationMinutes,
    }) as Map<String, dynamic>;
  }

  Future<void> deleteService(String serviceId) async {
    await _api.delete('/artisans/me/services/$serviceId');
  }

  // --- Devis -----------------------------------------------------------------
  Future<List<Map<String, dynamic>>> listQuotations() async {
    final env = await _api.getEnvelope('/artisans/me/quotations',
        query: {'page': 1, 'limit': 100});
    return (env['data'] as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createQuotation(
      String customerId, String description, int amount) async {
    return await _api.post('/artisans/me/quotations', body: {
      'customerId': customerId,
      'description': description,
      'amount': amount,
    }) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateQuotationStatus(
      String quotationId, String status, {int? amount}) async {
    return await _api.patch('/artisans/me/quotations/$quotationId', body: {
      'status': status,
      if (amount != null) 'amount': amount,
    }) as Map<String, dynamic>;
  }
}
