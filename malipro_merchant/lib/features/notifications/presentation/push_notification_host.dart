import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../chat/application/chat_providers.dart';
import '../application/notifications_providers.dart';

/// Hôte global des notifications push : démarre le canal push (socket + FCM) et
/// affiche une bannière in-app à chaque `notification.push` reçu du serveur.
///
/// À monter via le `builder` du MaterialApp pour disposer d'un ScaffoldMessenger.
class PushNotificationHost extends ConsumerStatefulWidget {
  const PushNotificationHost({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<PushNotificationHost> createState() =>
      _PushNotificationHostState();
}

class _PushNotificationHostState extends ConsumerState<PushNotificationHost> {
  StreamSubscription<Map<String, dynamic>>? _sub;

  @override
  void initState() {
    super.initState();
    // Démarre socket temps réel + enregistrement du token FCM.
    ref.read(pushBootstrapProvider);
    // S'abonne au flux notifications du service temps réel.
    final realtime = ref.read(realtimeServiceProvider);
    _sub = realtime.notifications.listen(_onPush);
  }

  void _onPush(Map<String, dynamic> data) {
    if (!mounted) return;
    final title = (data['title'] ?? data['type'] ?? 'Notification').toString();
    final body = (data['body'] ?? data['message'] ?? '').toString();
    // Recharge badge + liste.
    ref.read(notificationsTickProvider.notifier).state++;
    final messenger = ScaffoldMessenger.maybeOf(context);
    messenger
      ?..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              if (body.isNotEmpty) Text(body),
            ],
          ),
        ),
      );
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
