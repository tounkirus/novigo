import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';

import '../cart.dart';
import '../models.dart';
import '../ui/ui.dart';
import '../widgets.dart' show Img, QtyStepper;
import 'checkout.dart';

/// Panier — deux zones : ce que je commande, ce que je paie.
class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Panier', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListenableBuilder(
        listenable: cart,
        builder: (context, _) {
          if (cart.lines.isEmpty) {
            return NovigoEmptyState.empty(
              icon: Icons.shopping_bag_outlined,
              title: 'Votre panier est vide',
              message: 'Ajoutez des articles pour commencer votre commande.',
              actionLabel: 'Parcourir les commerces',
              onAction: () => Navigator.of(context).pop(),
            );
          }
          final store = cart.store!;
          return Column(children: [
            Expanded(
              child: NovigoContentWidth(
                child: ListView(
                  padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, Sp.lg),
                  children: [
                    NovigoCard(
                      padding: const EdgeInsets.all(Sp.md + 2),
                      radius: R.md,
                      child: Row(children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            gradient: NC.brandGradient,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(store.initials,
                              style: const TextStyle(
                                  color: Colors.white, fontWeight: FontWeight.w800)),
                        ),
                        const SizedBox(width: Sp.md),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(store.name,
                                style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                            Text('Livraison ${store.etaMin} min · ${store.district}',
                                style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
                          ]),
                        ),
                      ]),
                    ),
                    const SizedBox(height: Sp.lg),
                    for (final line in cart.lines)
                      Padding(
                        padding: const EdgeInsets.only(bottom: Sp.lg),
                        child: _CartLineRow(line: line),
                      ),
                  ],
                ),
              ),
            ),
            _Summary(gutter: gutter),
          ]);
        },
      ),
    );
  }
}

class _CartLineRow extends StatelessWidget {
  final CartLine line;
  const _CartLineRow({required this.line});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '${line.product.name}, ${line.qty} au panier, ${fcfa(line.total)}',
      child: Row(children: [
        line.product.isTile
            ? Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: (line.product.tone ?? NC.brand).withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(R.sm + 2),
                ),
                child: Icon(line.product.icon, color: line.product.tone ?? NC.brand, size: 28),
              )
            : Img(line.product.image,
                width: 64, height: 64, radius: BorderRadius.circular(R.sm + 2)),
        const SizedBox(width: Sp.md),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(line.product.name, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: Sp.xs),
            Text(fcfa(line.product.price),
                style: const TextStyle(color: NC.muted, fontWeight: FontWeight.w600)),
          ]),
        ),
        const SizedBox(width: Sp.sm),
        QtyStepper(
          qty: line.qty,
          compact: true,
          onAdd: () => cart.add(line.product, line.store),
          onRemove: () => cart.remove(line.product),
        ),
      ]),
    );
  }
}

/// Récapitulatif flottant : le montant reste visible pendant que la liste défile.
class _Summary extends StatelessWidget {
  final double gutter;
  const _Summary({required this.gutter});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(gutter, Sp.lg + 2, gutter, Sp.lg),
      decoration: BoxDecoration(
        color: NC.paper,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(R.xl)),
        border: Border(top: BorderSide(color: NC.hairline)),
        boxShadow: const [
          BoxShadow(color: Color(0x59000000), blurRadius: 26, offset: Offset(0, -10)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          _row('Sous-total', fcfa(cart.subtotal)),
          const SizedBox(height: Sp.sm + 1),
          _row('Livraison', cart.deliveryFee == 0 ? 'Offerte' : fcfa(cart.deliveryFee),
              valueColor: cart.deliveryFee == 0 ? NC.success : NC.ink),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: Sp.md + 1),
            child: NovigoDivider(),
          ),
          _row('Total', fcfa(cart.total), bold: true),
          const SizedBox(height: Sp.lg),
          // L'action principale porte le montant : plus de retour en arrière
          // pour vérifier ce qu'on s'apprête à payer.
          NovigoButton(
            label: 'Commander',
            trailingLabel: fcfa(cart.total),
            onPressed: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const CheckoutScreen())),
          ),
        ]),
      ),
    );
  }

  /// Libellé à gauche, montant à droite. Le libellé cède la place au montant :
  /// c'est le chiffre qui doit rester entier, pas le mot « Sous-total ».
  Widget _row(String l, String v, {bool bold = false, Color? valueColor}) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(
            child: Text(l,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color: bold ? NC.ink : NC.muted,
                    fontSize: bold ? 17 : 15,
                    fontWeight: bold ? FontWeight.w800 : FontWeight.w600)),
          ),
          const SizedBox(width: Sp.md),
          Text(v,
              style: TextStyle(
                  color: valueColor ?? NC.ink,
                  fontSize: bold ? 19 : 15,
                  fontWeight: FontWeight.w800,
                  fontFeatures: const [FontFeature.tabularFigures()])),
        ],
      );
}
