import 'package:flutter/material.dart';

import '../motion.dart';
import 'tokens.dart';

/// Hiérarchie d'action. Un écran ne porte qu'un seul `primary` : c'est ce qui
/// rend l'action principale identifiable sans avoir à lire les libellés.
enum NovigoButtonVariant { primary, secondary, ghost, danger }

enum NovigoButtonSize { large, medium, small }

/// Bouton NOVIGO — l'unique bouton de l'application.
///
/// Il porte l'état `loading` de bout en bout : un appui sur une action réseau
/// doit répondre immédiatement, sinon l'utilisateur ré-appuie et déclenche deux
/// fois la même requête (c'est exactement ce qui donnait l'impression de gel au
/// moment de confirmer une commande).
class NovigoButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final NovigoButtonVariant variant;
  final NovigoButtonSize size;
  final bool loading;
  final bool expand;

  /// Montant ou valeur affichée à droite (« Commander · 12 400 FCFA »).
  final String? trailingLabel;

  const NovigoButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.variant = NovigoButtonVariant.primary,
    this.size = NovigoButtonSize.large,
    this.loading = false,
    this.expand = true,
    this.trailingLabel,
  });

  const NovigoButton.secondary({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.size = NovigoButtonSize.large,
    this.loading = false,
    this.expand = true,
    this.trailingLabel,
  }) : variant = NovigoButtonVariant.secondary;

  const NovigoButton.ghost({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.size = NovigoButtonSize.medium,
    this.loading = false,
    this.expand = false,
    this.trailingLabel,
  }) : variant = NovigoButtonVariant.ghost;

  bool get _enabled => onPressed != null && !loading;

  double get _height => switch (size) {
        NovigoButtonSize.large => 56,
        NovigoButtonSize.medium => 48,
        NovigoButtonSize.small => 40,
      };

  double get _fontSize => switch (size) {
        NovigoButtonSize.large => 16.5,
        NovigoButtonSize.medium => 15,
        NovigoButtonSize.small => 13.5,
      };

  Color get _foreground => switch (variant) {
        NovigoButtonVariant.primary => Colors.white,
        NovigoButtonVariant.secondary => NC.ink,
        NovigoButtonVariant.ghost => NC.brand,
        NovigoButtonVariant.danger => Colors.white,
      };

  BoxDecoration _decoration() {
    final radius = BorderRadius.circular(size == NovigoButtonSize.small ? R.sm : R.md);
    switch (variant) {
      case NovigoButtonVariant.primary:
        return BoxDecoration(
          gradient: NC.brandGradient,
          borderRadius: radius,
          boxShadow: [
            BoxShadow(color: NC.brand.withValues(alpha: 0.30), blurRadius: 22, offset: const Offset(0, 10)),
          ],
        );
      case NovigoButtonVariant.danger:
        return BoxDecoration(color: NC.error, borderRadius: radius);
      case NovigoButtonVariant.secondary:
        return BoxDecoration(
          color: NC.surfaceAlt,
          borderRadius: radius,
          border: Border.all(color: NC.hairline),
        );
      case NovigoButtonVariant.ghost:
        return BoxDecoration(color: Colors.transparent, borderRadius: radius);
    }
  }

  @override
  Widget build(BuildContext context) {
    final content = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (loading)
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2.2, color: _foreground),
          )
        else if (icon != null)
          Icon(icon, size: _fontSize + 3, color: _foreground),
        if (loading || icon != null) const SizedBox(width: Sp.sm + 2),
        Flexible(
          child: Text(
            loading ? 'Un instant…' : label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: _foreground, fontWeight: FontWeight.w800, fontSize: _fontSize),
          ),
        ),
        if (trailingLabel != null && !loading) ...[
          const SizedBox(width: Sp.md),
          // La valeur de droite (un montant, le plus souvent) se réduit plutôt
          // que de déborder du bouton sur un écran étroit — sans jamais perdre
          // de chiffre, contrairement à une troncature.
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                trailingLabel!,
                style: TextStyle(
                  color: _foreground.withValues(alpha: 0.92),
                  fontWeight: FontWeight.w800,
                  fontSize: _fontSize,
                ),
              ),
            ),
          ),
        ],
      ],
    );

    return Semantics(
      button: true,
      enabled: _enabled,
      label: label,
      child: PressableScale(
        onTap: _enabled ? onPressed : null,
        child: AnimatedOpacity(
          duration: M.fast,
          opacity: _enabled ? 1 : 0.55,
          child: Container(
            height: _height,
            width: expand ? double.infinity : null,
            padding: EdgeInsets.symmetric(horizontal: expand ? Sp.lg : Sp.xl),
            decoration: _decoration(),
            alignment: Alignment.center,
            child: content,
          ),
        ),
      ),
    );
  }
}

/// Bouton circulaire d'icône (retour, favori, notifications).
/// Zone tactile de 44 pt minimum, quelle que soit la taille visuelle demandée.
class NovigoIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String tooltip;
  final Color? background;
  final Color? foreground;
  final double size;

  const NovigoIconButton({
    super.key,
    required this.icon,
    required this.tooltip,
    this.onPressed,
    this.background,
    this.foreground,
    this.size = 42,
  });

  @override
  Widget build(BuildContext context) {
    final visual = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: background ?? NC.surface,
        shape: BoxShape.circle,
        border: Border.all(color: NC.hairline),
      ),
      alignment: Alignment.center,
      child: Icon(icon, color: foreground ?? NC.ink, size: size * 0.5),
    );

    return Semantics(
      button: true,
      label: tooltip,
      child: Tooltip(
        message: tooltip,
        child: PressableScale(
          onTap: onPressed,
          scale: 0.9,
          child: SizedBox(
            width: size < 44 ? 44 : size,
            height: size < 44 ? 44 : size,
            child: Center(child: visual),
          ),
        ),
      ),
    );
  }
}
