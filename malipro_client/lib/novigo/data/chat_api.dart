import 'api_client.dart';
import 'session.dart';
import 'notifications_api.dart' show relativeTime;

/// Conversation live (Nest, schéma ops). Le titre est dérivé côté client
/// (les participants ne portent pas encore de nom d'affichage dans l'API chat).
class ConversationDto {
  final String id;
  final String title;
  final String lastMessage;
  final String time;
  final int unread;
  const ConversationDto({
    required this.id,
    required this.title,
    required this.lastMessage,
    required this.time,
    this.unread = 0,
  });

  factory ConversationDto.fromJson(Map j) {
    final orderId = (j['orderId'] ?? '').toString();
    final title = orderId.isNotEmpty
        ? 'Commande ${orderId.length > 6 ? orderId.substring(0, 6) : orderId}'
        : 'Support NOVIGO';
    final updated = DateTime.tryParse((j['updatedAt'] ?? '').toString())?.toLocal();
    return ConversationDto(
      id: (j['id'] ?? '').toString(),
      title: title,
      lastMessage: (j['lastMessagePreview'] ?? 'Démarrez la conversation').toString(),
      time: relativeTime(updated),
    );
  }
}

/// Message live. `mine` calculé depuis l'expéditeur vs. l'utilisateur en session.
class MessageDto {
  final String text;
  final bool mine;
  final String time;
  const MessageDto(this.text, this.mine, this.time);

  factory MessageDto.fromJson(Map j) {
    final senderId = (j['senderId'] ?? '').toString();
    final created = DateTime.tryParse((j['createdAt'] ?? '').toString())?.toLocal();
    final hh = created?.hour.toString().padLeft(2, '0') ?? '';
    final mm = created?.minute.toString().padLeft(2, '0') ?? '';
    return MessageDto(
      (j['body'] ?? '').toString(),
      senderId.isNotEmpty && senderId == session.userId,
      created != null ? '$hh:$mm' : 'maintenant',
    );
  }
}

/// Accès live au chat via le Gateway. Best-effort : lève en cas d'échec,
/// l'écran retombe alors sur le contenu mock.
class ChatApi {
  Future<List<ConversationDto>> conversations() async {
    await session.ensureAuth();
    final data = await api.get('/chat/conversations');
    final list = (data is List) ? data : const [];
    return list.whereType<Map>().map((e) => ConversationDto.fromJson(e)).toList();
  }

  Future<List<MessageDto>> messages(String conversationId) async {
    await session.ensureAuth();
    final data = await api.get('/chat/conversations/$conversationId/messages');
    final list = (data is List) ? data : const [];
    // Le backend renvoie du plus récent au plus ancien selon la page ; on trie
    // par createdAt croissant pour un fil chronologique.
    final msgs = list.whereType<Map>().toList()
      ..sort((a, b) => (a['createdAt'] ?? '').toString().compareTo((b['createdAt'] ?? '').toString()));
    return msgs.map((e) => MessageDto.fromJson(e)).toList();
  }

  Future<MessageDto> send(String conversationId, String body) async {
    await session.ensureAuth();
    final data = await api.post('/chat/conversations/$conversationId/messages', body: {'body': body});
    if (data is Map) return MessageDto.fromJson(data);
    return MessageDto(body, true, 'maintenant');
  }
}

final chatApi = ChatApi();
