import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../data/services_repository.dart';

final servicesRepositoryProvider =
    Provider<ServicesRepository>((ref) => ServicesRepository(ref.read(apiClientProvider)));

/// Terme de recherche pour la liste des artisans.
final artisanSearchProvider = StateProvider<String>((ref) => '');

/// Incrémenter pour recharger la liste des demandes.
final quotationsTickProvider = StateProvider<int>((ref) => 0);

final artisansProvider = FutureProvider.autoDispose<List<Artisan>>((ref) {
  final search = ref.watch(artisanSearchProvider);
  return ref.read(servicesRepositoryProvider).listArtisans(search: search);
});

final artisanDetailProvider =
    FutureProvider.autoDispose.family<ArtisanDetail, String>((ref, id) {
  return ref.read(servicesRepositoryProvider).artisanDetail(id);
});

final myQuotationsProvider = FutureProvider.autoDispose<List<Quotation>>((ref) {
  ref.watch(quotationsTickProvider);
  return ref.read(servicesRepositoryProvider).myQuotations();
});
