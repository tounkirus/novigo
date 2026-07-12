import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../cart.dart';
import '../widgets.dart';
import 'cart_screen.dart';

class StoreScreen extends StatelessWidget {
  final Store store;
  const StoreScreen({super.key, required this.store});

  List<String> get _sections => store.products.map((p) => p.section).toSet().toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 230,
          pinned: true,
          backgroundColor: NC.shell,
          leading: _circleBtn(context, Icons.arrow_back, () => Navigator.pop(context)),
          actions: [
            _circleBtn(context, Icons.favorite_border, () {}),
            _circleBtn(context, Icons.share_outlined, () {}),
            const SizedBox(width: 6),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(fit: StackFit.expand, children: [
              Img(store.image, fit: BoxFit.cover),
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
        ),
        SliverToBoxAdapter(child: _header()),
        SliverToBoxAdapter(child: _stats()),
        ..._menuSlivers(context),
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ]),
      bottomNavigationBar: _cartBar(context),
    );
  }

  Widget _circleBtn(BuildContext c, IconData i, VoidCallback onTap) => Padding(
        padding: const EdgeInsets.all(6),
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            width: 38,
            decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.45), shape: BoxShape.circle),
            child: Icon(i, color: Colors.white, size: 20),
          ),
        ),
      );

  Widget _header() => Padding(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(store.name, style: T.h1),
          const SizedBox(height: 6),
          Text(store.cuisine, style: T.muted),
          const SizedBox(height: 10),
          Row(children: [
            Stars(store.rating, reviews: store.reviews),
            const SizedBox(width: 12),
            if (store.verified) const Pill('Vérifié', color: NC.success, bg: Color(0x1F2ECC71), icon: Icons.verified_rounded),
            const SizedBox(width: 8),
            Pill(store.district, color: NC.muted, bg: NC.surface, icon: Icons.place_outlined),
          ]),
        ]),
      );

  Widget _stats() => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
        child: Row(children: [
          _stat(Icons.access_time_rounded, '${store.etaMin} min', 'Livraison'),
          _stat(Icons.pedal_bike, store.freeDelivery ? 'Gratuit' : fcfa(store.deliveryFee), 'Frais'),
          _stat(Icons.place_outlined, '${store.distanceKm} km', 'Distance'),
        ]),
      );

  Widget _stat(IconData i, String v, String l) => Expanded(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: cardDeco(radius: 16),
          child: Column(children: [
            Icon(i, color: NC.brand, size: 20),
            const SizedBox(height: 6),
            Text(v, style: const TextStyle(fontWeight: FontWeight.w800, color: NC.ink, fontSize: 15)),
            Text(l, style: const TextStyle(color: NC.faint, fontSize: 12)),
          ]),
        ),
      );

  List<Widget> _menuSlivers(BuildContext context) {
    final grid = store.kind != 'repas';
    final out = <Widget>[];
    for (final section in _sections) {
      final items = store.products.where((p) => p.section == section).toList();
      out.add(SliverPadding(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
        sliver: SliverToBoxAdapter(child: Text(section, style: T.h2)),
      ));
      if (grid) {
        out.add(SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.74,
            ),
            delegate: SliverChildBuilderDelegate(
              (_, i) => _ProductTile(product: items[i], store: store),
              childCount: items.length,
            ),
          ),
        ));
      } else {
        out.add(SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverList.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(color: NC.line, height: 24),
            itemBuilder: (_, i) => _ProductRow(product: items[i], store: store),
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
        if (cart.count == 0 || cart.store?.id != store.id) return const SizedBox.shrink();
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: GestureDetector(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CartScreen())),
              child: Container(
                height: 58,
                padding: const EdgeInsets.symmetric(horizontal: 18),
                decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16), boxShadow: [
                  BoxShadow(color: NC.brand.withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 8)),
                ]),
                child: Row(children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(8)),
                    child: Text('${cart.count}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(width: 12),
                  const Text('Voir le panier', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                  const Spacer(),
                  Text(fcfa(cart.subtotal), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                ]),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _ProductRow extends StatelessWidget {
  final Product product;
  final Store store;
  const _ProductRow({required this.product, required this.store});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _openSheet(context),
      behavior: HitTestBehavior.opaque,
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Flexible(child: Text(product.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
              if (product.popular) ...[
                const SizedBox(width: 8),
                const Pill('Populaire', color: NC.brand, bg: Color(0x1FE53935), icon: Icons.local_fire_department_rounded),
              ],
            ]),
            const SizedBox(height: 4),
            Text(product.desc, style: T.muted, maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 8),
            Row(children: [
              Text(fcfa(product.price), style: T.price),
              if (product.discount != null) ...[
                const SizedBox(width: 8),
                Pill('-${product.discount}%', color: Colors.white, bg: NC.brand),
              ],
            ]),
          ]),
        ),
        const SizedBox(width: 12),
        Stack(clipBehavior: Clip.none, children: [
          Img(product.image, width: 96, height: 96, radius: BorderRadius.circular(16)),
          Positioned(
            right: -8,
            bottom: -8,
            child: ListenableBuilder(
              listenable: cart,
              builder: (_, __) {
                final q = cart.qtyOf(product);
                return GestureDetector(
                  onTap: () => cart.add(product, store),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: q > 0 ? NC.brand : NC.surfaceAlt,
                      shape: BoxShape.circle,
                      border: Border.all(color: NC.shell, width: 3),
                    ),
                    child: q > 0
                        ? Center(child: Text('$q', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)))
                        : const Icon(Icons.add, color: NC.ink, size: 20),
                  ),
                );
              },
            ),
          ),
        ]),
      ]),
    );
  }

  void _openSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ProductSheet(product: product, store: store),
    );
  }
}

