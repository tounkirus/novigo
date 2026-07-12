import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/services/push_service.dart';
import '../../chat/application/chat_providers.dart';
import '../data/notifications_repository.dart';

final notificationsRepositoryProvider = Provider<NotificationsRepository>(
  (ref) => NotificationsRepository(ref.read(apiClientProvider)),
);

final pushServiceProvider = Provider<PushService>(
  (ref) => PushService(ref.read(notificationsRepositoryProvider)),
);

/// Rafraîchi manuellement (après lecture) pour recharger badge + liste.
final notificationsTickProvider = StateProvider<int>((ref) => 0);

final unreadCountProvider = FutureProvider<int>((ref) {
  ref.watch(notificationsTickProvider);
  return ref.read(notificationsRepositoryProvider).unreadCount();
});

final notificationsListProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(notificationsTickProvider);
  return ref.read(notificationsRepositoryProvider).list();
});

/// Initialise le canal push : ouvre le socket temps réel (qui émet
/// `notification.push`) et enregistre le token d'appareil FCM auprès du backend.
final pushBootstrapProvider = FutureProvider<void>((ref) async {
  await ref.watch(realtimeConnectionProvider.future);
  await ref.read(pushServiceProvider).initFcm();
});
