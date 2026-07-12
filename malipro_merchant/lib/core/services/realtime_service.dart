import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config.dart';

/// Client temps réel Socket.IO (namespace /realtime du backend MALIPRO).
/// Auth JWT via handshake `auth.token`. Émet des flux pour les messages de chat,
/// la frappe et le suivi de commande.
class RealtimeService {
  io.Socket? _socket;

  final _messages = StreamController<Map<String, dynamic>>.broadcast();
  final _typing = StreamController<Map<String, dynamic>>.broadcast();
  final _tracking = StreamController<Map<String, dynamic>>.broadcast();
  final _notifications = StreamController<Map<String, dynamic>>.broadcast();
  final _orderEvents = StreamController<Map<String, dynamic>>.broadcast();
  final _connected = StreamController<bool>.broadcast();

  Stream<Map<String, dynamic>> get messages => _messages.stream;
  Stream<Map<String, dynamic>> get typing => _typing.stream;
  Stream<Map<String, dynamic>> get tracking => _tracking.stream;
  Stream<Map<String, dynamic>> get notifications => _notifications.stream;

  /// Nouvelles commandes + changements de statut poussés au commerçant
  /// (événements `order.new` et `order.updated`).
  Stream<Map<String, dynamic>> get orderEvents => _orderEvents.stream;
  Stream<bool> get connectionState => _connected.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// Le namespace /realtime est servi à la racine de l'API (hors /api/v1).
  static String get _origin {
    const b = AppConfig.apiBaseUrl;
    final i = b.indexOf('/api/');
    return i >= 0 ? b.substring(0, i) : b;
  }

  void connect(String accessToken) {
    if (_socket != null) return;
    final socket = io.io(
      '$_origin/realtime',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': accessToken})
          .build(),
    );
    socket.onConnect((_) => _connected.add(true));
    socket.onDisconnect((_) => _connected.add(false));
    socket.on('chat.message', (data) {
      if (data is Map) _messages.add(Map<String, dynamic>.from(data));
    });
    socket.on('chat.typing', (data) {
      if (data is Map) _typing.add(Map<String, dynamic>.from(data));
    });
    socket.on('order.tracking', (data) {
      if (data is Map) _tracking.add(Map<String, dynamic>.from(data));
    });
    socket.on('notification.push', (data) {
      if (data is Map) _notifications.add(Map<String, dynamic>.from(data));
    });
    socket.on('order.new', (data) {
      if (data is Map) _orderEvents.add({...Map<String, dynamic>.from(data), 'event': 'new'});
    });
    socket.on('order.updated', (data) {
      if (data is Map) _orderEvents.add({...Map<String, dynamic>.from(data), 'event': 'updated'});
    });
    socket.connect();
    _socket = socket;
  }

  void joinConversation(String conversationId) {
    _socket?.emit('conversation:join', conversationId);
  }

  void subscribeOrder(String orderId) {
    _socket?.emit('order:subscribe', orderId);
  }

  void sendTyping(String conversationId, bool isTyping) {
    _socket?.emit('chat:typing', {
      'conversationId': conversationId,
      'isTyping': isTyping,
    });
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
    _messages.close();
    _typing.close();
    _tracking.close();
    _notifications.close();
    _orderEvents.close();
    _connected.close();
  }
}
