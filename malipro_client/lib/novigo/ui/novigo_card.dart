import 'package:flutter/material.dart';

import '../motion.dart';
import 'tokens.dart';

/// Surface de base de l'application.
///
/// Toutes les cartes passent par là : c'est ce qui garantit un rayon, un liseré
/// et une ombre identiques d'un écran à l'autre. `onTap` déclenche la réduction
/// tactile standard, donc aucun écran n'a plus à emballer sa carte dans un
/// `GestureDetector`.
class NovigoCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? color;
  final Gradient? gradient;
  final bool elevated;
  final Border? border;
  final Clip clipBehavior;
  final String? semanticLabel;

  const NovigoCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(Sp.lg),
    this.radius = R.lg,
    this.color,
    this.gradient,
    this.elevated = false,
    this.border,
    this.clipBehavior = Clip.none,
    this.semanticLabel,
  });

  /// Variante sans marge intérieure : pour les cartes qui commencent par une
  /// image plein cadre.
  const NovigoCard.flush({
    super.key,
    required this.child,
    this.onTap,
    this.radius = R.xl,
    this.color,
    this.gradient,
    this.elevated = false,
    this.border,
    this.semanticLabel,
  })  : padding = EdgeInsets.zero,
        clipBehavior = Clip.antiAlias;

  @override
  Widget build(BuildContext context) {
    final decoration = gradient != null
        ? BoxDecoration(
            gradient: gradient,
            borderRadius: BorderRadius.circular(radius),
            border: border ?? Border.all(color: NC.hairline),
            boxShadow: elevated
                ? const [BoxShadow(color: Color(0x40000000), blurRadius: 28, offset: Offset(0, 14))]
                : const [BoxShadow(color: Color(0x1A000000), blurRadius: 14, offset: Offset(0, 6))],
          )
        : cardDeco(color: color, radius: radius, border: border, elevated: elevated);

    Widget content = Container(
      padding: padding,
      decoration: decoration,
      clipBehavior: clipBehavior,
      child: child,
    );

    if (semanticLabel != null) {
      content = Semantics(label: semanticLabel, container: true, child: content);
    }
    if (onTap == null) return content;
    return PressableScale(onTap: onTap, child: content);
  }
}

/// Ligne cliquable d'un groupe de réglages (compte, paramètres).
class NovigoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final String? trailingText;
  final VoidCallback? onTap;
  final bool danger;
  final Color? tone;

  const NovigoTile({
    super.key,
    required this.icon,
    required this.label,
    this.subtitle,
    this.trailingText,
    this.onTap,
    this.danger = false,
    this.tone,
  });

  @override
  Widget build(BuildContext context) {
    final accent = danger ? NC.error : (tone ?? NC.brand);
    return Semantics(
      button: onTap != null,
      label: subtitle == null ? label : '$label, $subtitle',
      child: InkWell(
        onTap: onTap,
        child: Padding(
          // 56 pt de haut minimum : au-dessus du seuil tactile de 48 pt.
          padding: const EdgeInsets.symmetric(horizontal: Sp.lg, vertical: Sp.md + 2),
          child: Row(children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(icon, color: accent, size: 19),
            ),
            const SizedBox(width: Sp.md),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(label,
                    style: TextStyle(
                        color: danger ? NC.error : NC.ink, fontWeight: FontWeight.w600, fontSize: 15)),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ]),
            ),
            if (trailingText != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(R.pill),
                ),
                child: Text(trailingText!,
                    style: TextStyle(color: accent, fontWeight: FontWeight.w800, fontSize: 12.5)),
              ),
              const SizedBox(width: Sp.sm),
            ],
            const Icon(Icons.chevron_right_rounded, color: NC.faint, size: 22),
          ]),
        ),
      ),
    );
  }
}

/// Groupe de `NovigoTile` séparés par un filet, dans une seule carte.
class NovigoTileGroup extends StatelessWidget {
  final List<Widget> children;
  const NovigoTileGroup({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) rows.add(const NovigoDivider(indent: 66));
      rows.add(children[i]);
    }
    return NovigoCard(
      padding: EdgeInsets.zero,
      radius: 18,
      clipBehavior: Clip.antiAlias,
      child: Column(children: rows),
    );
  }
}
