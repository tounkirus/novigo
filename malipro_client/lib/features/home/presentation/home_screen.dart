import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/design/tokens.dart';
import '../../../core/design/components.dart';
import '../../auth/application/auth_controller.dart';
import '../../wallet/application/wallet_providers.dart';
import '../../catalog/application/catalog_providers.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../orders/application/orders_providers.dart';
import '../../stores/application/stores_providers.dart';
import '../../stores/presentation/stores_list_screen.dart';
import '../../../common/money.dart';

/// Accueil — le hub premium de l'app client.
/// En-tête personnalisé + solde wallet, recherche, catégories de services,
/// bannière promo et produits populaires (données réelles via l'API).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key, required this.onTab});

  /// Bascule vers un onglet du [HomeShell] (0=Accueil,1=Catalogue,2=Services,3=Commandes,4=Compte).
  final void Function(int index) onTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final name = (user?['firstName'] as String?)?.trim();
    final greeting = (name != null && name.isNotEmpty) ? 'Bonjour, $name' : 'Bonjour';

    // Pose le filtre catégorie du catalogue puis bascule sur l'onglet cible.
    void selectCategory(_CategoryItem c) {
      if (c.tab == 1) {
        ref.read(catalogSearchProvider.notifier).state = '';
        ref.read(catalogCategoryProvider.notifier).state = c.keyword;
      }
      onTab(c.tab);
    }

    void openSearch() {
      ref.read(catalogCategoryProvider.notifier).state = '';
      ref.read(catalogSearchProvider.notifier).state = '';
      onTab(1);
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(walletBalanceProvider);
        ref.invalidate(productsProvider);
        ref.invalidate(myOrdersProvider);
      },
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _Header(greeting: greeting, ref: ref),
          Padding(
            padding: const EdgeInsets.fromLTRB(MaliSpacing.md, MaliSpacing.lg, MaliSpacing.md, 0),
            child: _SearchBar(onTap: openSearch),
          ),
          const _ActiveOrderCard(),
          const SizedBox(height: MaliSpacing.lg),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: MaliSpacing.md),
            child: MaliSectionHeader(title: 'Que livrons-nous ?'),
          ),
          _Categories(onSelect: selectCategory),
          const SizedBox(height: MaliSpacing.lg),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: MaliSpacing.md),
            child: _PromoBanner(),
          ),
          const SizedBox(height: MaliSpacing.lg),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: MaliSpacing.md),
            child: MaliSectionHeader(
                title: 'Boutiques',
                actionLabel: 'Voir tout',
                onAction: () => context.push('/stores')),
          ),
          const _StoresCarousel(),
          const SizedBox(height: MaliSpacing.lg),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: MaliSpacing.md),
            child: MaliSectionHeader(title: 'Populaires', actionLabel: 'Voir tout', onAction: () => onTab(1)),
          ),
          _PopularProducts(onSeeAll: () => onTab(1)),
          const SizedBox(height: MaliSpacing.xxl),
        ],
      ),
    );
  }
}

/// En-tête dégradé émeraude : salutation, localisation et carte de solde wallet.
class _Header extends StatelessWidget {
  const _Header({required this.greeting, required this.ref});
  final String greeting;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final balance = ref.watch(walletBalanceProvider);
    final textOnDark = Theme.of(context).textTheme;
    return Container(
      padding: EdgeInsets.fromLTRB(
        MaliSpacing.md, MediaQuery.of(context).padding.top + MaliSpacing.md, MaliSpacing.md, MaliSpacing.lg),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [MaliColors.emeraldDark, MaliColors.emerald],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(MaliRadius.xl)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.location_on, color: MaliColors.goldLight, size: 18),
              const SizedBox(width: 4),
              Text('Bamako, Mali',
                  style: textOnDark.labelSmall?.copyWith(color: Colors.white70)),
              const Spacer(),
              _IconBadge(icon: Icons.notifications_none, onTap: () {}),
            ],
          ),
          const SizedBox(height: MaliSpacing.md),
          Text(greeting,
              style: textOnDark.headlineMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
          Text('Livraison & services au Mali',
              style: textOnDark.bodyMedium?.copyWith(color: Colors.white70)),
          const SizedBox(height: MaliSpacing.md),
          _WalletCard(balance: balance),
        ],
      ),
    );
  }
}

