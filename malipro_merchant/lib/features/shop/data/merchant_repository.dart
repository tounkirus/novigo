import '../../../core/api/api_client.dart';

/// Accès aux endpoints marchand du contrat MALIPRO.
class MerchantRepository {
  MerchantRepository(this._api);
  final ApiClient _api;

  // --- Profil ----------------------------------------------------------------
  Future<Map<String, dynamic>> me() async =>
      await _api.get('/merchants/me') as Map<String, dynamic>;

  /// Onboarding : crée/complète le profil (POST /merchants/me).
  Future<Map<String, dynamic>> completeProfile(
      {required String businessName, String? category}) async {
    return await _api.post('/merchants/me', body: {
      'businessName': businessName,
      if (category != null && category.isNotEmpty) 'category': category,
    }) as Map<String, dynamic>;
  }

  // --- Boutiques -------------------------------------------------------------
  Future<List<Map<String, dynamic>>> listStores() async {
    final data = await _api.get('/merchants/me/stores');
    return (data as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createStore(String name, String category) async {
    return await _api.post('/merchants/me/stores',
        body: {'name': name, 'category': category}) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateStore(
      String storeId, Map<String, dynamic> patch) async {
    return await _api.patch('/merchants/stores/$storeId', body: patch)
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> reports(String storeId) async {
    return await _api.get('/merchants/stores/$storeId/reports')
        as Map<String, dynamic>;
  }

  // --- Commandes entrantes ---------------------------------------------------
  Future<List<Map<String, dynamic>>> myOrders({String? status}) async {
    final env = await _api.getEnvelope('/merchants/me/orders', query: {
      'page': 1,
      'limit': 50,
      if (status != null && status.isNotEmpty) 'status': status,
    });
    return (env['data'] as List).cast<Map<String, dynamic>>();
  }

  /// Actions sur une commande : accept | refuse | preparing | ready.
  Future<Map<String, dynamic>> orderAction(String orderId, String action,
      {String? reason}) async {
    return await _api.post('/merchants/orders/$orderId/$action',
        body: reason != null ? {'reason': reason} : null) as Map<String, dynamic>;
  }

  // --- Produits --------------------------------------------------------------
  Future<List<Map<String, dynamic>>> listProducts(String storeId) async {
    final env = await _api.getEnvelope('/merchants/stores/$storeId/products',
        query: {'page': 1, 'limit': 100});
    return (env['data'] as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createProduct(
      String storeId, Map<String, dynamic> body) async {
    return await _api.post('/merchants/stores/$storeId/products', body: body)
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProduct(
      String productId, Map<String, dynamic> body) async {
    return await _api.patch('/merchants/products/$productId', body: body)
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> duplicateProduct(String productId) async {
    return await _api.post('/merchants/products/$productId/duplicate')
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> setInventory(
      String productId, int stockQuantity) async {
    return await _api.patch('/merchants/products/$productId/inventory',
        body: {'stockQuantity': stockQuantity}) as Map<String, dynamic>;
  }

  Future<void> deleteProduct(String productId) async {
    await _api.delete('/merchants/products/$productId');
  }

  // --- Rubriques de menu -----------------------------------------------------
  Future<List<Map<String, dynamic>>> listCategories(String storeId) async {
    final data = await _api.get('/merchants/stores/$storeId/categories');
    return (data as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createCategory(String storeId, String name) async {
    return await _api.post('/merchants/stores/$storeId/categories',
        body: {'name': name}) as Map<String, dynamic>;
  }

  Future<void> deleteCategory(String categoryId) async {
    await _api.delete('/merchants/categories/$categoryId');
  }

  // --- Wallet commerçant -----------------------------------------------------
  Future<Map<String, dynamic>> wallet() async =>
      await _api.get('/merchants/me/wallet') as Map<String, dynamic>;

  Future<Map<String, dynamic>> payout(int amount, String method) async {
    return await _api.post('/merchants/me/wallet/payout',
        body: {'amount': amount, 'method': method}) as Map<String, dynamic>;
  }

  // --- Options & suppléments -------------------------------------------------
  Future<Map<String, dynamic>> createOptionGroup(
      String productId, Map<String, dynamic> body) async {
    return await _api.post('/merchants/products/$productId/option-groups', body: body)
        as Map<String, dynamic>;
  }

  Future<void> deleteOptionGroup(String groupId) async {
    await _api.delete('/merchants/option-groups/$groupId');
  }
}
