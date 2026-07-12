import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/theme.dart';
import '../../cart/presentation/add_to_cart.dart';
import '../application/catalog_providers.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key});
  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: ref.read(catalogSearchProvider));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Synchronise le champ si la recherche est posée ailleurs (tuile d'accueil).
    ref.listen<String>(catalogSearchProvider, (_, next) {
      if (_ctrl.text != next) _ctrl.text = next;
    });
    final async = ref.watch(productsProvider);
    final category = ref.watch(catalogCategoryProvider);
    final scheme = Theme.of(context).colorScheme;
    const catLabels = {
      'FOOD': 'Restaurants', 'GROCERY': 'Marché', 'PHARMACY': 'Pharmacie', 'SHOP': 'Boutiques',
    };

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            controller: _ctrl,
            onChanged: (v) => ref.read(catalogSearchProvider.notifier).state = v,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Rechercher un produit…',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _ctrl.text.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () {
                        _ctrl.clear();
                        ref.read(catalogSearchProvider.notifier).state = '';
                      },
                    ),
            ),
          ),
        ),
        if (category.isNotEmpty)
          Align(
            alignment: Alignment.centerLeft,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
              child: InputChip(
                label: Text(catLabels[category] ?? category),
                avatar: const Icon(Icons.filter_list, size: 18),
                onDeleted: () => ref.read(catalogCategoryProvider.notifier).state = '',
              ),
            ),
          ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Erreur : $e')),
            data: (products) {
              if (products.isEmpty) {
                final q = category.isNotEmpty ? (catLabels[category] ?? category) : _ctrl.text;
                return Center(
                  child: Text('Aucun produit pour « $q »',
                      style: TextStyle(color: scheme.onSurfaceVariant)),
                );
              }
              return RefreshIndicator(
                onRefresh: () async => ref.refresh(productsProvider.future),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: products.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final p = products[i];
                    return SectionCard(
                      child: Row(
                        children: [
                          _Thumb(url: p.imageUrl, category: p.category),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                if (p.description != null)
                                  Text(p.description!, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                const SizedBox(height: 4),
                                Row(children: [
                                  Text(formatMoney(p.finalPrice),
                                      style: const TextStyle(color: AppColors.brandDark, fontWeight: FontWeight.w600)),
                                  if (p.hasPromo) ...[
                                    const SizedBox(width: 6),
                                    Text(formatMoney(p.price),
                                        style: const TextStyle(
                                            color: AppColors.muted, fontSize: 11,
                                            decoration: TextDecoration.lineThrough)),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                      decoration: BoxDecoration(
                                          color: AppColors.error, borderRadius: BorderRadius.circular(4)),
                                      child: Text('-${p.promoPercent}%',
                                          style: const TextStyle(
                                              color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
                                    ),
                                  ],
                                ]),
                              ],
                            ),
                          ),
                          FilledButton(
                            onPressed: () => addToCart(context, ref, p),
                            style: FilledButton.styleFrom(minimumSize: const Size(88, 40)),
                            child: Text(p.hasOptions ? 'Choisir' : 'Ajouter'),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// Vignette produit : photo réseau avec fallback icône par catégorie.
class _Thumb extends StatelessWidget {
  const _Thumb({required this.url, required this.category});
  final String? url;
  final String? category;

  IconData get _fallbackIcon => switch (category) {
        'GROCERY' => Icons.shopping_basket,
        'PHARMACY' => Icons.medical_services,
        'SHOP' => Icons.storefront,
        _ => Icons.restaurant,
      };

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final placeholder = Container(
      width: 56,
      height: 56,
      color: scheme.surfaceContainerHighest,
      child: Icon(_fallbackIcon, color: scheme.onSurfaceVariant, size: 24),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: url == null
          ? placeholder
          : Image.network(
              url!,
              width: 56,
              height: 56,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => placeholder,
              loadingBuilder: (ctx, child, progress) =>
                  progress == null ? child : placeholder,
            ),
    );
  }
}
