import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../data/orders_repository.dart';

final ordersRepositoryProvider =
    Provider<OrdersRepository>((ref) => OrdersRepository(ref.read(apiClientProvider)));

final myOrdersProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  return ref.read(ordersRepositoryProvider).mine();
});

final orderDetailProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) {
  return ref.read(ordersRepositoryProvider).get(id);
});

final orderTrackingProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) {
  return ref.read(ordersRepositoryProvider).tracking(id);
});
