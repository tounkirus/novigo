import 'package:flutter/material.dart';

import '../../data/env.dart';
import '../../models.dart' show fcfa;
import '../../ui/ui.dart';
import 'hub.dart';

/// Une intervention réservée.
class _Intervention {
  final String provider, trade, service, date, status;
  final int amount;
  final Color tone;
  final IconData icon;
  const _Intervention(
      this.provider, this.trade, this.service, this.date, this.status, this.amount, this.tone, this.icon);
}

/// Jeu de démonstration : aucun endpoint ne liste encore les interventions d'un
/// client. En mode live, l'écran le signale explicitement plutôt que de faire
/// passer ces quatre lignes pour l'historique réel de l'utilisateur.
const _demoInterventions = <_Intervention>[
  _Intervention('Moussa Coulibaly', 'Climatisation', 'Recharge de gaz', 'Aujourd\'hui · 14:00',
      'En cours', 20000, NC.warning, Icons.ac_unit),
  _Intervention('Amadou Traoré', 'Plombier', 'Réparation de fuite', 'Demain · 10:00', 'À venir',
      8000, NC.info, Icons.plumbing),
  _Intervention('Fatoumata Diarra', 'Esthéticienne', 'Soin du visage', 'Lun. dernier · 16:00',
      'Terminée', 15000, NC.success, Icons.spa),
  _Intervention('Ibrahim Keïta', 'Électricien', 'Dépannage panne', 'Il y a 3 jours · 09:00',
      'Terminée', 10000, NC.success, Icons.electrical_services),
];

/// Mes interventions.
class HsInterventionsScreen extends StatelessWidget {
  const HsInterventionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    const items = _demoInterventions;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes interventions', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: NovigoContentWidth(
        child: items.isEmpty
            ? const _Empty()
            : ListView(
                padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xl),
                children: [
                  if (NovigoEnv.live) ...[
                    const NovigoDemoBanner(
                      message:
                          'Exemples de démonstration — le suivi réel des interventions arrive bientôt.',
                    ),
                    const SizedBox(height: Sp.md),
                  ],
                  for (var i = 0; i < items.length; i++) ...[
                    if (i > 0) const SizedBox(height: Sp.md),
                    FadeSlideIn(index: i, child: _InterventionCard(intervention: items[i])),
                  ],
                ],
              ),
      ),
    );
  }
}

class _InterventionCard extends StatelessWidget {
  final _Intervention intervention;
  const _InterventionCard({required this.intervention});

  @override
  Widget build(BuildContext context) {
    final it = intervention;
    return NovigoCard(
      padding: const EdgeInsets.all(Sp.md + 2),
      semanticLabel: '${it.service}, ${it.provider}, ${it.status}, ${it.date}, ${fcfa(it.amount)}',
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
                color: it.tone.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
            child: Icon(it.icon, color: it.tone, size: 24),
          ),
          const SizedBox(width: Sp.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(it.service, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text('${it.provider} · ${it.trade}',
                  style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ),
          const SizedBox(width: Sp.sm),
          _StatusPill(label: it.status, tone: it.tone),
        ]),
        const SizedBox(height: Sp.md),
        Row(children: [
          const Icon(Icons.schedule_rounded, size: 15, color: NC.faint),
          const SizedBox(width: 5),
          Expanded(
            child: Text(it.date,
                style: const TextStyle(color: NC.muted, fontSize: 13),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
          ),
          const SizedBox(width: Sp.sm),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerRight,
              child: Text(fcfa(it.amount),
                  style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 14.5)),
            ),
          ),
        ]),
      ]),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String label;
  final Color tone;
  const _StatusPill({required this.label, required this.tone});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: Sp.md - 2, vertical: 5),
        decoration: BoxDecoration(
            color: tone.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(R.pill)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 7, height: 7, decoration: BoxDecoration(color: tone, shape: BoxShape.circle)),
          const SizedBox(width: Sp.xs + 2),
          Text(label, style: TextStyle(color: tone, fontWeight: FontWeight.w700, fontSize: 12.5)),
        ]),
      );
}

class _Empty extends StatelessWidget {
  const _Empty();

  @override
  Widget build(BuildContext context) {
    return NovigoEmptyState.empty(
      icon: Icons.event_busy_rounded,
      title: 'Aucune intervention',
      message: 'Réservez un pro à domicile, vos interventions apparaîtront ici.',
      actionLabel: 'Trouver un pro',
      onAction: () => Navigator.of(context)
          .pushReplacement(MaterialPageRoute(builder: (_) => const HomeServicesScreen())),
    );
  }
}
