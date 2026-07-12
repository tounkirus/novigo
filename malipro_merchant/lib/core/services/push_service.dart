import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../../features/notifications/data/notifications_repository.dart';

/// Notifications push réelles via **FCM**. Récupère le token d'appareil et
/// l'enregistre auprès du backend (`POST /users/me/devices`) ; le backend pousse
/// alors via Firebase (`PUSH_PROVIDER=fcm` + `FCM_SERVER_KEY`).
///
/// Sans projet Firebase configuré (pas de `google-services.json` / options web),
/// l'initialisation échoue proprement (no-op) : le canal temps réel Socket.IO
/// (`notification.push`) assure les notifications in-app.
class PushService {
  PushService(this._repo);
  final NotificationsRepository _repo;

  String? _token;
  String? get token => _token;

  Future<void> initFcm({void Function(RemoteMessage)? onForeground}) async {
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      final t = await messaging.getToken();
      if (t != null) {
        _token = t;
        await _repo.registerDevice(t, _platform);
      }
      messaging.onTokenRefresh.listen((nt) {
        _token = nt;
        _repo.registerDevice(nt, _platform).ignore();
      });
      if (onForeground != null) {
        FirebaseMessaging.onMessage.listen(onForeground);
      }
    } catch (e) {
      debugPrint('FCM non initialisé (projet Firebase absent) : $e');
    }
  }

  String get _platform {
    if (kIsWeb) return 'web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'ios';
      case TargetPlatform.android:
        return 'android';
      default:
        return 'other';
    }
  }
}
