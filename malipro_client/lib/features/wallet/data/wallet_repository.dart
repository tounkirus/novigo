import '../../../core/api/api_client.dart';

class WalletRepository {
  WalletRepository(this._api);
  final ApiClient _api;

  Future<Map<String, dynamic>> balance() async =>
      await _api.get('/wallet/balance') as Map<String, dynamic>;

  Future<Map<String, dynamic>> deposit(int amount, String method) async =>
      await _api.post('/wallet/deposit',
          body: {'amount': amount, 'method': method, 'phone': '+22370000000'}) as Map<String, dynamic>;

  Future<List<Map<String, dynamic>>> transactions() async {
    final env = await _api.getEnvelope('/wallet/transactions', query: {'limit': 30});
    return (env['data'] as List).cast<Map<String, dynamic>>();
  }
}
