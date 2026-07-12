import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../application/stores_providers.dart';
import '../data/stores_repository.dart';

/// Liste des boutiques (vitrines) de la plateforme.
class StoresListScreen extends ConsumerWidget {
  const StoresListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(storesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Boutiques')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (stores) {
          if (stores.isEmpty) {
            return const Center(child: Text('Aucune boutique disponible.'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(storesProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: stores.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => StoreCard(store: stores[i]),
            ),
          );
        },
      ),
    );
  }
}

/// Carte boutique réutilisable (liste + carrousel d'accueil).
class StoreCard extends StatelessWidget {
  const StoreCard({super.key, required this.store, this.width});
  final Store store;
  final double? width;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => context.push('/stores/${store.id}'),
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.line),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 110,
              width: double.infinity,
              child: (store.coverUrl != null && store.coverUrl!.isNotEmpty)
                  ? Image.network(store.coverUrl!, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: AppColors.line))
                  : Container(color: AppColors.line),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.line,
                    foregroundImage: (store.logoUrl != null && store.logoUrl!.isNotEmpty)
                        ? NetworkImage(store.logoUrl!)
                        : null,
                    child: (store.logoUrl == null || store.logoUrl!.isEmpty)
                        ? const Icon(Icons.storefront, size: 18, color: AppColors.muted)
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(store.name,
                            maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 2),
                        Row(children: [
                          if (store.category != null && store.category!.isNotEmpty)
                            Flexible(
                              child: Text(store.category!,
                                  maxLines: 1, overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                            ),
                          if (store.productCount != null) ...[
                            const Text(' · ', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                            Text('${store.productCount} produits',
                                style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                          ],
                        ]),
                      ],
                    ),
                  ),
                  if (store.rating > 0) ...[
                    const Icon(Icons.star, size: 15, color: AppColors.gold),
                    const SizedBox(width: 3),
                    Text(store.rating.toStringAsFixed(1),
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