/// Tuile produit en grille (rayons supermarché / pharmacie / marché / boulangerie).
class _ProductTile extends StatelessWidget {
  final Product product;
  final Store store;
  const _ProductTile({required this.product, required this.store});

  @override
  Widget build(BuildContext context) {
    final tone = product.tone ?? NC.brand;
    return GestureDetector(
      onTap: () => showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => _ProductSheet(product: product, store: store),
      ),
      behavior: HitTestBehavior.opaque,
      child: Container(
        decoration: cardDeco(radius: 18),
        clipBehavior: Clip.antiAlias,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Visuel icône
          Expanded(
            child: Stack(children: [
              Container(
                width: double.infinity,
                color: tone.withValues(alpha: 0.14),
                alignment: Alignment.center,
                child: Icon(product.icon, color: tone, size: 44),
              ),
              if (product.discount != null)
                Positioned(left: 8, top: 8, child: Pill('-${product.discount}%', color: Colors.white, bg: NC.brand)),
              if (product.popular && product.discount == null)
                const Positioned(
                    left: 8,
                    top: 8,
                    child: Pill('Populaire', color: NC.brand, bg: Color(0x1FE53935), icon: Icons.local_fire_department_rounded)),
              Positioned(
                right: 8,
                bottom: 8,
                child: ListenableBuilder(
                  listenable: cart,
                  builder: (_, __) {
                    final q = cart.qtyOf(product);
                    return GestureDetector(
                      onTap: () => cart.add(product, store),
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: q > 0 ? NC.brand : NC.surfaceAlt,
                          shape: BoxShape.circle,
                          border: Border.all(color: NC.surface, width: 2),
                        ),
                        child: q > 0
                            ? Center(child: Text('$q', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)))
                            : const Icon(Icons.add, color: NC.ink, size: 19),
                      ),
                    );
                  },
                ),
              ),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(product.name, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 13.5),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text(product.desc, style: const TextStyle(color: NC.faint, fontSize: 11.5), maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 6),
              Text(fcfa(product.price), style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 14.5)),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _ProductSheet extends StatelessWidget {
  final Product product;
  final Store store;
  const _ProductSheet({required this.product, required this.store});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: NC.paper,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SizedBox(height: 10),
          Container(width: 44, height: 5, decoration: BoxDecoration(color: NC.line, borderRadius: BorderRadius.circular(999))),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18),
            child: product.isTile
                ? Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: (product.tone ?? NC.brand).withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    alignment: Alignment.center,
                    child: Icon(product.icon, color: product.tone ?? NC.brand, size: 84),
                  )
                : Img(product.image, height: 200, width: double.infinity, radius: BorderRadius.circular(20)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(product.name, style: T.h2),
              const SizedBox(height: 6),
              Text(product.desc, style: T.muted),
              const SizedBox(height: 12),
              Text(fcfa(product.price), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: NC.ink)),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
            child: Row(children: [
              ListenableBuilder(
                listenable: cart,
                builder: (_, __) => QtyStepper(
                  qty: cart.qtyOf(product).clamp(0, 99),
                  onAdd: () => cart.add(product, store),
                  onRemove: () => cart.remove(product),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    if (cart.qtyOf(product) == 0) cart.add(product, store);
                    Navigator.pop(context);
                  },
                  child: Container(
                    height: 54,
                    decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
                    alignment: Alignment.center,
                    child: const Text('Ajouter au panier', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                  ),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}
