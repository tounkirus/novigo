import 'api_client.dart';
import 'session.dart';

/// Notification remontée du backend (Nest, schéma ops).
/// `type` reste la chaîne brute backend (ORDER_*, PROMO_*, WALLET_*, …) ;
/// l'écran la mappe vers son enum visuel.
class NotifItem {
  final String id;
  final String type;
  final String title;
  final String body;
  final bool unread;
  final DateTime? createdAt;
  const NotifItem({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.unread,
    this.createdAt,
  });

  factory NotifItem.fromJson(Map j) => NotifItem(
        id: (j['id'] ?? '').toString(),
        type: (j['type'] ?? 'SYSTEM').toString(),
        title: (j['title'] ?? '').toString(),
        body: (j['body'] ?? '').toString(),
        unread: j['read'] == false,
        createdAt: DateTime.tryParse((j['createdAt'] ?? '').toString())?.toLocal(),
      );
}

/// Accès live aux notifications via le Gateway. Best-effort : lève en cas d'échec,
/// l'écran retombe alors sur le contenu mock.
class NotificationsApi {
  Future<List<NotifItem>> fetch({int limit = 30}) async {
    await session.ensureAuth();
    final data = await api.get('/notifications', query: {'limit': limit});
    final list = (data is List) ? data : const [];
    return list.whereType<Map>().map((e) => NotifItem.fromJson(e)).toList();
  }

  Future<int> unreadCount() async {
    await session.ensureAuth();
    final data = await api.get('/notifications/unread-count');
    if (data is Map && data['count'] != null) {
      return int.tryParse(data['count'].toString()) ?? 0;
    }
    return 0;
  }

  Future<void> markAllRead() async {
    await session.ensureAuth();
    await api.post('/notifications/read-all');
  }
}

final notificationsApi = NotificationsApi();

/// Étiquette d'horodatage relatif en français (« il y a 5 min », « Hier · 20:14 »).
String relativeTime(DateTime? dt) {
  if (dt == null) return '';
  final now = DateTime.now();
  final diff = now.difference(dt);
  if (diff.inMinutes < 1) return "à l'instant";
  if (diff.inMinutes < 60) return 'il y a ${diff.inMinutes} min';
  if (diff.inHours < 24 && now.day == dt.day) {
    return 'il y a ${diff.inHours} h';
  }
  final hh = dt.hour.toString().padLeft(2, '0');
  final mm = dt.minute.toString().padLeft(2, '0');
  if (diff.inDays < 2) return 'Hier · $hh:$mm';
  if (diff.inDays < 7) {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return '${days[dt.weekday - 1]} · $hh:$mm';
  }
  return '${dt.day}/${dt.month} · $hh:$mm';
}
