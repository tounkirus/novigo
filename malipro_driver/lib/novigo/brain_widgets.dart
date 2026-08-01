import 'package:flutter/material.dart';
import 'theme.dart';
import 'models.dart' show fcfa;
import 'data/brain_api.dart';

/// Affichage des décisions du NOVIGO Brain côté livreur.
/// Le score et les raisons viennent du backend : l'app ne les recalcule jamais.

/// Pastille « compatibilité Brain » : score sur 100 + accès aux raisons.
class BrainScoreBadge extends StatelessWidget {
  final int score;
  final bool recommended;
  final List<String> reasons;
  final String title;

  const BrainScoreBadge({
    super.key,
    required this.score,
    required this.reasons,
    this.recommended = false,
    this.title = 'Pourquoi cette mission ?',
  });

  @override
  Widget build(BuildContext context) {
    if (score <= 0) return const SizedBox.shrink();
    final color = recommended ? NC.success : NC.brand;
    return GestureDetector(
      onTap: reasons.isEmpty ? null : () => showBrainReasons(context, title, score, reasons),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.auto_awesome, size: 13, color: color),
          const SizedBox(width: 6),
          Text(
            recommended ? 'Recommandé · $score/100' : 'Compatibilité $score/100',
            style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 12),
          ),
          if (reasons.isNotEmpty) ...[
            const SizedBox(width: 4),
            Icon(Icons.info_outline_rounded, size: 13, color: color),
          ],
        ]),
      ),
    );
  }
}

/// Feuille « pourquoi le Brain me propose cette mission ».
Future<void> showBrainReasons(
  BuildContext context,
  String title,
  int score,
  List<String> reasons,
) {
  return showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (_) => Container(
      decoration: const BoxDecoration(
        color: NC.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
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
            decoration: BoxDecoration(color: NC.brand.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(14)),
            child: const Icon(Icons.auto_awesome, color: NC.brand),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: T.h2),
              Text('Score de compatibilité : $score/100', style: T.muted),
            ]),
          ),
        ]),
        const SizedBox(height: 18),
        ...reasons.map((r) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Padding(
                  padding: EdgeInsets.only(top: 2),
                  child: Icon(Icons.check_circle_outline_rounded, size: 17, color: NC.brand),
                ),
                const SizedBox(width: 10),
                Expanded(child: Text(r, style: T.body)),
              ]),
            )),
        const SizedBox(height: 6),
        const Text(
          'Le Brain répartit aussi les missions à l’équité : à qualité égale, '
          'la priorité va au livreur qui en a le moins reçu.',
          style: T.muted,
        ),
      ]),
    ),
  );
}

/// Carte d'une mission universelle du Brain (colis, course, dépannage…),
/// affichée à côté des livraisons du catalogue.
class BrainMissionCard extends StatelessWidget {
  final BrainMission mission;
  final VoidCallback? onAccept;
  const BrainMissionCard({super.key, required this.mission, this.onAccept});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: cardDeco(radius: 20),
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: NC.brand.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.assignment_turned_in_outlined, color: NC.brand, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(mission.serviceLabel, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text(
                [
                  if (mission.reference.isNotEmpty) mission.reference,
                  if (mission.zone.isNotEmpty) mission.zone,
                  if (mission.etaMinutes > 0) '${mission.etaMinutes} min',
                ].join(' · '),
                style: T.muted,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ]),
          ),
          if (mission.payout > 0)
            Text(fcfa(mission.payout),
                style: const TextStyle(color: NC.success, fontWeight: FontWeight.w900, fontSize: 16)),
        ]),
        const SizedBox(height: 12),
        BrainScoreBadge(
          score: mission.score,
          recommended: mission.recommended,
          reasons: mission.reasons,
          title: mission.serviceLabel,
        ),
        if (onAccept != null && mission.eligible) ...[
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: NC.brand,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: onAccept,
              child: const Text('Accepter la mission',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
            ),
          ),
        ],
      ]),
    );
  }
}