class _WalletCard extends StatelessWidget {
  const _WalletCard({required this.balance});
  final AsyncValue<Map<String, dynamic>> balance;

  String _text() => balance.when(
        data: (b) {
          final v = b['balance'];
          if (v is Map) return formatMoney(v.cast<String, dynamic>());
          if (v is num) return '${v.toInt()} FCFA';
          return '—';
        },
        loading: () => '…',
        error: (_, __) => '—',
      );

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/wallet'),
      borderRadius: MaliRadius.card,
      child: Container(
        padding: const EdgeInsets.all(MaliSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.14),
          borderRadius: MaliRadius.card,
          border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            const Icon(Icons.account_balance_wallet, color: Colors.white),
            const SizedBox(width: MaliSpacing.sm),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Mon portefeuille',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white70)),
                Text(_text(),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white, fontWeight: FontWeight.w800)),
              ],
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: MaliSpacing.sm, vertical: 6),
              decoration: BoxDecoration(
                color: MaliColors.gold,
                borderRadius: BorderRadius.circular(MaliRadius.pill),
              ),
              child: Text('Recharger',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: MaliColors.ink, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }
}

class _IconBadge extends StatelessWidget {
  const _IconBadge({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(MaliRadius.pill),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.16),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: MaliRadius.field,
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: MaliSpacing.md),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: MaliRadius.field,
          border: Border.all(color: scheme.outline),
          boxShadow: MaliElevation.card(Theme.of(context).brightness),
        ),
        child: Row(
          children: [
            Icon(Icons.search, color: scheme.onSurfaceVariant),
            const SizedBox(width: MaliSpacing.sm),
            Text('Rechercher un plat, une boutique…',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }
}

class _CategoryItem {
  const _CategoryItem(this.label, this.icon, this.color, this.tab, this.keyword);
  final String label;
  final IconData icon;
  final Color color;
  final int tab;

  /// Code catégorie injecté dans le filtre du catalogue quand tab == 1
  /// (FOOD | GROCERY | PHARMACY | SHOP ; vide = toutes catégories).
  final String keyword;
}

class _Categories extends StatelessWidget {
  const _Categories({required this.onSelect});
  final void Function(_CategoryItem) onSelect;

  static const _items = [
    _CategoryItem('Restaurants', Icons.restaurant, MaliColors.emerald, 1, 'FOOD'),
    _CategoryItem('Marché', Icons.storefront, MaliColors.gold, 1, 'GROCERY'),
    _CategoryItem('Pharmacie', Icons.local_pharmacy, MaliColors.info, 1, 'PHARMACY'),
    _CategoryItem('Boutiques', Icons.shopping_bag, MaliColors.error, 1, 'SHOP'),
    _CategoryItem('Artisans', Icons.handyman, MaliColors.emeraldLight, 2, ''),
    _CategoryItem('Colis', Icons.local_shipping, MaliColors.warning, 1, ''),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: MaliSpacing.md),
      child: GridView.count(
        crossAxisCount: 3,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: MaliSpacing.sm,
        crossAxisSpacing: MaliSpacing.sm,
        childAspectRatio: 0.95,
        children: _items
            .map((c) => _CategoryTile(item: c, onTap: () => onSelect(c)))
            .toList(),
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.item, required this.onTap});
  final _CategoryItem item;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return MaliCard(
      onTap: onTap,
      padding: const EdgeInsets.all(MaliSpacing.sm),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: item.color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(MaliRadius.md),
            ),
            child: Icon(item.icon, color: item.color),
          ),
          const SizedBox(height: MaliSpacing.xs),
          Text(item.label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _PromoBanner extends StatelessWidget {
  const _PromoBanner();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(MaliSpacing.md),
      decoration: BoxDecoration(
        borderRadius: MaliRadius.card,
        gradient: const LinearGradient(
          colors: [MaliColors.goldDark, MaliColors.gold],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Livraison offerte',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: MaliColors.ink, fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text('Sur votre première commande cette semaine.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: MaliColors.ink)),
              ],
            ),
          ),
          const Icon(Icons.local_offer, color: MaliColors.ink, size: 40),
        ],
      ),
    );
  }
}

