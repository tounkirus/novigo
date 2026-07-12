import 'package:flutter/material.dart';
import '../theme.dart';
import '../data.dart';
import 'category.dart';
import 'ride.dart';
import 'location_screen.dart';
import 'recharge.dart';
import 'bills.dart';
import 'wallet_screen.dart';
import 'home_services.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Services', style: T.h1),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(20)),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Text('Tout Bamako dans une seule app',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18, height: 1.2)),
                SizedBox(height: 6),
                Text('Livraison, transport, paiements — en un clic.',
                    style: TextStyle(color: Colors.white70, fontSize: 13)),
              ]),
            ),
            Icon(Icons.auto_awesome_rounded, color: Colors.white.withValues(alpha: 0.85), size: 40),
          ]),
        ),
        const SizedBox(height: 22),
        GestureDetector(
          onTap: () => _push(context, const HomeServicesScreen()),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: cardDeco(radius: 18),
            child: Row(children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.handyman_rounded, color: NC.brand),
              ),
              const SizedBox(width: 14),
              const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Services à domicile', style: T.title),
                SizedBox(height: 3),
                Text('Plombier, électricien, coiffeur, ménage…', style: T.muted),
              ])),
              const Icon(Icons.chevron_right_rounded, color: NC.faint),
            ]),
          ),
        ),
        const SizedBox(height: 22),
        _section('Livraison', 'Tout se fait livrer à Bamako'),
        const SizedBox(height: 12),
        _grid(context, [
          _S('Repas', Icons.restaurant, () => _cat(context, 0)),
          _S('Supermarché', Icons.local_grocery_store, () => _cat(context, 1)),
          _S('Pharmacie', Icons.local_pharmacy, () => _cat(context, 2)),
          _S('Marché', Icons.storefront, () => _cat(context, 3)),
          _S('Colis', Icons.local_shipping, () => _cat(context, 4)),
          _S('Boulangerie', Icons.bakery_dining, () => _cat(context, 5)),
        ]),
        const SizedBox(height: 22),
        _section('Mobilité', 'Déplacez-vous en un clic'),
        const SizedBox(height: 12),
        _grid(context, [
          _S('Taxi', Icons.local_taxi, () => _push(context, const RideScreen(mode: 'taxi'))),
          _S('Moto Taxi', Icons.two_wheeler, () => _push(context, const RideScreen(mode: 'moto'))),
          _S('Location', Icons.car_rental, () => _push(context, const LocationScreen())),
        ]),
        const SizedBox(height: 22),
        _section('Paiement & plus', 'Rechargez, réglez, envoyez'),
        const SizedBox(height: 12),
        _grid(context, [
          _S('NOVIGO Pay', Icons.account_balance_wallet, () => _push(context, const WalletScreen())),
          _S('Recharge', Icons.phone_iphone, () => _push(context, const RechargeScreen())),
          _S('Factures', Icons.receipt_long, () => _push(context, const BillsScreen())),
        ]),
      ]),
    );
  }

  void _cat(BuildContext c, int i) =>
      Navigator.of(c).push(MaterialPageRoute(builder: (_) => CategoryScreen(category: categories[i])));

  void _push(BuildContext c, Widget screen) =>
      Navigator.of(c).push(MaterialPageRoute(builder: (_) => screen));

  Widget _section(String title, String sub) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: T.h2),
        const SizedBox(height: 2),
        Text(sub, style: T.muted),
      ]);

  Widget _grid(BuildContext context, List<_S> items) => GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.7,
        children: [
          for (final s in items)
            GestureDetector(
              onTap: s.onTap,
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: cardDeco(radius: 18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
                    child: Icon(s.icon, color: NC.brand, size: 22),
                  ),
                  Text(s.label, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 15)),
                ]),
              ),
            ),
        ],
      );
}

class _S {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  _S(this.label, this.icon, this.onTap);
}
