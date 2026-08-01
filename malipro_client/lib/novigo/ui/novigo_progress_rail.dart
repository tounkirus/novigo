import 'package:flutter/material.dart';

import '../motion.dart';
import 'tokens.dart';

/// Progression en N segments.
///
/// Les quatre libellés d'étape d'une commande (« Confirmée », « En préparation »,
/// « En route », « Livrée ») ne tiennent pas côte à côte sur un écran de 320 px
/// avec la police système agrandie : ils se coupaient au milieu d'un mot. Le rail
/// ne porte donc que la géométrie, et l'étape courante est écrite en toutes
/// lettres juste en dessous, par `NovigoStepCaption`.
class NovigoProgressRail extends StatelessWidget {
  /// Index de l'étape courante (0…total-1).
  final int step;
  final int total;
  final Color? tone;

  const NovigoProgressRail({super.key, required this.step, required this.total, this.tone});

  @override
  Widget build(BuildContext context) {
    final accent = tone ?? NC.brand;
    return Semantics(
      label: 'Étape ${step + 1} sur $total',
      child: Row(children: [
        for (var i = 0; i < total; i++) ...[
          if (i > 0) const SizedBox(width: Sp.sm - 2),
          Expanded(
            child: AnimatedContainer(
              duration: M.base,
              curve: M.ease,
              height: 6,
              decoration: BoxDecoration(
                color: i <= step ? accent : NC.surfaceAlt,
                borderRadius: BorderRadius.circular(R.pill),
              ),
            ),
          ),
        ],
      ]),
    );
  }
}

/// Légende d'étape : icône, titre, et ce que cela signifie concrètement.
class NovigoStepCaption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String detail;
  final Color? tone;

  const NovigoStepCaption({
    super.key,
    required this.icon,
    required this.title,
    required this.detail,
    this.tone,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: M.base,
      child: Row(
        key: ValueKey(title),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 19, color: tone ?? NC.brand),
          const SizedBox(width: Sp.sm + 2),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: T.title),
              const SizedBox(height: 2),
              Text(detail, style: T.muted),
            ]),
          ),
        ],
      ),
    );
  }
}
