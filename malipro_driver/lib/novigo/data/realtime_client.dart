import 'package:socket_io_client/socket_io_client.dart' as io;
import 'env.dart';
import 'session.dart';

/// Client temps réel Socket.IO vers le Gateway (namespace /realtime de Nest).
/// Le livreur rejoint automatiquement sa room `user:<id>` (côté serveur) au
/// handshake et reçoit les notifications `notification.push` (nouvelles courses,
/// affectations). Best-effort : silencieux si non-live ou si la connexion échoue.
class RealtimeClient {
  io.Socket? _socket;

  void connectDriver({required void Function(Map data) onNotification}) {
    if (!NovigoEnv.live || _socket != null) return;
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
      socket.on('notification.push', (d) {
        if (d is Map) onNotification(d);
      });
    } catch (_) {
      // best-effort : l'UI garde son fonctionnement mock
    }
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}

final realtime = RealtimeClient();
