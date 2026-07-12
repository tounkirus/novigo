import 'package:socket_io_client/socket_io_client.dart' as io;
import 'env.dart';
import 'session.dart';

/// Client temps réel Socket.IO vers le Gateway (namespace /realtime de Nest).
/// S'abonne à la room d'une commande et remonte order.tracking / order.updated.
/// Best-effort : silencieux si non-live ou si la connexion échoue.
class RealtimeClient {
  io.Socket? _socket;

  void trackOrder(
    String orderId, {
    required void Function(Map data) onTracking,
    void Function(Map data)? onUpdated,
  }) {
    if (!NovigoEnv.live || orderId.isEmpty) return;
    try {
      final socket = io.io(
        '${NovigoEnv.wsOrigin}/realtime',
        io.OptionBuilder()
            .setTransports(['websocket'])
            .setPath('/socket.io')
            .setAuth({'token': session.token})
            .enableForceNew()
            .build(),
      );
      _socket = socket;
      socket.onConnect((_) => socket.emit('order:subscribe', orderId));
      socket.on('order.tracking', (d) {
        if (d is Map) onTracking(d);
      });
      socket.on('order.updated', (d) {
        if (d is Map && onUpdated != null) onUpdated(d);
      });
    } catch (_) {
      // best-effort : l'UI garde son animation
    }
  }

  /// Rejoint la room d'une conversation et remonte les messages chat.message
  /// poussés par les autres participants. Best-effort : silencieux si non-live.
  void joinConversation(
    String conversationId, {
    required void Function(Map data) onMessage,
  }) {
    if (!NovigoEnv.live || conversationId.isEmpty) return;
    try {
      final socket = io.io(
        '${NovigoEnv.wsOrigin}/realtime',
        io.OptionBuilder()
            .setTransports(['websocket'])
            .setPath('/socket.io')
            .setAuth({'token': session.token})
            .enableForceNew()
            .build(),
      );
      _socket = socket;
      socket.onConnect((_) => socket.emit('conversation:join', conversationId));
      socket.on('chat.message', (d) {
        if (d is Map) onMessage(d);
      });
    } catch (_) {
      // best-effort : le fil reste utilisable en pull (envoi/rechargement)
    }
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}
