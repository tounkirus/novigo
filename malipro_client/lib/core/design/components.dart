import 'package:flutter/material.dart';
import 'tokens.dart';

/// MALIPRO — composants réutilisables du design system.
///
/// S'appuient uniquement sur le [Theme] courant (couleurs/typo dérivées des
/// [MaliColors]) : rendu cohérent en clair comme en sombre, sans couleur codée
/// en dur côté écran.

/// Carte premium à coins arrondis et ombre douce (glassmorphism léger).
class MaliCard extends StatelessWidget {
  const MaliCard({super.key, required this.child, this.padding, this.onTap, this.lifted = false});

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final bool lifted;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final b = Theme.of(context).brightness;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: MaliRadius.card,
        child: Ink(
          padding: padding ?? const EdgeInsets.all(MaliSpacing.md),
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: MaliRadius.card,
            border: Border.all(color: scheme.outline),
            boxShadow: lifted ? MaliElevation.lifted(b) : MaliElevation.card(b),
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Bouton d'action principal avec dégradé émeraude → émeraude clair.
class MaliGradientButton extends StatelessWidget {
  const MaliGradientButton({super.key, required this.label, this.onPressed, this.icon, this.loading = false});

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme.labelLarge?.copyWith(color: MaliColors.white);
    final enabled = onPressed != null && !loading;
    return Opacity(
      opacity: enabled ? 1 : 0.6,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled ? onPressed : null,
          borderRadius: MaliRadius.button,
          child: Ink(
            height: 52,
            decoration: BoxDecoration(
              borderRadius: MaliRadius.button,
              gradient: const LinearGradient(
                colors: [MaliColors.emerald, MaliColors.emeraldLight],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
            ),
            child: Center(
              child: loading
                  ? const SizedBox(
                      height: 22, width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: MaliColors.white))
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (icon != null) ...[Icon(icon, color: MaliColors.white, size: 20), const SizedBox(width: MaliSpacing.xs)],
                        Text(label, style: text),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

/// En-tête de section : titre fort + action optionnelle « Voir tout ».
class MaliSectionHeader extends StatelessWidget {
  const MaliSectionHeader({super.key, required this.title, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: MaliSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          if (actionLabel != null)
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
        ],
      ),
    );
  }
}

/// Type sémantique d'une pastille d'état.
enum MaliStatusTone { success, error, info, warning, neutral }

/// Pastille d'état arrondie (badge) — commande, paiement, livraison…
class MaliStatusPill extends StatelessWidget {
  const MaliStatusPill({super.key, required this.label, this.tone = MaliStatusTone.neutral});

  final String label;
  final MaliStatusTone tone;

  Color get _color => switch (tone) {
        MaliStatusTone.success => MaliColors.success,
        MaliStatusTone.error => MaliColors.error,
        MaliStatusTone.info => MaliColors.info,
        MaliStatusTone.warning => MaliColors.warning,
        MaliStatusTone.neutral => MaliColors.muted,
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: MaliSpacing.sm, vertical: MaliSpacing.xxs),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(MaliRadius.pill),
        border: Border.all(color: _color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: _color, fontWeight: FontWeight.w700),
      ),
    );
  }
}
