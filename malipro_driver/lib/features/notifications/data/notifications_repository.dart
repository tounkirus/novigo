import '../../../core/api/api_client.dart';

class NotificationsRepository {
  NotificationsRepository(this._api);
  final ApiClient _api;

  /// Enregistre le token d'appareil (FCM/APNs) pour les push réels.
  Future<void> registerDevice(String token, String platform) async {
    await _api.post('/users/me/devices', body: {
      'token': token,
      'platform': platform,
    });
  }

  Future<void> removeDevice(String token) async {
    await _api.delete('/users/me/devices/$token');
  }

  Future<List<Map<String, dynamic>>> list({int page = 1}) async {
    final env = await _api.getEnvelope('/notifications',
        query: {'page': page, 'limit': 30});
    return (env['data'] as List).cast<Map<String, dynamic>>();
  }

  Future<int> unreadCount() async {
    final data = await _api.get('/notifications/unread-count');
    if (data is Map && data['count'] is num) return (data['count'] as num).toInt();
    if (data is num) return data.toInt();
    return 0;
  }

  Future<void> markRead(String id) async {
    await _api.post('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _api.post('/notifications/read-all');
  }
}
