import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models.dart';
import 'env.dart';
import 'session.dart';
import 'merchant_api.dart';

/// Client temps réel Socket.IO vers le Gateway (namespace /realtime de Nest).
/// À la connexion, le serveur place le marchand dans sa room utilisateur et y
/// pousse `order.new` (nouvelle commande) et `order.updated` (changement de statut).
/// Aucun `subscribe` requis. Best-effort : silencieux si non-live ou connexion KO.
class MerchantRealtime {
  io.Socket? _socket;

  void connectMerchant({
    required void Function(MOrder order) onNewOrder,
    void Function(String orderId, String status)? onOrderUpdated,
  }) {
    if (!NovigoEnv.live) return;
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
      socket.on('order.new', (d) {
        if (d is Map) onNewOrder(merchantOrderFromJson(d));
      });
      socket.on('order.updated', (d) {
        if (d is Map && onOrderUpdated != null) {
          final id = (d['orderId'] ?? d['id'] ?? '').toString();
          if (id.isNotEmpty) onOrderUpdated(id, statusFromBackend(d['status']?.toString()));
        }
      });
    } catch (e) {
      debugPrint('[Merchant] realtime indisponible: $e');
    }
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}
