import '../../../core/api/api_client.dart';
import '../../cart/application/cart_controller.dart';

class OrdersRepository {
  OrdersRepository(this._api);
  final ApiClient _api;

  Future<Map<String, dynamic>> create({
    required List<CartLine> lines,
    required String line1,
    required String city,
    String? district,
    required String paymentMethod,
  }) async {
    final data = await _api.post('/orders', body: {
      'type': 'FOOD',
      'items': lines
          .map((l) => {
                'productId': l.product.id,
                'quantity': l.quantity,
                if (l.choiceIds.isNotEmpty) 'choiceIds': l.choiceIds,
              })
          .toList(),
      'deliveryAddress': {'line1': line1, 'city': city, if (district != null) 'district': district},
      'paymentMethod': paymentMethod,
    });
    return data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> payWithWallet(String orderId) async {
    final data = await _api.post('/payments/wallet', body: {'orderId': orderId});
    return data as Map<String, dynamic>;
  }

  /// Initie un paiement Mobile Money (Orange Money / Wave). Le paiement reste
  /// PENDING jusqu'à confirmation par l'opérateur (webhook) ; renvoie l'instruction.
  Future<Map<String, dynamic>> payMobileMoney(
      String orderId, String method, String phone) async {
    final data = await _api.post('/payments/mobile-money',
        body: {'orderId': orderId, 'method': method, 'phone': phone});
    return data as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> mine({int page = 1}) async {
    final env = await _api.getEnvelope('/orders', query: {'page': page, 'limit': 20});
    return (env['data'] as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> get(String id) async =>
      await _api.get('/orders/$id') as Map<String, dynamic>;

  Future<Map<String, dynamic>> tracking(String id) async =>
      await _api.get('/orders/$id/tracking') as Map<String, dynamic>;
}
