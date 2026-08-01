import 'package:flutter/material.dart';

import '../cart.dart';
import '../data/catalog_model.dart';
import '../favorites.dart';
import '../models.dart';
import '../ui/ui.dart';
import '../widgets.dart' show Img, Pill, QtyStepper, Stars;
import 'cart_screen.dart';

/// Fiche boutique — deux sections : l'identité du commerce, puis son menu.
///
/// Les listes du catalogue ne transportent que les résumés : le menu complet
/// est chargé ici, à l'ouverture (43 000 produits en base, on ne rapatrie que
/// ceux de la boutique consultée).
class StoreScreen extends StatefulWidget {
  final Store store;
  const StoreScreen({super.key, required this.store});

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  late Store store = widget.store;
  bool _loadingMenu = false;
  Object? _menuError;

  @override
  void initState() {
    super.initState();
    if (store.products.isEmpty) _loadMenu();
  }

  Future<void> _loadMenu() async {
    setState(() {
      _loadingMenu = true;
      _menuError = null;
    });
    try {
      final full = await catalog.withProducts(store);
      if (!mounted) return;
      setState(() => store = full);
    } catch (e) {
      if (!mounted) return;
      setState(() => _menuError = e);
    } finally {
      if (mounted) setState(() => _loadingMenu = false);
    }
  }

  List<String> get _sections => store.products.map((p) => p.section).toSet().toList();

