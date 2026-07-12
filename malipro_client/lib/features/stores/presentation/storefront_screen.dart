import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/money.dart';
import '../../../core/theme.dart';
import '../../cart/application/cart_controller.dart';
import '../../cart/presentation/add_to_cart.dart';
import '../../catalog/data/catalog_repository.dart';
import '../application/stores_providers.dart';
import '../data/stores_repository.dart';

/// Vitrine d'une boutique : bannière + logo + infos + produits.
class StorefrontScreen extends ConsumerWidget {
  const StorefrontScreen({super.key, required this.storeId});
  final String storeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(storeDetailProvider(storeId));
    final count = ref.watch(cartControllerProvider).fold<int>(0, (s, l) => s + l.quantity);
    return Scaffold(
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (detail) => _Content(detail: detail),
      ),
      floatingActionButton: count == 0
          ? null
          : FloatingActionButton.extended(
              onPressed: () => context.push('/cart'),
              backgroundColor: AppColors.brand,
              icon: const Icon(Icons.shopping_cart, color: Colors.white),
              label: Text('Panier ($count)', style: const TextStyle(color: Colors.white)),
            ),
    );
  }
}

class _Content extends ConsumerWidget {
  const _Content({required this.detail});
  final StoreDetail detail;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = detail.store;
    return CustomScrollView(
      slivers: [
        // ── Bannière + bouton retour ──────────────────────────────
        SliverAppBar(
          expandedHeight: 190,
          pinned: true,
          backgroundColor: AppColors.brandDark,
          foregroundColor: Colors.white,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                if (s.coverUrl != null && s.coverUrl!.isNotEmpty)
                  Image.network(s.coverUrl!, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: AppColors.brandDark))
                else
                  Container(color: AppColors.brandDark),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter, end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Colors.black54],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        // ── En-tête : logo + nom + rating ─────────────────────────
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColors.line,
                  foregroundImage: (s.logoUrl != null && s.logoUrl!.isNotEmpty)
                      ? NetworkImage(s.logoUrl!)
                      : null,
                  child: (s.logoUrl == null || s.logoUrl!.isEmpty)
                      ? const Icon(Icons.storefront, color: AppColors.muted)
                      : null,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.name,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Row(children: [
                        if (s.category != null && s.category!.isNotEmpty) ...[
                          Text(s.category!, style: const TextStyle(color: AppColors.muted)),
                          const SizedBox(width: 8),
                        ],
                        if (s.rating > 0) ...[
                          const Icon(Icons.star, size: 15, color: AppColors.gold),
                          const SizedBox(width: 3),
                          Text(s.rating.toStringAsFixed(1),
                              style: const TextStyle(fontWeight: FontWeight.w600)),
                        ],
                        const SizedBox(width: 8),
                        _OpenBadge(isOpen: s.isOpen),
                      ]),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Text('Produits (${detail.products.length})',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          ),
        ),
        // ── Grille produits ───────────────────────────────────────
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 90),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 230,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.72,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, i) => _ProductCard(product: detail.products[i]),
              childCount: detail.products.length,
            ),
          ),
        ),
      ],
    );
  }
}

class _OpenBadge extends StatelessWidget {
  const _OpenBadge({required this.isOpen});
  final bool isOpen;
  @override
  Widget build(BuildContext context) {
    final c = isOpen ? AppColors.success : AppColors.error;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: c.withValues(alpha: 0.4)),
      ),
      child: Text(isOpen ? 'Ouvert' : 'Fermé',
          style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

class _ProductCard extends ConsumerWidget {
  const _ProductCard({required this.product});
  final Product product;

  IconData get _fallback => switch (product.category) {
        'GROCERY' => Icons.shopping_basket,
        'PHARMACY' => Icons.medical_services,
        'SHOP' => Icons.storefront,
        _ => Icons.restaurant,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placeholder = Container(
      color: AppColors.line,
      alignment: Alignment.center,
      child: Icon(_fallback, color: AppColors.muted, size: 32),
    );
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Stack(fit: StackFit.expand, children: [
              product.imageUrl == null
                  ? placeholder
                  : Image.network(product.imageUrl!, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => placeholder,
                      loadingBuilder: (c, w, p) => p == null ? w : placeholder),
              if (product.hasPromo)
                Positioned(
                  left: 6, top: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(6)),
                    child: Text('-${product.promoPercent}%',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11)),
                  ),
                ),
              if (product.images.length > 1)
                Positioned(
                  right: 6, top: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(6)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.photo_library, size: 10, color: Colors.white),
                      const SizedBox(width: 3),
                      Text('${product.images.length}',
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                    ]),
                  ),
                ),
              if (product.isOut)
                Container(
                  color: Colors.black.withValues(alpha: 0.45),
                  alignment: Alignment.center,
                  child: const Text('Rupture',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                ),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(product.name,
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(formatMoney(product.finalPrice),
                            style: const TextStyle(
                                color: AppColors.brandDark, fontWeight: FontWeight.w700, fontSize: 13)),
                        if (product.hasPromo)
                          Text(formatMoney(product.price),
                              style: const TextStyle(
                                  color: AppColors.muted, fontSize: 10,
                                  decoration: TextDecoration.lineThrough)),
                      ]),
                    ),
                    InkWell(
                      onTap: product.isOut ? null : () => addToCart(context, ref, product),
                      borderRadius: BorderRadius.circular(999),
                      child: CircleAvatar(
                        radius: 15,
                        backgroundColor: product.isOut ? AppColors.muted : AppColors.brand,
                        child: const Icon(Icons.add, size: 18, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