/// Carte « commande en cours » : affichée s'il existe une commande active,
/// avec statut et accès direct au suivi. Données réelles via [myOrdersProvider].
class _ActiveOrderCard extends ConsumerWidget {
  const _ActiveOrderCard();

  static const _active = {
    'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT',
  };
  static const _labels = {
    'PENDING': 'En attente', 'CONFIRMED': 'Confirmée', 'PREPARING': 'En préparation',
    'READY': 'Prête', 'ASSIGNED': 'Assignée', 'PICKED_UP': 'Récupérée', 'IN_TRANSIT': 'En route',
  };

  MaliStatusTone _tone(String s) {
    if (s == 'IN_TRANSIT' || s == 'PICKED_UP' || s == 'ASSIGNED') return MaliStatusTone.info;
    if (s == 'PENDING') return MaliStatusTone.warning;
    return MaliStatusTone.success;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(myOrdersProvider);
    return orders.maybeWhen(
      orElse: () => const SizedBox.shrink(),
      data: (list) {
        final active = list.where((o) => _active.contains(o['status'] as String?)).toList();
        if (active.isEmpty) return const SizedBox.shrink();
        final o = active.first;
        final status = o['status'] as String? ?? '';
        return Padding(
          padding: const EdgeInsets.fromLTRB(MaliSpacing.md, MaliSpacing.lg, MaliSpacing.md, 0),
          child: MaliCard(
            lifted: true,
            onTap: () => context.push('/orders/${o['id']}'),
            child: Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: MaliColors.emerald.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(MaliRadius.md),
                  ),
                  child: const Icon(Icons.delivery_dining, color: MaliColors.emerald),
                ),
                const SizedBox(width: MaliSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Commande en cours',
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 2),
                      Text('${o['reference'] ?? ''} · ${formatMoney((o['total'] as Map?)?.cast<String, dynamic>())}',
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                const SizedBox(width: MaliSpacing.xs),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    MaliStatusPill(label: _labels[status] ?? status, tone: _tone(status)),
                    const SizedBox(height: 6),
                    const Row(
                      children: [
                        Text('Suivre', style: TextStyle(color: MaliColors.emerald, fontWeight: FontWeight.w600, fontSize: 12)),
                        Icon(Icons.chevron_right, color: MaliColors.emerald, size: 16),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _PopularProducts extends ConsumerWidget {
  const _PopularProducts({required this.onSeeAll});
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(productsProvider);
    return SizedBox(
      height: 208,
      child: products.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: Text('Catalogue indisponible',
              style: Theme.of(context).textTheme.bodySmall),
        ),
        data: (list) {
          if (list.isEmpty) {
            return Center(
              child: Text('Aucun produit pour le moment',
                  style: Theme.of(context).textTheme.bodySmall),
            );
          }
          final items = list.take(8).toList();
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: MaliSpacing.md),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: MaliSpacing.sm),
            itemBuilder: (_, i) => _ProductCard(product: items[i], onTap: onSeeAll),
          );
        },
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product, required this.onTap});
  final Product product;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SizedBox(
      width: 150,
      child: MaliCard(
        onTap: onTap,
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(MaliRadius.lg)),
              child: Container(
                height: 96,
                width: double.infinity,
                color: scheme.surfaceContainerHighest,
                child: product.imageUrl != null
                    ? Image.network(product.imageUrl!, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(Icons.fastfood, size: 32))
                    : Icon(Icons.fastfood, size: 32, color: scheme.onSurfaceVariant),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(MaliSpacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 2),
                  Text(formatMoney(product.price),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: MaliColors.emerald, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Carrousel horizontal des boutiques (vitrines) sur l'accueil.
class _StoresCarousel extends ConsumerWidget {
  const _StoresCarousel();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(storesProvider);
    return async.when(
      loading: () => const SizedBox(
          height: 200, child: Center(child: CircularProgressIndicator())),
      error: (_, __) => const SizedBox.shrink(),
      data: (stores) {
        if (stores.isEmpty) return const SizedBox.shrink();
        return SizedBox(
          height: 200,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: MaliSpacing.md),
            itemCount: stores.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => StoreCard(store: stores[i], width: 250),
          ),
        );
      },
    );
  }
}
