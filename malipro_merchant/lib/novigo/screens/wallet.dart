import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Portefeuille', style: T.title), leading: const BackButton(color: NC.ink)),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Carte solde
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(24)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Text('Revenus disponibles', style: TextStyle(color: Colors.white70, fontSize: 13)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
                child: const Text('NOVIGO Pay', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
              ),
            ]),
            const SizedBox(height: 8),
            const Text('182 400 FCFA', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 34)),
            const SizedBox(height: 4),
            const Text('Aux Trois Fleuves', style: TextStyle(color: Colors.white70, fontSize: 13)),
          ]),
        ),
        const SizedBox(height: 16),
        // Aujourd'hui / Semaine
        Row(children: [
          _stat("Aujourd'hui", '41 300', NC.brand),
          const SizedBox(width: 12),
          _stat('Cette semaine', '286 500', NC.info),
        ]),
        const SizedBox(height: 16),
        // Demander un versement
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Versement demandé — traitement sous 24 h'), duration: Duration(seconds: 1)),
          ),
          child: Container(
            height: 54,
            decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
            alignment: Alignment.center,
            child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.account_balance_rounded, color: Colors.white, size: 19),
              SizedBox(width: 8),
              Text('Demander un versement', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
            ]),
          ),
        ),
        const SizedBox(height: 22),
        const Text('Historique', style: T.h2),
        const SizedBox(height: 12),
        _tx('Vente · MP-100312', "Aujourd'hui · 13:04", 5100, Icons.receipt_long_rounded),
        _tx('Vente · MP-100311', "Aujourd'hui · 12:48", 4300, Icons.receipt_long_rounded),
        _tx('Versement Orange Money', 'Hier · 18:00', -120000, Icons.account_balance_rounded),
        _tx('Vente · MP-100298', 'Hier · 12:10', 7000, Icons.receipt_long_rounded),
        _tx('Vente · MP-100295', 'Lun · 20:22', 3600, Icons.receipt_long_rounded),
        _tx('Versement Orange Money', 'Dim · 09:30', -95000, Icons.account_balance_rounded),
      ]),
    );
  }

  Widget _stat(String label, String value, Color tone) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: cardDeco(radius: 16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: const TextStyle(color: NC.faint, fontSize: 12.5)),
            const SizedBox(height: 8),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(value, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 18)),
                const SizedBox(width: 3),
                const Text('FCFA', style: TextStyle(color: NC.faint, fontSize: 11)),
              ]),
            ),
            const SizedBox(height: 6),
            Icon(Icons.trending_up_rounded, size: 16, color: tone),
          ]),
        ),
      );

  Widget _tx(String name, String when, int amount, IconData icon) {
    final credit = amount > 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: cardDeco(radius: 16),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
              color: (credit ? NC.success : NC.brand).withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: credit ? NC.success : NC.brand, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
          Text(when, style: T.muted),
        ])),
        Text('${credit ? '+' : '−'}${fcfa(amount.abs())}',
            style: TextStyle(color: credit ? NC.success : NC.ink, fontWeight: FontWeight.w800, fontSize: 13.5)),
      ]),
    );
  }
}
