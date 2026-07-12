import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../cart.dart';
import '../widgets.dart';
import 'checkout.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Panier', style: T.title)),
      body: ListenableBuilder(
        listenable: cart,
        builder: (_, __) {
          if (cart.lines.isEmpty) return _empty();
          return Column(children: [
            Expanded(
              child: ListView(padding: const EdgeInsets.all(16), children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: cardDeco(radius: 16),
                  child: Row(children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(12)),
                      alignment: Alignment.center,
                      child: Text(cart.store!.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(cart.store!.name, style: T.title),
                      Text('Livraison ${cart.store!.etaMin} min · ${cart.store!.district}', style: T.muted),
                    ])),
                  ]),
                ),
                const SizedBox(height: 8),
                ...cart.lines.map((l) => _line(l)),
              ]),
            ),
            _summary(context),
          ]);
        },
      ),
    );
  }

  Widget _line(CartLine l) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(children: [
          Img(l.product.image, width: 64, height: 64, radius: BorderRadius.circular(14)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l.product.name, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(fcfa(l.product.price), style: const TextStyle(color: NC.muted, fontWeight: FontWeight.w600)),
          ])),
          QtyStepper(qty: l.qty, compact: true, onAdd: () => cart.add(l.product, l.store), onRemove: () => cart.remove(l.product)),
        ]),
      );

  Widget _summary(BuildContext context) => Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
        decoration: const BoxDecoration(color: NC.paper, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        child: SafeArea(top: false, child: Column(mainAxisSize: MainAxisSize.min, children: [
          _row('Sous-total', fcfa(cart.subtotal)),
          const SizedBox(height: 8),
          _row('Livraison', cart.deliveryFee == 0 ? 'Offerte' : fcfa(cart.deliveryFee),
              valueColor: cart.deliveryFee == 0 ? NC.success : NC.ink),
          const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider(color: NC.line, height: 1)),
          _row('Total', fcfa(cart.total), bold: true),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CheckoutScreen())),
            child: Container(
              height: 56,
              decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
              alignment: Alignment.center,
              child: const Text('Commander', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 17)),
            ),
          ),
        ])),
      );

  Widget _row(String l, String v, {bool bold = false, Color? valueColor}) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(l, style: TextStyle(color: bold ? NC.ink : NC.muted, fontSize: bold ? 17 : 15, fontWeight: bold ? FontWeight.w800 : FontWeight.w600)),
          Text(v, style: TextStyle(color: valueColor ?? NC.ink, fontSize: bold ? 18 : 15, fontWeight: FontWeight.w800)),
        ],
      );

  Widget _empty() => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 84, height: 84,
            decoration: BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(24)),
            child: const Icon(Icons.shopping_bag_outlined, color: NC.brand, size: 38),
          ),
          const SizedBox(height: 16),
          const Text('Votre panier est vide', style: T.h2),
          const SizedBox(height: 6),
          const Text('Ajoutez des plats pour commencer.', style: T.muted),
        ]),
      );
}
