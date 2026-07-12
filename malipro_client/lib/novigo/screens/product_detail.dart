import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../widgets.dart';

/// Fiche produit détaillée (visuelle — n'ajoute pas réellement au panier).
class ProductDetailScreen extends StatelessWidget {
  final Product product;
  final Store store;
  const ProductDetailScreen({super.key, required this.product, required this.store});

  void _snack(BuildContext context, String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 260,
          pinned: true,
          backgroundColor: NC.shell,
          leading: _circleBtn(Icons.arrow_back, () => Navigator.pop(context)),
          actions: [
            _circleBtn(Icons.favorite_border, () => _snack(context, 'Ajouté aux favoris')),
            _circleBtn(Icons.share_outlined, () => _snack(context, 'Partager ce produit')),
            const SizedBox(width: 6),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(fit: StackFit.expand, children: [
              product.isTile
                  ? Container(
                      color: (product.tone ?? NC.brand).withValues(alpha: 0.16),
                      alignment: Alignment.center,
                      child: Icon(product.icon, color: product.tone ?? NC.brand, size: 110),
                    )
                  : Img(product.image, height: 260, fit: BoxFit.cover),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xCC0F1117), NC.shell],
                    stops: [0.45, 0.85, 1.0],
                  ),
                ),
              ),
            ]),
          ),
        ),
        SliverToBoxAdapter(child: _info()),
        SliverToBoxAdapter(child: _BuyPanel(product: product, store: store)),
        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ]),
    );
  }

  Widget _circleBtn(IconData i, VoidCallback onTap) => Padding(
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

  Widget _info() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Pill(product.section, color: NC.muted, bg: NC.surface, icon: Icons.category_outlined),
          if (product.popular) ...[
            const SizedBox(width: 8),
            const Pill('Populaire', color: NC.brand, bg: Color(0x1FE53935), icon: Icons.local_fire_department_rounded),
          ],
          if (product.discount != null) ...[
            const SizedBox(width: 8),
            Pill('-${product.discount}%', color: Colors.white, bg: NC.brand),
          ],
        ]),
        const SizedBox(height: 14),
        Text(product.name, style: T.h1),
        const SizedBox(height: 8),
        Row(children: [
          const Icon(Icons.storefront_outlined, size: 16, color: NC.faint),
          const SizedBox(width: 6),
          Expanded(child: Text(store.name, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis)),
        ]),
        const SizedBox(height: 14),
        Text(fcfa(product.price), style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: NC.ink)),
        const SizedBox(height: 20),
        const Text('Description', style: T.h2),
        const SizedBox(height: 8),
        Text(
          product.desc.isEmpty
              ? 'Un délice préparé avec soin par ${store.name}. Ingrédients frais et locaux, servi chaud et prêt à être livré chez vous.'
              : product.desc,
          style: const TextStyle(color: NC.muted, fontSize: 14.5, height: 1.5),
        ),
      ]),
    );
  }
}

/// Sélecteur de quantité + bouton d'ajout (état local, visuel).
class _BuyPanel extends StatefulWidget {
  final Product product;
  final Store store;
  const _BuyPanel({required this.product, required this.store});

  @override
  State<_BuyPanel> createState() => _BuyPanelState();
}

class _BuyPanelState extends State<_BuyPanel> {
  int _qty = 1;

  void _snack(String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final total = p.price * _qty;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 16, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Quantité', style: T.h2),
        const SizedBox(height: 12),
        Row(children: [
          QtyStepper(
            qty: _qty,
            onAdd: () => setState(() => _qty = (_qty + 1).clamp(1, 99)),
            onRemove: () => setState(() => _qty = (_qty - 1).clamp(1, 99)),
          ),
          const Spacer(),
          Text('Sous-total : ${fcfa(total)}', style: const TextStyle(color: NC.muted, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 22),
        GestureDetector(
          onTap: () => _snack('$_qty × ${p.name} — ajouté au panier'),
          child: Container(
            height: 58,
            padding: const EdgeInsets.symmetric(horizontal: 18),
            decoration: BoxDecoration(
              gradient: NC.brandGradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(color: NC.brand.withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 8)),
              ],
            ),
            child: Row(children: [
              const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              const Text('Ajouter au panier', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              const Spacer(),
              Text(fcfa(total), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
            ]),
          ),
        ),
      ]),
    );
  }
}
