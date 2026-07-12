import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/services/realtime_service.dart';
import '../data/chat_repository.dart';

final chatRepositoryProvider =
    Provider<ChatRepository>((ref) => ChatRepository(ref.read(apiClientProvider)));

/// Service temps réel partagé, connecté une fois avec le token courant.
final realtimeServiceProvider = Provider<RealtimeService>((ref) {
  final service = RealtimeService();
  ref.onDispose(service.dispose);
  return service;
});

/// Connecte le socket (idempotent) en lisant le token stocké.
final realtimeConnectionProvider = FutureProvider<RealtimeService>((ref) async {
  final service = ref.watch(realtimeServiceProvider);
  final tokens = await ref.read(tokenStorageProvider).read();
  if (tokens != null) service.connect(tokens.accessToken);
  return service;
});

final refreshTickProvider = StateProvider<int>((ref) => 0);

final conversationsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(chatRepositoryProvider).conversations();
});
