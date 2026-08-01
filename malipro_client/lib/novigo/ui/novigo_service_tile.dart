import 'package:flutter/material.dart';

import '../motion.dart';
import 'tokens.dart';

/// Tuile d'un service NOVIGO (icône + libellé).
///
/// Format unique pour la grille de l'accueil et pour l'écran « Tous les
/// services » : c'est le même objet, présenté au même calibre, ce qui rend le
/// passage de l'un à l'autre immédiatement lisible.
class NovigoServiceTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color tone;
  final VoidCallback? onTap;

  /// Pastille facultative (« Nouveau », « -20 % »).
  final String? badge;

  const NovigoServiceTile({
    super.key,
    required this.icon,
    required this.label,
    required this.tone,
    this.onTap,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: badge == null ? label : '$label, $badge',
      child: PressableScale(
        onTap: onTap,
        scale: 0.93,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Stack(clipBehavior: Clip.none, children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: tone.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(R.md + 2),
                border: Border.all(color: tone.withValues(alpha: 0.22)),
              ),
              child: Icon(icon, color: tone, size: 26),
            ),
            if (badge != null)
              Positioned(
                right: -6,
                top: -5,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: NC.brand,
                    borderRadius: BorderRadius.circular(R.pill),
                    border: Border.all(color: NC.shell, width: 1.5),
                  ),
                  child: Text(badge!,
                      style: const TextStyle(
                          color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w800)),
                ),
              ),
          ]),
          const SizedBox(height: Sp.sm),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: NC.ink, fontWeight: FontWeight.w600, fontSize: 12, height: 1.15),
          ),
        ]),
      ),
    );
  }
}

/// Grille de tuiles de service, responsive et sans débordement.
///
/// `GridView` en `shrinkWrap` calcule un ratio fixe et finissait par rogner les
/// libellés sur deux lignes ; un `Wrap` sur des largeurs calculées s'adapte à la
/// hauteur réelle du texte, y compris quand l'utilisateur agrandit la police.
class NovigoServiceGrid extends StatelessWidget {
  final List<Widget> tiles;
  final int? columns;
  final double runSpacing;

  const NovigoServiceGrid({
    super.key,
    required this.tiles,
    this.columns,
    this.runSpacing = Sp.xl,
  });

  @override
  Widget build(BuildContext context) {
    final cols = columns ?? Rs.of(context).serviceColumns;
    return LayoutBuilder(builder: (context, c) {
      final width = (c.maxWidth - (cols - 1) * Sp.sm) / cols;
      return Wrap(
        spacing: Sp.sm,
        runSpacing: runSpacing,
        children: [
          for (final tile in tiles) SizedBox(width: width, child: tile),
        ],
      );
    });
  }
}
