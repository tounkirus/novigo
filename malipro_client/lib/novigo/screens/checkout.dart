import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../cart.dart';
import '../data/env.dart';
import '../data/orders_api.dart';
import 'tracking.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  int _pay = 0;
  final _pays = const [
    ['Orange Money', Icons.smartphone, Color(0xFFFF7900)],
    ['Wave', Icons.account_balance_wallet, Color(0xFF1DC8F2)],
    ['Espèces à la livraison', Icons.payments_outlined, NC.success],
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Commander', style: T.title), leading: const BackButton(color: NC.ink)),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        _card(
          icon: Icons.location_on_outlined,
          title: 'Adresse de livraison',
          child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Domicile · Hamdallaye ACI', style: T.body),
            SizedBox(height: 4),
            Text('Rue 250, porte 74 · Bamako', style: T.muted),
          ]),
        ),
        const SizedBox(height: 14),
        _card(
          icon: Icons.access_time_rounded,
          title: 'Livraison estimée',
          child: Text('${cart.store?.etaMin ?? 30} min · par coursier NOVIGO', style: T.body),
        ),
        const SizedBox(height: 14),
        const Text('Paiement', style: T.h2),
        const SizedBox(height: 10),
        ...List.generate(_pays.length, (i) {
          final p = _pays[i];
          final on = i == _pay;
          return GestureDetector(
            onTap: () => setState(() => _pay = i),
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: NC.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: on ? NC.brand : NC.line, width: on ? 2 : 1),
              ),
              child: Row(children: [
                Icon(p[1] as IconData, color: p[2] as Color),
                const SizedBox(width: 12),
                Expanded(child: Text(p[0] as String, style: T.body)),
                Icon(on ? Icons.radio_button_checked : Icons.radio_button_unchecked, color: on ? NC.brand : NC.faint),
              ]),
            ),
          );
        }),
        const SizedBox(height: 8),
        _totals(),
      ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: GestureDetector(
            onTap: () => _confirm(context),
            child: Container(
              height: 56,
              decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
              alignment: Alignment.center,
              child: Text('Confirmer · ${fcfa(cart.total)}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 17)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _card({required IconData icon, required String title, required Widget child}) => Container(
        padding: const EdgeInsets.all(16),
        decoration: cardDeco(radius: 16),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: NC.brand, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            child,
          ])),
        ]),
      );

  Widget _totals() => Container(
        padding: const EdgeInsets.all(16),
        decoration: cardDeco(radius: 16),
        child: Column(children: [
          _r('Sous-total', fcfa(cart.subtotal)),
          const SizedBox(height: 8),
          _r('Livraison', cart.deliveryFee == 0 ? 'Offerte' : fcfa(cart.deliveryFee)),
          const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(color: NC.line, height: 1)),
          _r('Total', fcfa(cart.total), bold: true),
        ]),
      );

  Widget _r(String l, String v, {bool bold = false}) => Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(l, style: TextStyle(color: bold ? NC.ink : NC.muted, fontWeight: bold ? FontWeight.w800 : FontWeight.w600, fontSize: bold ? 16 : 14)),
        Text(v, style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: bold ? 17 : 14)),
      ]);

  Future<void> _confirm(BuildContext context) async {
    final storeName = cart.store?.name ?? '';
    final eta = cart.store?.etaMin ?? 30;
    String orderId = '';
    String reference = '';
    // Mode live : place réellement la commande sur le backend via le Gateway.
    if (NovigoEnv.live && cart.lines.isNotEmpty) {
      try {
        final placed = await placeLiveOrder(cart, payIndex: _pay);
        orderId = placed.id;
        reference = placed.reference;
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('Backend indisponible — commande en mode démo'),
              duration: Duration(seconds: 2)));
        }
      }
    }
    if (!context.mounted) return;
    cart.clear();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
          builder: (_) => _OrderPlaced(
              storeName: storeName, eta: eta, orderId: orderId, reference: reference)),
      (r) => r.isFirst,
    );
  }
}

class _OrderPlaced extends StatelessWidget {
  final String storeName;
  final int eta;
  final String orderId;
  final String reference;
  const _OrderPlaced({
    required this.storeName,
    required this.eta,
    this.orderId = '',
    this.reference = '',
  });
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            const Spacer(),
            Container(
              width: 96, height: 96,
              decoration: BoxDecoration(color: NC.successSoft, shape: BoxShape.circle),
              child: const Icon(Icons.check_rounded, color: NC.success, size: 52),
            ),
            const SizedBox(height: 20),
            const Text('Commande confirmée !', style: T.h1, textAlign: TextAlign.center),
            const SizedBox(height: 10),
            Text(
                reference.isNotEmpty
                    ? 'Commande $reference\n$storeName prépare votre commande.\nLivraison estimée dans $eta min.'
                    : '$storeName prépare votre commande.\nLivraison estimée dans $eta min.',
                style: T.muted, textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: cardDeco(radius: 18),
              child: Row(children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.pedal_bike, color: NC.brand),
                ),
                const SizedBox(width: 12),
                const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Coursier en route', style: T.body),
                  Text('Vous serez notifié à chaque étape', style: T.muted),
                ])),
              ]),
            ),
            const Spacer(),
            GestureDetector(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => TrackingScreen(storeName: storeName, eta: eta, orderId: orderId))),
              child: Container(
                height: 56, width: double.infinity,
                decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
                alignment: Alignment.center,
                child: const Text('Suivre ma commande', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
              child: const Text('Retour à l’accueil', style: TextStyle(color: NC.muted, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
      ),
    );
  }
}
