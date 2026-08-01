import 'package:flutter/material.dart';
import 'theme.dart';
import 'models.dart' show fcfa;
import 'data/brain_api.dart';

/// Présentation des décisions du NOVIGO Brain côté client.
/// L'application n'invente rien : elle affiche le tarif, le délai et les raisons
/// tels que le Brain les a produits (principes n°2 et n°3).

/// Titre de section de la feuille d'explication.
const _section = TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: NC.ink);

/// Carte « décision du Brain » : tarif de livraison, délai, tension, explication.
class BrainDecisionCard extends StatelessWidget {
  final BrainQuote quote;
  const BrainDecisionCard({super.key, required this.quote});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: cardDeco(radius: R.lg),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.auto_awesome, color: NC.brand, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(quote.live ? 'Décision NOVIGO Brain' : 'Estimation hors ligne',
                  style: const TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(
                '${quote.amount == 0 ? 'Livraison offerte' : fcfa(quote.amount)} · arrivée estimée ${quote.etaMinutes} min',
                style: T.body,
              ),
            ]),
          ),
        ]),
        if (quote.busy || quote.distanceMeters > 0 || quote.zone.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            if (quote.busy)
              _chip('Forte demande ×${quote.surge.toStringAsFixed(2)}', NC.brand, Icons.trending_up_rounded),
            if (quote.distanceMeters > 0)
              _chip('${quote.distanceKm.toStringAsFixed(1)} km', NC.muted, Icons.route_outlined),
            if (quote.zone.isNotEmpty) _chip(quote.zone, NC.muted, Icons.place_outlined),
          ]),
        ],
        const SizedBox(height: 12),
        GestureDetector(
          onTap: () => showBrainExplanation(context, quote),
          behavior: HitTestBehavior.opaque,
          child: const Row(children: [
            Icon(Icons.help_outline_rounded, size: 18, color: NC.brand),
            SizedBox(width: 8),
            Expanded(
              child: Text('Pourquoi ce prix et ce délai ?',
                  style: TextStyle(color: NC.brand, fontWeight: FontWeight.w700, fontSize: 14)),
            ),
            Icon(Icons.chevron_right_rounded, color: NC.brand),
          ]),
        ),
      ]),
    );
  }

  static Widget _chip(String label, Color color, IconData icon) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12.5)),
        ]),
      );
}

/// Feuille d'explication : détail du tarif, raisons, Carré d'Équilibre.
Future<void> showBrainExplanation(BuildContext context, BrainQuote quote) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize: 0.45,
      maxChildSize: 0.94,
      expand: false,
      builder: (context, scroll) => Container(
        decoration: const BoxDecoration(
          color: NC.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
        child: ListView(controller: scroll, padding: const EdgeInsets.fromLTRB(20, 12, 20, 28), children: [
          Center(
            child: Container(
              width: 44,
              height: 5,
              decoration: BoxDecoration(color: NC.line, borderRadius: BorderRadius.circular(999)),
            ),
          ),
          const SizedBox(height: 18),
          Row(children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(14)),
              child: const Icon(Icons.auto_awesome, color: NC.brand),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('NOVIGO Brain', style: T.h2),
                Text(quote.serviceLabel, style: T.muted),
              ]),
            ),
          ]),
          const SizedBox(height: 20),
          if (quote.breakdown.isNotEmpty) ...[
            const Text('Détail du tarif', style: _section),
            const SizedBox(height: 10),
            ...quote.breakdown.map((l) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Expanded(child: Text(l.label, style: T.muted)),
                    Text(l.amount < 0 ? '− ${fcfa(-l.amount)}' : fcfa(l.amount),
                        style: TextStyle(
                          color: l.amount < 0 ? NC.success : NC.ink,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        )),
                  ]),
                )),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Container(height: 1, color: NC.hairline),
            ),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Total livraison',
                  style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 15)),
              Text(quote.amount == 0 ? 'Offerte' : fcfa(quote.amount),
                  style: TextStyle(
                    color: quote.amount == 0 ? NC.success : NC.ink,
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                  )),
            ]),
            const SizedBox(height: 22),
          ],
          const Text('Ce que le Brain a observé', style: _section),
          const SizedBox(height: 10),
          ...quote.reasons.map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 2),
                    child: Icon(Icons.check_circle_outline_rounded, size: 17, color: NC.brand),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(r, style: T.muted)),
                ]),
              )),
          const SizedBox(height: 18),
          const Text('Le Carré d’Équilibre', style: _section),
          const SizedBox(height: 4),
          const Text(
            'Une décision n’est validée que si les quatre parties y trouvent leur compte.',
            style: T.muted,
          ),
          const SizedBox(height: 14),
          ...quote.balance.pillars.map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text(p.key, style: T.body),
                    Text('${p.value}/100',
                        style: const TextStyle(color: NC.muted, fontWeight: FontWeight.w700, fontSize: 13)),
                  ]),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: (p.value.clamp(0, 100)) / 100,
                      minHeight: 7,
                      backgroundColor: NC.line,
                      valueColor: AlwaysStoppedAnimation(p.value >= 70 ? NC.success : NC.brand),
                    ),
                  ),
                ]),
              )),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(14)),
            child: Row(children: [
              const Icon(Icons.verified_outlined, size: 18, color: NC.brand),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  quote.live
                      ? 'Décision enregistrée et traçable${quote.decisionId != null ? ' (réf. ${quote.decisionId!.substring(0, quote.decisionId!.length.clamp(0, 8))})' : ''}.'
                      : 'Estimation locale : la décision réelle est prise par le Brain en ligne.',
                  style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w600, fontSize: 12.5),
                ),
              ),
            ]),
          ),
        ]),
      ),
    ),
  );
}
