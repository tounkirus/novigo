import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../data/merchant_repository.dart';

final merchantRepositoryProvider = Provider<MerchantRepository>(
    (ref) => MerchantRepository(ref.read(apiClientProvider)));

/// Compteur de rafraîchissement : incrémenter pour recharger les listes.
final refreshTickProvider = StateProvider<int>((ref) => 0);

final merchantProfileProvider = FutureProvider<Map<String, dynamic>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(merchantRepositoryProvider).me();
});

final storesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(merchantRepositoryProvider).listStores();
});

final productsProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((ref, storeId) {
  ref.watch(refreshTickProvider);
  return ref.read(merchantRepositoryProvider).listProducts(storeId);
});

final reportsProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, storeId) {
  ref.watch(refreshTickProvider);
  return ref.read(merchantRepositoryProvider).reports(storeId);
});

/// Rubriques de menu d'une boutique.
final categoriesProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((ref, storeId) {
  ref.watch(refreshTickProvider);
  return ref.read(merchantRepositoryProvider).listCategories(storeId);
});

/// Wallet commerçant (solde à verser, split MoMo/espèces, ledger).
final merchantWalletProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(merchantRepositoryProvider).wallet();
});

/// Commandes entrantes des boutiques du commerçant (/merchants/me/orders).
final merchantOrdersProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(merchantRepositoryProvider).myOrders();
});

void bumpRefresh(WidgetRef ref) =>
    ref.read(refreshTickProvider.notifier).state++;
