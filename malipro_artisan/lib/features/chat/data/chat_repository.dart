import '../../../core/api/api_client.dart';

class ChatRepository {
  ChatRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> conversations({int page = 1}) async {
    final env = await _api.getEnvelope('/chat/conversations',
        query: {'page': page, 'limit': 30});
    return (env['data'] as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createConversation(String participantId,
      {String? orderId}) async {
    return await _api.post('/chat/conversations', body: {
      'participantId': participantId,
      if (orderId != null) 'orderId': orderId,
    }) as Map<String, dynamic>;
  }

  /// Messages (les plus récents d'abord côté API) ; on renverse pour l'affichage.
  Future<List<Map<String, dynamic>>> messages(String conversationId,
      {int page = 1}) async {
    final env = await _api.getEnvelope(
        '/chat/conversations/$conversationId/messages',
        query: {'page': page, 'limit': 50});
    final list = (env['data'] as List).cast<Map<String, dynamic>>();
    return list.reversed.toList();
  }

  Future<Map<String, dynamic>> send(String conversationId, String body) async {
    return await _api.post('/chat/conversations/$conversationId/messages',
        body: {'body': body}) as Map<String, dynamic>;
  }
}
