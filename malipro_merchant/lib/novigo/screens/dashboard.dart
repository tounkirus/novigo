import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../state.dart';
import '../data.dart';
import '../brain_widgets.dart';
import 'orders.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListenableBuilder(
        listenable: merchant,
        builder: (_, __) {
          final toHandle = merchant.toHandle;
          return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 24), children: [
            _header(),
            const SizedBox(height: 16),
            _openCard(),
            const SizedBox(height: 18),
            const Text("Aujourd'hui", style: T.h2),
            const SizedBox(height: 12),
            _kpiRow(),
            const SizedBox(height: 18),
            _weekCard(),
            // Conseils du NOVIGO Brain : préparation apprise, confiance, pointe.
            if (merchant.brainInsights != null) ...[
              const SizedBox(height: 18),
              BrainInsightsCard(insights: merchant.brainInsights!),
            ],
            const SizedBox(height: 22),
            Row(children: [
              const Text('Commandes à traiter', style: T.h2),
              const Spacer(),
              if (toHandle.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(999)),
                  child: Text('${toHandle.length}',
                      style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 13)),
                ),
            ]),
            const SizedBox(height: 12),
            if (toHandle.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: cardDeco(radius: 18),
                child: const Row(children: [
                  Icon(Icons.check_circle_rounded, color: NC.success),
                  SizedBox(width: 12),
                  Expanded(child: Text('Tout est à jour, aucune commande en attente.', style: T.muted)),
                ]),
              )
            else
              for (final o in toHandle) ...[
                OrderCard(order: o),
                const SizedBox(height: 12),
              ],
          ]);
        },
      ),
    );
  }

  Widget _header() => Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
          alignment: Alignment.center,
          child: const Text('N', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Espace marchand', style: TextStyle(color: NC.faint, fontSize: 12, fontWeight: FontWeight.w600)),
            Text(Shop.name, style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 17)),
          ]),
        ),
        Container(
          width: 42,
          height: 42,
          decoration: const BoxDecoration(color: NC.surface, shape: BoxShape.circle),
          child: const Icon(Icons.notifications_none_rounded, color: NC.ink, size: 22),
        ),
      ]);

  Widget _openCard() {
    final open = merchant.open;
    final c = open ? NC.success : NC.faint;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: cardDeco(radius: 20, border: Border.all(color: c.withValues(alpha: 0.35), width: 1)),
      child: Row(children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(color: c.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
          child: Icon(open ? Icons.storefront_rounded : Icons.nightlight_round, color: c),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(open ? 'Ouvert' : 'Fermé',
                style: TextStyle(color: c, fontWeight: FontWeight.w800, fontSize: 17)),
            const SizedBox(height: 2),
            Text(open ? 'Vous recevez des commandes' : 'Vous ne recevez plus de commandes',
                style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
        Switch(
          value: open,
          onChanged: (_) => merchant.toggleOpen(),
          activeThumbColor: Colors.white,
          activeTrackColor: NC.success,
          inactiveThumbColor: Colors.white,
          inactiveTrackColor: NC.surfaceAlt,
        ),
      ]),
    );
  }

  Widget _kpiRow() => Column(children: [
        Row(children: [
          _kpi(Icons.payments_rounded, fcfa(merchant.todayRevenue), "Chiffre d'affaires", NC.brand),
          const SizedBox(width: 12),
          _kpi(Icons.receipt_long_rounded, '${merchant.todayOrders}', 'Commandes', NC.info),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _kpi(Icons.shopping_basket_rounded, fcfa(merchant.avgBasket), 'Panier moyen', NC.violet),
          const SizedBox(width: 12),
          _kpi(Icons.star_rounded, merchant.rating.toStringAsFixed(1), 'Note', NC.gold),
        ]),
      ]);

  Widget _kpi(IconData icon, String value, String label, Color tone) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: cardDeco(radius: 18),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(color: tone.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: tone, size: 20),
            ),
            const SizedBox(height: 10),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(value, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 18)),
            ),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: NC.faint, fontSize: 12)),
          ]),
        ),
      );

  Widget _weekCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: cardDeco(radius: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Text('Ventes de la semaine', style: T.title),
          Spacer(),
          Icon(Icons.trending_up_rounded, size: 18, color: NC.success),
          SizedBox(width: 4),
          Text('+12%', style: TextStyle(color: NC.success, fontWeight: FontWeight.w800, fontSize: 13)),
        ]),
        const SizedBox(height: 16),
        SizedBox(
          height: 120,
          child: CustomPaint(
            size: const Size(double.infinity, 120),
            painter: _BarsPainter(weekSales),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            for (final d in weekDays)
              Text(d, style: const TextStyle(color: NC.faint, fontSize: 11.5, fontWeight: FontWeight.w600)),
          ],
        ),
      ]),
    );
  }

}

/// Mini graphe barres (7 barres, dégradé rouge).
class _BarsPainter extends CustomPainter {
  final List<double> values;
  _BarsPainter(this.values);

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) return;
    final maxV = values.reduce((a, b) => a > b ? a : b);
    final n = values.length;
    const gap = 12.0;
    final barW = (size.width - gap * (n - 1)) / n;
    final radius = Radius.circular(barW / 2.6);

    final trackPaint = Paint()..color = NC.surfaceAlt;

    for (int i = 0; i < n; i++) {
      final x = i * (barW + gap);
      // piste de fond
      final track = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, 0, barW, size.height),
        radius,
      );
      canvas.drawRRect(track, trackPaint);

      final h = maxV == 0 ? 0.0 : (values[i] / maxV) * size.height;
      final top = size.height - h;
      final rect = Rect.fromLTWH(x, top, barW, h);
      final barPaint = Paint()
        ..shader = const LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [NC.brandDark, NC.brand],
        ).createShader(rect);
      canvas.drawRRect(RRect.fromRectAndRadius(rect, radius), barPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _BarsPainter old) => old.values != values;
}
