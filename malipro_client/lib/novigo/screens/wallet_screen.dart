import 'package:flutter/material.dart';
import '../data/session.dart';
import '../models.dart';
import '../ui/ui.dart';

/// NOVIGO Pay.
///
/// Deux usages : poussé depuis un service (`embedded: false`, avec sa barre de
/// titre et son bouton retour) ou servi comme onglet du Shell
/// (`embedded: true`, sans `Scaffold` ni retour — on n'empile pas deux barres).
class WalletScreen extends StatelessWidget {
  final bool embedded;
  const WalletScreen({super.key, this.embedded = false});

  @override
  Widget build(BuildContext context) {
    if (embedded) return SafeArea(bottom: false, child: _body(context, showTitle: true));
    return Scaffold(
      appBar: AppBar(title: const Text('NOVIGO Pay', style: T.title), leading: const BackButton(color: NC.ink)),
      body: _body(context),
    );
  }

  Widget _body(BuildContext context, {bool showTitle = false}) {
    final gutter = Rs.of(context).gutter;
    return NovigoContentWidth(
      child: ListView(
        padding: EdgeInsets.fromLTRB(gutter, showTitle ? Sp.sm : Sp.lg, gutter, 110),
        children: [
        if (showTitle) ...[
          const Text('NOVIGO Pay', style: T.h1),
          const SizedBox(height: Sp.lg),
        ],
        // Carte solde
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: NC.premiumGradient,
            borderRadius: BorderRadius.circular(R.xl),
            border: Border.all(color: NC.hairline),
            boxShadow: [
              BoxShadow(color: NC.brand.withValues(alpha: 0.20), blurRadius: 28, offset: const Offset(0, 14)),
            ],
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Text('Solde disponible', style: TextStyle(color: Colors.white70, fontSize: 13)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(R.pill)),
                child: const Text('•••• 4271', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
              ),
            ]),
            const SizedBox(height: 8),
            const Text('45 200 FCFA', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 34)),
            const SizedBox(height: 4),
            // Le titulaire affiché est le compte réellement connecté — un nom
            // de démonstration sur le solde de quelqu'un d'autre inquiète.
            Text(session.phone ?? 'Compte NOVIGO',
                style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ]),
        ),
        const SizedBox(height: 18),
        // Actions rapides
        Row(children: [
          _action(context, Icons.add_rounded, 'Recharger', NC.brand),
          _action(context, Icons.north_east_rounded, 'Envoyer', NC.success),
          _action(context, Icons.south_west_rounded, 'Retirer', NC.gold),
          _action(context, Icons.qr_code_scanner_rounded, 'Payer', const Color(0xFF7C6CF6)),
        ]),
        const SizedBox(height: 22),
        const Text('Recharger rapidement', style: T.h2),
        const SizedBox(height: 12),
        Row(children: [
          _amount('5 000'),
          const SizedBox(width: 10),
          _amount('10 000'),
          const SizedBox(width: 10),
          _amount('25 000'),
        ]),
        const SizedBox(height: 22),
        const Text('Transactions', style: T.h2),
        const SizedBox(height: 12),
        _tx('Aux Trois Fleuves', 'Aujourd\'hui · 12:40', -4300, Icons.restaurant),
        _tx('Recharge Orange Money', 'Hier · 09:15', 20000, Icons.add_circle_outline),
        _tx('Pharmacie du Point G', 'Lun · 18:22', -6500, Icons.local_pharmacy),
        _tx('Envoi à Aïcha D.', 'Dim · 20:05', -10000, Icons.north_east_rounded),
        _tx('Cashback NOVIGO', 'Sam · 14:00', 1200, Icons.card_giftcard_rounded),
        ],
      ),
    );
  }

  Widget _action(BuildContext context, IconData icon, String label, Color c) => Expanded(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('$label — bientôt disponible'), duration: const Duration(seconds: 1)),
          ),
          child: Column(children: [
            Container(
              width: 54, height: 54,
              decoration: BoxDecoration(color: c.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(18)),
              child: Icon(icon, color: c, size: 24),
            ),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(color: NC.ink, fontSize: 12.5, fontWeight: FontWeight.w600)),
          ]),
        ),
      );

  Widget _amount(String v) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: cardDeco(radius: R.md),
          alignment: Alignment.center,
          child: Column(children: [
            Text(v, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 17)),
            const SizedBox(height: 2),
            const Text('FCFA', style: TextStyle(color: NC.faint, fontSize: 11)),
          ]),
        ),
      );

  Widget _tx(String name, String when, int amount, IconData icon) {
    final credit = amount > 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: cardDeco(radius: R.md),
      child: Row(children: [
        Container(
          width: 42, height: 42,
          decoration: BoxDecoration(
              color: (credit ? NC.success : NC.brand).withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: credit ? NC.success : NC.brand, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
          Text(when, style: T.muted),
        ])),
        Text('${credit ? '+' : '−'}${fcfa(amount.abs())}',
            style: TextStyle(color: credit ? NC.success : NC.ink, fontWeight: FontWeight.w800, fontSize: 13.5)),
      ]),
    );
  }
}
