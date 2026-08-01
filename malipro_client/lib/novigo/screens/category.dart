import 'package:flutter/material.dart';

import '../data/catalog_model.dart';
import '../models.dart';
import '../ui/ui.dart';
import 'search.dart';
import 'store.dart';

/// Écran de catégorie (Repas, Pharmacie, Marché…) — **trois sections**.
///
///   1. Chercher et filtrer.
///   2. Les offres du moment (carrousel court).
///   3. Tous les commerces, en défilement infini.
///
/// L'ordre compte : le carrousel passe avant la liste paginée, sinon il finit
/// sous des centaines de commerces et n'est jamais vu.
class CategoryScreen extends StatefulWidget {
  final Category category;
  const CategoryScreen({super.key, required this.category});

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  int _filter = 0;
  static const _filters = ['Tous', 'Mieux notés', 'Livraison offerte', 'Au plus près'];
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    // Défilement infini : le catalogue compte des centaines de commerces par
    // catégorie, on ne charge la page suivante qu'à l'approche du bas.
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 600) {
      catalog.loadMore(widget.category.id);
    }
  }

  @override
  void dispose() {
    _scroll
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  /// Tri local sur les pages déjà chargées.
  List<Store> _apply(List<Store> stores) {
    final out = [...stores];
    switch (_filter) {
      case 1:
        out.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case 2:
        return out.where((s) => s.freeDelivery).toList();
      case 3:
        out.sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
        break;
    }
    return out;
  }

  /// Commerces mis en avant : livraison offerte **et** bien notés. Rien n'est
  /// inventé, c'est une lecture du catalogue réellement chargé.
  List<Store> _featured(List<Store> stores) {
    final picks = stores.where((s) => s.freeDelivery && s.rating >= 4.3).toList()
      ..sort((a, b) => b.rating.compareTo(a.rating));
    return picks.take(6).toList();
  }

  void _openStore(Store s) => Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => StoreScreen(store: s)));

  @override
  Widget build(BuildContext context) {
    if (widget.category.id == 'colis') return _ParcelView(label: widget.category.label);

    final gutter = Rs.of(context).gutter;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.category.label, style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListenableBuilder(
        listenable: catalog,
        builder: (context, _) {
          final all = catalog.storesForCategory(widget.category.id);
          final stores = _apply(all);
          final featured = _featured(all);
          final loadingMore = catalog.isLoadingCategory(widget.category.id);
          final firstLoad = loadingMore && all.isEmpty;

          return RefreshIndicator(
            onRefresh: () => catalog.loadCategory(widget.category.id),
            color: NC.brand,
            backgroundColor: NC.surface,
            child: CustomScrollView(controller: _scroll, slivers: [
              // ───── Section 1 · Chercher & filtrer ─────
              SliverPadding(
                padding: EdgeInsets.fromLTRB(gutter, 0, gutter, 0),
                sliver: SliverToBoxAdapter(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('${widget.category.label} à Bamako', style: T.h1),
                    const SizedBox(height: Sp.xs + 2),
                    Text(
                      all.isEmpty
                          ? 'Chargement du catalogue…'
                          : '${all.length} commerce${all.length > 1 ? 's' : ''} disponible${all.length > 1 ? 's' : ''}',
                      style: T.muted,
                    ),
                    const SizedBox(height: Sp.lg),
                    NovigoSearchBar(
                      hint: 'Rechercher dans ${widget.category.label.toLowerCase()}…',
                      onTap: () => Navigator.of(context)
                          .push(MaterialPageRoute(builder: (_) => const SearchScreen())),
                    ),
                  ]),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: Sp.md),
                  child: NovigoChipRail(
                    labels: _filters,
                    selectedIndex: _filter,
                    onSelected: (i) => setState(() => _filter = i),
                    padding: EdgeInsets.symmetric(horizontal: gutter),
                  ),
                ),
              ),

              // ───── Section 2 · Offres du moment ─────
              if (featured.isNotEmpty) ...[
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(gutter, Sp.xl, gutter, Sp.lg),
                  sliver: const SliverToBoxAdapter(
                    child: NovigoSectionHeader(
                      overline: 'Offres',
                      title: 'À ne pas manquer',
                      subtitle: 'Livraison offerte et très bien notés',
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: _FeaturedRail(
                    stores: featured,
                    gutter: gutter,
                    onOpen: _openStore,
                  ),
                ),
              ],

              // ───── Section 3 · Tous les commerces ─────
              SliverPadding(
                padding: EdgeInsets.fromLTRB(gutter, Sp.section, gutter, Sp.lg),
                sliver: SliverToBoxAdapter(
                  child: NovigoSectionHeader(
                    overline: 'Catalogue',
                    title: _filters[_filter] == 'Tous' ? 'Tous les commerces' : _filters[_filter],
                  ),
                ),
              ),
              if (firstLoad)
                SliverPadding(
                  padding: EdgeInsets.symmetric(horizontal: gutter),
                  sliver: const SliverToBoxAdapter(child: NovigoMerchantListSkeleton()),
                )
              else if (stores.isEmpty)
                SliverToBoxAdapter(
                  child: NovigoEmptyState.empty(
                    icon: Icons.storefront_outlined,
                    title: 'Aucun commerce ici',
                    message: _filter == 0
                        ? 'Cette catégorie n\'a pas encore de commerce dans votre zone.'
                        : 'Aucun résultat avec ce filtre. Essayez « Tous ».',
                    actionLabel: _filter == 0 ? null : 'Retirer le filtre',
                    onAction: _filter == 0 ? null : () => setState(() => _filter = 0),
                  ),
                )
              else
                SliverPadding(
                  padding: EdgeInsets.symmetric(horizontal: gutter),
                  sliver: SliverList.separated(
                    itemCount: stores.length,
                    separatorBuilder: (_, __) => const SizedBox(height: Sp.lg),
                    itemBuilder: (_, i) => FadeSlideIn(
                      index: i,
                      child: NovigoMerchantCard(
                        store: stores[i],
                        onTap: () => _openStore(stores[i]),
                      ),
                    ),
                  ),
                ),
              if (loadingMore && all.isNotEmpty)
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, 0),
                  sliver: const SliverToBoxAdapter(child: NovigoMerchantCardSkeleton()),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: Sp.xxl)),
            ]),
          );
        },
      ),
    );
  }
}

