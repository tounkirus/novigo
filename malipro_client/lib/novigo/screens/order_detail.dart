import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';

/// Détail d'une commande (démo mock — n'importe aucune vraie commande).
class OrderDetailScreen extends StatelessWidget {
  final String reference;
  final String storeName;
  final String status;
  const OrderDetailScreen({
    super.key,
    required this.reference,
    this.storeName = '',
    this.status = 'En cours',
  });

  // Articles mock déterministes.
  List<_Line> get _lines => const [
        _Line('Poulet Yassa', 2, 3500),
        _Line('Riz au gras', 1, 2500),
        _Line('Jus de bissap', 3, 500),
      ];

  int get _subtotal => _lines.fold(0, (s, l) => s + l.total);
  int get _delivery => 500;
  int get _total => _subtotal + _delivery;

  // Étape courante du stepper selon le statut.
  int get _step {
    final s = status.toLowerCase();
    if (s.contains('livr') && s.contains('é')) return 3; // Livrée
    if (s.contains('route') || s.contains('livraison')) return 2;
    if (s.contains('prépar')) return 1;
    return 0;
  }

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
      appBar: AppBar(title: const Text('Détail de la commande', style: T.h2)),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            _statusHeader(),
            const SizedBox(height: 16),
            _stepper(),
            const SizedBox(height: 20),
            _sectionLabel('Articles'),
            _itemsCard(),
            const SizedBox(height: 18),
            _sectionLabel('Adresse de livraison'),
            _addressCard(),
            const SizedBox(height: 18),
            _sectionLabel('Paiement'),
            _paymentCard(),
            const SizedBox(height: 18),
            _totalsCard(),
            const SizedBox(height: 20),
            _actions(context),
          ],
        ),
      ),
    );
  }

  Widget _statusHeader() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(20)),
      child: Row(children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(14)),
          child: const Icon(Icons.local_shipping_outlined, color: Colors.white),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(storeName.isEmpty ? 'Votre commande' : storeName,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 17)),
            const SizedBox(height: 3),
            Text(reference, style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ]),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
          child: Text(status, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12.5)),
        ),
      ]),
    );
  }

  Widget _stepper() {
    const steps = ['Confirmée', 'Préparation', 'En route', 'Livrée'];
    const icons = [Icons.check_circle_outline, Icons.restaurant_outlined, Icons.pedal_bike, Icons.home_outlined];
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 18),
      decoration: cardDeco(radius: 18),
      child: Row(children: [
        for (int i = 0; i < steps.length; i++) ...[
          Expanded(
            child: Column(children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: i <= _step ? NC.brand : NC.surfaceAlt,
                  shape: BoxShape.circle,
                ),
                child: Icon(icons[i], color: i <= _step ? Colors.white : NC.faint, size: 19),
              ),
              const SizedBox(height: 6),
              Text(steps[i],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: i <= _step ? NC.ink : NC.faint,
                    fontWeight: i <= _step ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 11.5,
                  )),
            ]),
          ),
          if (i < steps.length - 1)
            Container(
              width: 18,
              height: 2,
              margin: const EdgeInsets.only(bottom: 22),
              color: i < _step ? NC.brand : NC.line,
            ),
        ],
      ]),
    );
  }

  Widget _sectionLabel(String t) => Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 10),
        child: Text(t, style: T.h2),
      );

  Widget _itemsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: cardDeco(radius: 18),
      child: Column(children: [
        for (int i = 0; i < _lines.length; i++) ...[
          if (i > 0) const Divider(color: NC.line, height: 22),
          Row(children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(9)),
              alignment: Alignment.center,
              child: Text('${_lines[i].qty}',
                  style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 13)),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(_lines[i].name, style: T.body)),
            Text(fcfa(_lines[i].total), style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700)),
          ]),
        ],
      ]),
    );
  }

  Widget _addressCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: cardDeco(radius: 18),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.home_rounded, color: NC.brand, size: 20),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Domicile', style: T.body),
            SizedBox(height: 3),
            Text('Rue 250, porte 74 · Hamdallaye ACI', style: T.muted),
          ]),
        ),
      ]),
    );
  }

  Widget _paymentCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: cardDeco(radius: 18),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.account_balance_wallet_outlined, color: NC.brand, size: 20),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('NOVIGO Pay', style: T.body),
            SizedBox(height: 3),
            Text('Payé le solde du portefeuille', style: T.muted),
          ]),
        ),
        Icon(Icons.check_circle_rounded, color: NC.success, size: 20),
      ]),
    );
  }

  Widget _totalsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: cardDeco(radius: 18),
      child: Column(children: [
        _totalRow('Sous-total', fcfa(_subtotal)),
        const SizedBox(height: 10),
        _totalRow('Livraison', fcfa(_delivery)),
        const Divider(color: NC.line, height: 24),
        _totalRow('Total', fcfa(_total), strong: true),
      ]),
    );
  }

  Widget _totalRow(String label, String value, {bool strong = false}) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: strong ? T.title : T.muted),
      Text(value,
          style: strong
              ? const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 17)
              : const TextStyle(color: NC.ink, fontWeight: FontWeight.w700)),
    ]);
  }

  Widget _actions(BuildContext context) {
    return Row(children: [
      Expanded(
        child: GestureDetector(
          onTap: () => _snack(context, 'Suivi de la commande $reference'),
          child: Container(
            height: 54,
            decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
            alignment: Alignment.center,
            child: const Text('Suivre', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
          ),
        ),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: GestureDetector(
          onTap: () => _snack(context, 'Articles ajoutés — recommander'),
          child: Container(
            height: 54,
            decoration: BoxDecoration(
              color: NC.surfaceAlt,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: NC.line),
            ),
            alignment: Alignment.center,
            child: const Text('Recommander', style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 16)),
          ),
        ),
      ),
    ]);
  }
}

class _Line {
  final String name;
  final int qty;
  final int price;
  const _Line(this.name, this.qty, this.price);
  int get total => qty * price;
}
