import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../data/stores_repository.dart';

final storesRepositoryProvider =
    Provider<StoresRepository>((ref) => StoresRepository(ref.read(apiClientProvider)));

/// Liste des boutiques (vitrines).
final storesProvider =
    FutureProvider.autoDispose<List<Store>>((ref) => ref.read(storesRepositoryProvider).list());

/// Détail d'une boutique + ses produits.
final storeDetailProvider = FutureProvider.autoDispose
    .family<StoreDetail, String>((ref, id) => ref.read(storesRepositoryProvider).detail(id));
