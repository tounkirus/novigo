import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'env.dart';
import 'session.dart';

/// Client temps réel Socket.IO vers le Gateway (namespace /realtime de Nest).
/// L'artisan est placé par le serveur dans sa room utilisateur au handshake ; il
/// y reçoit `voice.dispatch` (annonce vocale d'une mission qui lui est attribuée).
class NovigoRealtime {
  io.Socket? _socket;

  void connect({required void Function(Map data) onVoice}) {
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
      socket.on('voice.dispatch', (d) {
        if (d is Map) onVoice(d);
      });
    } catch (e) {
      debugPrint('[Artisan] temps réel indisponible: $e');
    }
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}

final novigoRealtime = NovigoRealtime();
