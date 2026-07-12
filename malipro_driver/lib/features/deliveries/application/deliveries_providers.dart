import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../data/deliveries_repository.dart';

final deliveriesRepositoryProvider = Provider<DeliveriesRepository>(
    (ref) => DeliveriesRepository(ref.read(apiClientProvider)));

/// Compteur de rafraîchissement : incrémenter pour recharger les listes.
final refreshTickProvider = StateProvider<int>((ref) => 0);

final driverProfileProvider = FutureProvider<Map<String, dynamic>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(deliveriesRepositoryProvider).me();
});

final availableDeliveriesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(deliveriesRepositoryProvider).available();
});

final myDeliveriesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(deliveriesRepositoryProvider).myDeliveries();
});

final deliveryDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) {
  ref.watch(refreshTickProvider);
  return ref.read(deliveriesRepositoryProvider).get(id);
});

void bumpRefresh(WidgetRef ref) =>
    ref.read(refreshTickProvider.notifier).state++;
