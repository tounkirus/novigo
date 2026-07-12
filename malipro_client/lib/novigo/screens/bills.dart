import 'package:flutter/material.dart';
import '../theme.dart';
import '../widgets.dart';

/// Paiement de factures — fournisseurs maliens (EDM, SOMAGEP, télécoms, TV...).
class BillsScreen extends StatelessWidget {
  const BillsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Factures', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Hero gradient
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(22)),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Text('Payez vos factures en un instant',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20, height: 1.15)),
                SizedBox(height: 8),
                Text('Électricité, eau, télécom, TV — réglez tout depuis NOVIGO, sans file d\'attente.',
                    style: TextStyle(color: Colors.white70, fontSize: 13.5, height: 1.3)),
              ]),
            ),
            const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 54),
          ]),
        ),
        const SizedBox(height: 22),

        // Fournisseurs
        const Text('Fournisseurs', style: T.h2),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.92,
          children: const [
            _Provider(Icons.bolt_rounded, 'EDM', 'Électricité', Color(0xFFFFC043)),
            _Provider(Icons.water_drop_rounded, 'SOMAGEP', 'Eau', Color(0xFF2196F3)),
            _Provider(Icons.sim_card_rounded, 'Orange', 'Mobile / Fibre', Color(0xFFFF7A00)),
            _Provider(Icons.sim_card_rounded, 'Malitel', 'Mobile', Color(0xFF2ECC71)),
            _Provider(Icons.sim_card_rounded, 'Telecel', 'Mobile', Color(0xFF7C4DFF)),
            _Provider(Icons.tv_rounded, 'Canal+', 'Télévision', Color(0xFFE53935)),
            _Provider(Icons.flight_rounded, 'ASKY', 'Billets / Abo', Color(0xFF00BCD4)),
            _Provider(Icons.wifi_rounded, 'Orange Fibre', 'Internet', Color(0xFFFF7A00)),
            _Provider(Icons.more_horiz_rounded, 'Autres', 'Voir tout', NC.muted),
          ],
        ),
        const SizedBox(height: 24),

        // Facture à payer (exemple)
        const Text('Facture à payer', style: T.h2),
        const SizedBox(height: 12),
        Container(
          decoration: cardDeco(radius: 20),
          padding: const EdgeInsets.all(18),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                width: 46, height: 46,
                decoration: BoxDecoration(
                    color: const Color(0xFFFFC043).withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.bolt_rounded, color: Color(0xFFFFC043), size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Text('EDM — Électricité', style: T.title),
                SizedBox(height: 2),
                Text('Compteur N° 0021 4478 991', style: T.muted),
              ])),
              const Pill('À échéance', color: NC.warning, bg: Color(0x22FF9800), icon: Icons.schedule_rounded),
            ]),
            const SizedBox(height: 16),
            const Divider(color: NC.line, height: 1),
            const SizedBox(height: 14),
            _line('Référence', 'FACT-2026-07-4471'),
            const SizedBox(height: 10),
            _line('Échéance', '15 juillet 2026'),
            const SizedBox(height: 10),
            Row(children: [
              const Text('Montant dû', style: T.muted),
              const Spacer(),
              const Text('12 400 FCFA',
                  style: TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 20)),
            ]),
            const SizedBox(height: 18),
            GestureDetector(
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Paiement de 12 400 FCFA — bientôt disponible'), duration: Duration(seconds: 1)),
              ),
              child: Container(
                height: 56,
                decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
                alignment: Alignment.center,
                child: const Text('Payer 12 400 FCFA',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 24),

        // Factures récentes
        const Text('Factures récentes', style: T.h2),
        const SizedBox(height: 12),
        _recent('SOMAGEP — Eau', 'Payée le 02 juil.', '8 750 FCFA', Icons.water_drop_rounded, const Color(0xFF2196F3), true),
        _recent('Canal+ Access', 'Payée le 28 juin', '10 000 FCFA', Icons.tv_rounded, NC.brand, true),
        _recent('Orange Fibre', 'En attente', '25 000 FCFA', Icons.wifi_rounded, const Color(0xFFFF7A00), false),
        _recent('EDM — Électricité', 'Payée le 12 juin', '11 200 FCFA', Icons.bolt_rounded, const Color(0xFFFFC043), true),
      ]),
    );
  }

  static Widget _line(String k, String v) => Row(children: [
        Text(k, style: T.muted),
        const Spacer(),
        Text(v, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 14)),
      ]);

  static Widget _recent(String name, String status, String amount, IconData icon, Color c, bool paid) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: cardDeco(radius: 16),
      child: Row(children: [
        Container(
          width: 42, height: 42,
          decoration: BoxDecoration(color: c.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: c, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
          Row(children: [
            Container(
              width: 8, height: 8,
              decoration: BoxDecoration(color: paid ? NC.success : NC.error, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
            Text(status, style: TextStyle(color: paid ? NC.success : NC.error, fontSize: 12.5, fontWeight: FontWeight.w600)),
          ]),
        ])),
        Text(amount, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 13.5)),
      ]),
    );
  }
}

class _Provider extends StatelessWidget {
  final IconData icon;
  final String name, sub;
  final Color color;
  const _Provider(this.icon, this.name, this.sub, this.color);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$name — bientôt disponible'), duration: const Duration(seconds: 1)),
      ),
      child: Container(
        decoration: cardDeco(radius: 18),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 46, height: 46,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(name,
              style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 13),
              maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 1),
          Text(sub,
              style: const TextStyle(color: NC.faint, fontSize: 11),
              maxLines: 1, overflow: TextOverflow.ellipsis),
        ]),
      ),
    );
  }
}
