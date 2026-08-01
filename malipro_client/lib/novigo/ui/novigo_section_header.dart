import 'package:flutter/material.dart';

import 'tokens.dart';

/// En-tête d'une des 2-3 grandes sections d'un écran.
///
/// L'accueil ne comporte plus qu'une poignée de sections : chacune doit
/// s'annoncer clairement (surtitre court + titre fort) et proposer sa sortie
/// « Voir tout » plutôt que d'étaler son contenu sur la page.
class NovigoSectionHeader extends StatelessWidget {
  final String title;
  final String? overline;
  final String? subtitle;
  final String actionLabel;
  final VoidCallback? onAction;

  const NovigoSectionHeader({
    super.key,
    required this.title,
    this.overline,
    this.subtitle,
    this.actionLabel = 'Voir tout',
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (overline != null) ...[
            Text(overline!.toUpperCase(), style: T.overline),
            const SizedBox(height: Sp.xs + 1),
          ],
          Semantics(header: true, child: Text(title, style: T.h2)),
          if (subtitle != null) ...[
            const SizedBox(height: Sp.xs),
            Text(subtitle!, style: T.muted, maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
        ]),
      ),
      if (onAction != null) ...[
        const SizedBox(width: Sp.md),
        Semantics(
          button: true,
          label: '$actionLabel, $title',
          child: InkWell(
            onTap: onAction,
            borderRadius: BorderRadius.circular(R.pill),
            child: Padding(
              // Marge tactile confortable sans agrandir visuellement le lien.
              padding: const EdgeInsets.symmetric(horizontal: Sp.sm, vertical: Sp.md),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(actionLabel,
                    style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w700, fontSize: 14)),
                const SizedBox(width: 2),
                const Icon(Icons.arrow_forward_rounded, size: 15, color: NC.brand),
              ]),
            ),
          ),
        ),
      ],
    ]);
  }
}
