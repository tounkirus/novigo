import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../data/catalog_repository.dart';

final catalogRepositoryProvider =
    Provider<CatalogRepository>((ref) => CatalogRepository(ref.read(apiClientProvider)));

/// Recherche texte partagée (barre de recherche du catalogue).
final catalogSearchProvider = StateProvider<String>((ref) => '');

/// Catégorie active (FOOD | GROCERY | PHARMACY | SHOP) posée par une tuile
/// de l'accueil. Vide = toutes catégories.
final catalogCategoryProvider = StateProvider<String>((ref) => '');

final productsProvider = FutureProvider.autoDispose<List<Product>>((ref) {
  final search = ref.watch(catalogSearchProvider);
  final category = ref.watch(catalogCategoryProvider);
  return ref.read(catalogRepositoryProvider).list(
        search: search.isEmpty ? null : search,
        category: category.isEmpty ? null : category,
      );
});