  void _openProduct(Product p) => showNovigoSheet(
        context,
        builder: (_) => _ProductSheet(product: p, store: store),
      );

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      body: CustomScrollView(slivers: [
        _appBar(context),
        SliverPadding(
          padding: EdgeInsets.fromLTRB(gutter, Sp.xs, gutter, 0),
          sliver: SliverToBoxAdapter(child: _identity()),
        ),
        SliverPadding(
          padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, 0),
          sliver: SliverToBoxAdapter(child: _facts()),
        ),
        ..._menuSlivers(gutter),
        const SliverToBoxAdapter(child: SizedBox(height: 110)),
      ]),
      bottomNavigationBar: _cartBar(context),
    );
  }

  Widget _appBar(BuildContext context) => SliverAppBar(
        expandedHeight: 230,
        pinned: true,
        backgroundColor: NC.shell,
        leading: _glassButton(Icons.arrow_back, 'Retour', () => Navigator.pop(context)),
        actions: [
          ListenableBuilder(
            listenable: favorites,
            builder: (_, __) {
              final on = favorites.contains(store.id);
              return _glassButton(
                on ? Icons.favorite : Icons.favorite_border,
                on ? 'Retirer des favoris' : 'Ajouter aux favoris',
                () => favorites.toggle(store.id),
                color: on ? NC.brand : Colors.white,
              );
            },
          ),
          const SizedBox(width: Sp.sm),
        ],
        flexibleSpace: FlexibleSpaceBar(
          background: Stack(fit: StackFit.expand, children: [
            // Arrivée du Hero lancé par la carte de la liste.
            Hero(tag: 'store-cover-${store.id}', child: Img(store.image, fit: BoxFit.cover)),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xCC0F1117), NC.shell],
                  stops: [0.35, 0.8, 1.0],
                ),
              ),
            ),
          ]),
        ),
      );

  Widget _glassButton(IconData icon, String tooltip, VoidCallback onTap, {Color? color}) => Padding(
        padding: const EdgeInsets.all(Sp.xs + 2),
        child: NovigoIconButton(
          icon: icon,
          tooltip: tooltip,
          onPressed: onTap,
          size: 38,
          background: Colors.black.withValues(alpha: 0.45),
          foreground: color ?? Colors.white,
        ),
      );

  /// Section 1 — qui est ce commerce.
  Widget _identity() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(store.name, style: T.h1, maxLines: 2, overflow: TextOverflow.ellipsis),
        const SizedBox(height: Sp.xs + 2),
        Text(store.cuisine, style: T.muted),
        const SizedBox(height: Sp.md),
        // Wrap plutôt que Row : trois pastilles sur un écran étroit débordaient.
        Wrap(
          spacing: Sp.sm,
          runSpacing: Sp.sm,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Stars(store.rating, reviews: store.reviews),
            if (store.verified)
              const Pill('Vérifié',
                  color: NC.success, bg: Color(0x1F2ECC71), icon: Icons.verified_rounded),
            Pill(store.district, color: NC.muted, bg: NC.surface, icon: Icons.place_outlined),
          ],
        ),
      ]);

  /// Bandeau d'infos pratiques : un seul bloc segmenté plutôt que trois cartes
  /// détachées, ce qui allège la page avant le menu.
  Widget _facts() => NovigoCard(
        padding: const EdgeInsets.symmetric(vertical: Sp.md + 2),
        child: Row(children: [
          _fact(Icons.access_time_rounded, '${store.etaMin} min', 'Livraison'),
          _factDivider(),
          _fact(Icons.pedal_bike, store.freeDelivery ? 'Offerte' : fcfa(store.deliveryFee), 'Frais',
              accent: store.freeDelivery),
          _factDivider(),
          _fact(Icons.place_outlined, '${store.distanceKm.toStringAsFixed(1)} km', 'Distance'),
        ]),
      );

  Widget _factDivider() => Container(width: 1, height: 34, color: NC.hairline);

  Widget _fact(IconData i, String v, String l, {bool accent = false}) => Expanded(
        child: Column(children: [
          Icon(i, color: accent ? NC.success : NC.brand, size: 19),
          const SizedBox(height: Sp.xs + 2),
          Text(v,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: accent ? NC.success : NC.ink,
                  fontSize: 14.5)),
          const SizedBox(height: 2),
          Text(l, style: const TextStyle(color: NC.faint, fontSize: 11.5)),
        ]),
      );

  /// Section 2 — le menu, groupé par rayon.
  List<Widget> _menuSlivers(double gutter) {
    if (_loadingMenu && store.products.isEmpty) {
      return [
        SliverPadding(
          padding: EdgeInsets.fromLTRB(gutter, Sp.section, gutter, 0),
          sliver: const SliverToBoxAdapter(child: _MenuSkeleton()),
        ),
      ];
    }
    if (store.products.isEmpty) {
      return [
        SliverToBoxAdapter(
          child: _menuError != null
              ? NovigoEmptyState.error(
                  message: 'Le menu n\'a pas pu être chargé.',
                  onAction: _loadMenu,
                )
              : const NovigoEmptyState.empty(
                  icon: Icons.restaurant_menu_rounded,
                  title: 'Menu indisponible',
                  message: 'Ce commerce n\'a pas encore publié ses produits.',
                ),
        ),
      ];
    }

    final grid = store.kind != 'repas';
    final columns = Rs.of(context).productColumns;
    final out = <Widget>[];
    for (final section in _sections) {
      final items = store.products.where((p) => p.section == section).toList();
      out.add(SliverPadding(
        padding: EdgeInsets.fromLTRB(gutter, Sp.xl + 2, gutter, Sp.md - 2),
        sliver: SliverToBoxAdapter(
          child: Row(children: [
            Text(section, style: T.h2),
            const SizedBox(width: Sp.sm + 2),
            // Filet qui prolonge le titre : structure les longues cartes sans
            // ajouter de bloc supplémentaire.
            Expanded(child: Container(height: 1, color: NC.hairline)),
            const SizedBox(width: Sp.sm + 2),
            Text('${items.length}', style: T.overline),
          ]),
        ),
      ));
      if (grid) {
        out.add(SliverPadding(
          padding: EdgeInsets.symmetric(horizontal: gutter),
          sliver: SliverGrid(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              mainAxisSpacing: Sp.md,
              crossAxisSpacing: Sp.md,
              childAspectRatio: 0.74,
            ),
            delegate: SliverChildBuilderDelegate(
              (_, i) => NovigoProductCard(
                product: items[i],
                store: store,
                onTap: () => _openProduct(items[i]),
              ),
              childCount: items.length,
            ),
          ),
        ));
      } else {
        out.add(SliverPadding(
          padding: EdgeInsets.symmetric(horizontal: gutter),
          sliver: SliverList.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(color: NC.line, height: Sp.xl),
            itemBuilder: (_, i) => NovigoProductRow(
              product: items[i],
              store: store,
              onTap: () => _openProduct(items[i]),
            ),
          ),
        ));
      }
    }
    return out;
  }

  Widget _cartBar(BuildContext context) {
    return ListenableBuilder(
      listenable: cart,
      builder: (_, __) {
        // La barre ne concerne que le panier de **cette** boutique : afficher un
        // total constitué ailleurs ferait croire à une commande groupée.
        if (cart.count == 0 || cart.store?.id != store.id) return const SizedBox.shrink();
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(Sp.lg, 0, Sp.lg, Sp.md),
            child: NovigoButton(
              label: 'Voir le panier · ${cart.count}',
              trailingLabel: fcfa(cart.subtotal),
              icon: Icons.shopping_bag_rounded,
              onPressed: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => const CartScreen())),
            ),
          ),
        );
      },
    );
  }
}

