import 'package:flutter/material.dart';

import '../cart.dart';
import '../models.dart';
import '../ui/ui.dart';
import '../widgets.dart' show Img, Pill, QtyStepper;

/// Fiche produit — **deux sections** : ce que c'est, combien j'en prends.
///
/// L'écran était purement visuel : « Ajouter au panier » affichait un message et
/// le panier restait vide. Il ajoute désormais réellement les articles au panier
/// global (`cart`), comme la fiche boutique. Le cœur « favori » a été retiré :
/// les favoris de NOVIGO portent sur les commerces, pas sur les produits, et
/// rien ne le stockait.
class ProductDetailScreen extends StatelessWidget {
  final Product product;
  final Store store;

  const ProductDetailScreen({super.key, required this.product, required this.store});

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      body: NovigoContentWidth(
        child: CustomScrollView(slivers: [
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: NC.shell,
            leading: Padding(
              padding: const EdgeInsets.all(Sp.xs + 2),
              child: NovigoIconButton(
                icon: Icons.arrow_back_rounded,
                tooltip: 'Retour',
                background: NC.glass,
                size: 38,
                onPressed: () => Navigator.pop(context),
              ),
            ),
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

          // ───────── Section 1 · Ce que c'est ─────────
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xs),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Wrap(spacing: Sp.sm, runSpacing: Sp.sm, children: [
                  Pill(product.section, color: NC.muted, bg: NC.surface, icon: Icons.category_outlined),
                  if (product.popular)
                    const Pill('Populaire',
                        color: NC.brand,
                        bg: Color(0x1FE53935),
                        icon: Icons.local_fire_department_rounded),
                  if (product.discount != null)
                    Pill('-${product.discount}%', color: Colors.white, bg: NC.brand),
                ]),
                const SizedBox(height: Sp.md + 2),
                Text(product.name, style: T.h1),
                const SizedBox(height: Sp.sm),
                Row(children: [
                  const Icon(Icons.storefront_outlined, size: 16, color: NC.faint),
                  const SizedBox(width: Sp.xs + 2),
                  Expanded(
                    child: Text(store.name,
                        style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ]),
                const SizedBox(height: Sp.md + 2),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(fcfa(product.price),
                      style: const TextStyle(
                          fontSize: 26, fontWeight: FontWeight.w900, color: NC.ink)),
                ),
                const SizedBox(height: Sp.xl),
                const NovigoSectionHeader(overline: 'Détail', title: 'Description'),
                const SizedBox(height: Sp.sm),
                Text(
                  product.desc.isEmpty
                      ? 'Un délice préparé avec soin par ${store.name}. Ingrédients frais et locaux, '
                          'servi chaud et prêt à être livré chez vous.'
                      : product.desc,
                  style: const TextStyle(color: NC.muted, fontSize: 14.5, height: 1.5),
                ),
              ]),
            ),
          ),

          // ───────── Section 2 · Combien j'en prends ─────────
          SliverToBoxAdapter(child: _BuyPanel(product: product, store: store, gutter: gutter)),
          const SliverToBoxAdapter(child: SizedBox(height: Sp.xl)),
        ]),
      ),
    );
  }
}

/// Sélecteur de quantité + ajout réel au panier.
class _BuyPanel extends StatefulWidget {
  final Product product;
  final Store store;
  final double gutter;

  const _BuyPanel({required this.product, required this.store, required this.gutter});

  @override
  State<_BuyPanel> createState() => _BuyPanelState();
}

class _BuyPanelState extends State<_BuyPanel> {
  int _qty = 1;

  void _addToCart() {
    // Le panier ne connaît que l'ajout unitaire : on le répète autant de fois
    // que demandé, plutôt que d'inventer un chemin parallèle.
    for (var i = 0; i < _qty; i++) {
      cart.add(widget.product, widget.store);
    }
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('$_qty × ${widget.product.name} ajouté${_qty > 1 ? 's' : ''} au panier'),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
    Navigator.of(context).maybePop();
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final total = p.price * _qty;

    return Padding(
      padding: EdgeInsets.fromLTRB(widget.gutter, Sp.xl, widget.gutter, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const NovigoSectionHeader(overline: 'Commande', title: 'Quantité'),
        const SizedBox(height: Sp.md),
        Row(children: [
          QtyStepper(
            qty: _qty,
            onAdd: () => setState(() => _qty = (_qty + 1).clamp(1, 99)),
            onRemove: () => setState(() => _qty = (_qty - 1).clamp(1, 99)),
          ),
          const SizedBox(width: Sp.md),
          Expanded(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerRight,
              child: Text('Sous-total : ${fcfa(total)}',
                  style: const TextStyle(color: NC.muted, fontWeight: FontWeight.w600)),
            ),
          ),
        ]),
        const SizedBox(height: Sp.xl - 2),
        NovigoButton(
          label: 'Ajouter au panier',
          icon: Icons.shopping_bag_outlined,
          trailingLabel: fcfa(total),
          onPressed: _addToCart,
        ),
      ]),
    );
  }
}