/// Carrousel des commerces mis en avant.
class _FeaturedRail extends StatelessWidget {
  final List<Store> stores;
  final double gutter;
  final ValueChanged<Store> onOpen;

  const _FeaturedRail({required this.stores, required this.gutter, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final width = Rs.of(context).carouselCardWidth;
    return NovigoCarousel(
      height: NovigoMerchantCard.carouselHeight(context, width),
      gutter: gutter,
      itemCount: stores.length,
      itemBuilder: (_, i) => SizedBox(
        width: width,
        child: NovigoMerchantCard(
          store: stores[i],
          compact: true,
          onTap: () => onOpen(stores[i]),
        ),
      ),
    );
  }
}

/// Envoi de colis (coursier NOVIGO) — parcours dédié de la catégorie « Colis ».
class _ParcelView extends StatefulWidget {
  final String label;
  const _ParcelView({required this.label});

  @override
  State<_ParcelView> createState() => _ParcelViewState();
}

class _ParcelViewState extends State<_ParcelView> {
  int _size = 0;
  bool _searching = false;

  static const _sizes = [
    ['Petit', '≤ 2 kg', 1000, Icons.inventory_2_outlined],
    ['Moyen', '≤ 8 kg', 1800, Icons.work_outline],
    ['Grand', '≤ 20 kg', 3000, Icons.luggage_outlined],
  ];

  Future<void> _requestCourier() async {
    setState(() => _searching = true);
    // Recherche d'un coursier : l'appel réel passera par le Brain (mission
    // PARCEL). En attendant, l'attente est explicite plutôt que muette.
    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() => _searching = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Envoi de colis — ouverture prochaine du service coursier'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.label, style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: NovigoContentWidth(
        child: ListView(
          padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xxl),
          children: [
            // Section 1 · Le trajet du colis
            NovigoCard(
              radius: R.xl,
              gradient: NC.brandGradient,
              border: const Border.fromBorderSide(BorderSide.none),
              padding: const EdgeInsets.all(Sp.xl - 4),
              child: Row(children: [
                const Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Envoyez partout à Bamako',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 20,
                            height: 1.15)),
                    SizedBox(height: Sp.sm),
                    Text('Un coursier récupère et livre votre colis en moins de 40 min.',
                        style: TextStyle(color: Colors.white70, fontSize: 13.5, height: 1.3)),
                  ]),
                ),
                const Icon(Icons.local_shipping_rounded, color: Colors.white, size: 50),
              ]),
            ),
            const SizedBox(height: Sp.xl),
            NovigoTileGroup(children: [
              NovigoTile(
                icon: Icons.trip_origin,
                tone: NC.success,
                label: 'Point de retrait',
                subtitle: 'Hamdallaye ACI · Rue 250',
                onTap: () {},
              ),
              NovigoTile(
                icon: Icons.place_rounded,
                label: 'Point de livraison',
                subtitle: 'Ajouter une adresse',
                onTap: () {},
              ),
            ]),

            // Section 2 · Taille du colis
            const SizedBox(height: Sp.section),
            const NovigoSectionHeader(overline: 'Colis', title: 'Quelle taille ?'),
            const SizedBox(height: Sp.lg),
            Row(children: [
              for (var i = 0; i < _sizes.length; i++) ...[
                if (i > 0) const SizedBox(width: Sp.md - 2),
                Expanded(
                  child: _SizeOption(
                    icon: _sizes[i][3] as IconData,
                    name: _sizes[i][0] as String,
                    weight: _sizes[i][1] as String,
                    price: _sizes[i][2] as int,
                    selected: i == _size,
                    onTap: () => setState(() => _size = i),
                  ),
                ),
              ],
            ]),
            const SizedBox(height: Sp.section),
            NovigoButton(
              label: 'Demander un coursier',
              trailingLabel: fcfa(_sizes[_size][2] as int),
              icon: Icons.pedal_bike,
              loading: _searching,
              onPressed: _requestCourier,
            ),
          ],
        ),
      ),
    );
  }
}

class _SizeOption extends StatelessWidget {
  final IconData icon;
  final String name, weight;
  final int price;
  final bool selected;
  final VoidCallback onTap;

  const _SizeOption({
    required this.icon,
    required this.name,
    required this.weight,
    required this.price,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: '$name, $weight, ${fcfa(price)}',
      child: NovigoCard(
        onTap: onTap,
        radius: R.md,
        padding: const EdgeInsets.symmetric(vertical: Sp.lg, horizontal: Sp.sm),
        border: Border.all(
          color: selected ? NC.brand : NC.hairline,
          width: selected ? 2 : 1,
        ),
        child: Column(children: [
          Icon(icon, color: selected ? NC.brand : NC.muted, size: 25),
          const SizedBox(height: Sp.sm),
          Text(name,
              style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 14)),
          Text(weight, style: const TextStyle(color: NC.faint, fontSize: 11.5)),
          const SizedBox(height: Sp.xs + 2),
          Text('$price F',
              style: TextStyle(
                  color: selected ? NC.brand : NC.muted,
                  fontWeight: FontWeight.w800,
                  fontSize: 13.5)),
        ]),
      ),
    );
  }
}
