import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../state.dart';

class EarningsScreen extends StatelessWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListenableBuilder(
        listenable: driver,
        builder: (context, _) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Mes gains', style: T.h1),
            const SizedBox(height: 16),
            // Carte solde
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(24)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Text('Gains disponibles', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
                    child: const Text('Orange Money', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
                  ),
                ]),
                const SizedBox(height: 8),
                Text(fcfa(driver.availableEarnings),
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 34,
                        fontFeatures: [FontFeature.tabularFigures()])),
                const SizedBox(height: 4),
                const Text('Moussa Keïta · Coursier NOVIGO', style: TextStyle(color: Colors.white70, fontSize: 13)),
              ]),
            ),
            const SizedBox(height: 14),
            Row(children: [
              _sub('Aujourd\'hui', driver.todayEarnings, NC.success),
              const SizedBox(width: 12),
              _sub('Cette semaine', driver.weekEarnings, NC.info),
            ]),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: NC.brand,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Retrait vers Orange Money — bientôt disponible'), duration: Duration(seconds: 1)),
                ),
                icon: const Icon(Icons.south_west_rounded, color: Colors.white),
                label: const Text('Retirer mes gains',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
              ),
            ),
            const SizedBox(height: 22),
            const Text('Historique', style: T.h2),
            const SizedBox(height: 12),
            ...driver.earnings.map((t) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _tx(t),
                )),
          ],
        ),
      ),
    );
  }

  Widget _sub(String label, int amount, Color c) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: cardDeco(radius: 18),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(color: c.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(9)),
                child: Icon(Icons.trending_up_rounded, color: c, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(child: Text(label, style: const TextStyle(color: NC.faint, fontSize: 12, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
            ]),
            const SizedBox(height: 10),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(fcfa(amount),
                  style: const TextStyle(
                      color: NC.ink,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      fontFeatures: [FontFeature.tabularFigures()])),
            ),
          ]),
        ),
      );

  Widget _tx(EarningTx t) {
    final credit = t.amount > 0;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: cardDeco(radius: 16),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
              color: (credit ? NC.success : NC.brand).withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12)),
          child: Icon(t.icon, color: credit ? NC.success : NC.brand, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t.label, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            Text(t.when, style: T.muted),
          ]),
        ),
        Text('${credit ? '+' : '−'}${fcfa(t.amount.abs())}',
            style: TextStyle(
                color: credit ? NC.success : NC.ink,
                fontWeight: FontWeight.w800,
                fontSize: 13.5,
                fontFeatures: const [FontFeature.tabularFigures()])),
      ]),
    );
  }
}
