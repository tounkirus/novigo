import 'package:flutter/material.dart';
import 'theme.dart';
import 'data/brain_api.dart';

/// Restitution des connaissances du NOVIGO Brain au commerçant.
/// Tout est mesuré côté plateforme (Livre de Connaissances) : l'app affiche.

const _section = TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: NC.ink);

class BrainInsightsCard extends StatelessWidget {
  final BrainMerchantInsights insights;
  const BrainInsightsCard({super.key, required this.insights});

  @override
  Widget build(BuildContext context) {
    final trust = insights.trust;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: cardDeco(radius: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(13)),
            child: const Icon(Icons.auto_awesome, color: NC.brand, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('NOVIGO Brain', style: _section),
              Text(
                insights.zone.isEmpty ? 'Ce que la plateforme a appris de vous' : insights.zone,
                style: T.muted,
              ),
            ]),
          ),
          if (insights.busyZone)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(999)),
              child: const Text('Zone tendue',
                  style: TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 11.5)),
            ),
        ]),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(
            child: _metric(
              'Préparation',
              insights.prepMinutes > 0 ? '${insights.prepMinutes} min' : '—',
              insights.prepLearned ? '${insights.prepSamples} commandes observées' : 'estimation',
              Icons.timer_outlined,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _metric(
              'Confiance',
              '${trust.score.round()}/100',
              trust.level.toLowerCase(),
              Icons.verified_outlined,
            ),
          ),
        ]),
        if (insights.peakHours.isNotEmpty) ...[
          const SizedBox(height: 12),
          Row(children: [
            const Icon(Icons.local_fire_department_outlined, size: 17, color: NC.gold),
            const SizedBox(width: 8),
            Expanded(child: Text('Heures de pointe du quartier : ${insights.peakLabel}', style: T.muted)),
          ]),
        ],
        if (insights.advice.isNotEmpty) ...[
          const SizedBox(height: 14),
          Container(height: 1, color: NC.line),
          const SizedBox(height: 14),
          ...insights.advice.map((a) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 2),
                    child: Icon(Icons.lightbulb_outline_rounded, size: 17, color: NC.brand),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(a, style: T.body)),
                ]),
              )),
        ],
      ]),
    );
  }

  Widget _metric(String label, String value, String hint, IconData icon) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(icon, size: 15, color: NC.faint),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(color: NC.faint, fontSize: 12, fontWeight: FontWeight.w600)),
          ]),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 20)),
          const SizedBox(height: 2),
          Text(hint, style: const TextStyle(color: NC.muted, fontSize: 11.5, fontWeight: FontWeight.w500)),
        ]),
      );
}