/// Squelette du menu : deux titres de rayon et quelques lignes de produits.
class _MenuSkeleton extends StatelessWidget {
  const _MenuSkeleton();

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const NovigoSkeleton(width: 120, height: 18, radius: 6),
          const SizedBox(height: Sp.lg),
          for (var i = 0; i < 4; i++)
            const Padding(
              padding: EdgeInsets.only(bottom: Sp.xl),
              child: Row(children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    NovigoSkeleton(width: 150, height: 15, radius: 6),
                    SizedBox(height: Sp.sm),
                    NovigoSkeleton(height: 11, radius: 6),
                    SizedBox(height: Sp.sm),
                    NovigoSkeleton(width: 80, height: 13, radius: 6),
                  ]),
                ),
                SizedBox(width: Sp.md),
                NovigoSkeleton(width: 96, height: 96, radius: R.md),
              ]),
            ),
        ],
      );
}

/// Feuille produit : visuel, description, quantité, ajout au panier.
class _ProductSheet extends StatelessWidget {
  final Product product;
  final Store store;
  const _ProductSheet({required this.product, required this.store});

  @override
  Widget build(BuildContext context) {
    return NovigoBottomSheet(
      footer: Row(children: [
        ListenableBuilder(
          listenable: cart,
          builder: (_, __) => QtyStepper(
            qty: cart.qtyOf(product).clamp(0, 99),
            onAdd: () => cart.add(product, store),
            onRemove: () => cart.remove(product),
          ),
        ),
        const SizedBox(width: Sp.md + 2),
        Expanded(
          child: NovigoButton(
            label: 'Ajouter au panier',
            onPressed: () {
              if (cart.qtyOf(product) == 0) cart.add(product, store);
              Navigator.pop(context);
            },
          ),
        ),
      ]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _visual(),
        const SizedBox(height: Sp.lg),
        Text(product.name, style: T.h2),
        const SizedBox(height: Sp.xs + 2),
        Text(product.desc, style: T.muted),
        const SizedBox(height: Sp.md),
        Row(children: [
          Text(fcfa(product.price),
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: NC.ink)),
          if (product.discount != null) ...[
            const SizedBox(width: Sp.md),
            Pill('-${product.discount}%', color: Colors.white, bg: NC.brand),
          ],
        ]),
      ]),
    );
  }

  Widget _visual() => product.isTile
      ? Container(
          height: 190,
          width: double.infinity,
          decoration: BoxDecoration(
            color: (product.tone ?? NC.brand).withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(R.lg),
          ),
          alignment: Alignment.center,
          child: Icon(product.icon, color: product.tone ?? NC.brand, size: 80),
        )
      : Img(product.image,
          height: 190, width: double.infinity, radius: BorderRadius.circular(R.lg));
}
