import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../data/artisan_repository.dart';

final artisanRepositoryProvider = Provider<ArtisanRepository>(
    (ref) => ArtisanRepository(ref.read(apiClientProvider)));

/// Compteur de rafraîchissement : incrémenter pour recharger les données.
final refreshTickProvider = StateProvider<int>((ref) => 0);

final artisanProfileProvider = FutureProvider<Map<String, dynamic>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(artisanRepositoryProvider).me();
});

final servicesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(artisanRepositoryProvider).listServices();
});

final quotationsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(artisanRepositoryProvider).listQuotations();
});

final earningsProvider = FutureProvider<Map<String, dynamic>>((ref) {
  ref.watch(refreshTickProvider);
  return ref.read(artisanRepositoryProvider).earnings();
});

void bumpRefresh(WidgetRef ref) =>
    ref.read(refreshTickProvider.notifier).state++;
