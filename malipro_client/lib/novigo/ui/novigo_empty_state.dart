import 'package:flutter/material.dart';

import 'novigo_button.dart';
import 'tokens.dart';

/// Les cinq situations dans lesquelles un écran peut se trouver.
///
/// Chaque écran de liste les traite explicitement : sans cela, « aucune donnée »
/// et « le réseau est tombé » se ressemblent, et l'utilisateur ne sait pas s'il
/// doit réessayer ou changer de recherche.
enum NovigoStatus { loading, loaded, empty, error, offline }

/// Écran / bloc d'état non nominal.
class NovigoEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Color? tone;

  const NovigoEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.tone,
  });

  /// Rien à afficher — ce n'est pas une erreur, le ton reste neutre.
  const NovigoEmptyState.empty({
    super.key,
    this.icon = Icons.inbox_rounded,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  }) : tone = null;

  /// Échec côté serveur : on propose systématiquement de réessayer.
  const NovigoEmptyState.error({
    super.key,
    this.icon = Icons.error_outline_rounded,
    this.title = 'Une erreur est survenue',
    this.message = 'Nous n\'avons pas réussi à charger cette page.',
    this.actionLabel = 'Réessayer',
    this.onAction,
  }) : tone = NC.error;

  /// Pas de réseau : message distinct, car l'action utile n'est pas la même.
  const NovigoEmptyState.offline({
    super.key,
    this.icon = Icons.wifi_off_rounded,
    this.title = 'Vous êtes hors ligne',
    this.message = 'Vérifiez votre connexion — le contenu déjà chargé reste consultable.',
    this.actionLabel = 'Réessayer',
    this.onAction,
  }) : tone = NC.warning;

  @override
  Widget build(BuildContext context) {
    final accent = tone ?? NC.brand;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Sp.xl, vertical: Sp.xxl),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.13),
              borderRadius: BorderRadius.circular(26),
            ),
            child: Icon(icon, color: accent, size: 36),
          ),
          const SizedBox(height: Sp.lg),
          Text(title, style: T.h2, textAlign: TextAlign.center),
          const SizedBox(height: Sp.sm),
          Text(message, style: T.muted, textAlign: TextAlign.center),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: Sp.xl),
            NovigoButton.secondary(
              label: actionLabel!,
              icon: Icons.refresh_rounded,
              size: NovigoButtonSize.medium,
              expand: false,
              onPressed: onAction,
            ),
          ],
        ]),
      ),
    );
  }
}

/// Aiguillage loading / loaded / empty / error / offline.
///
/// Centraliser la bascule évite que chaque écran réinvente sa propre logique —
/// et qu'un cas (typiquement « vide ») finisse par être oublié quelque part.
class NovigoStateView extends StatelessWidget {
  final NovigoStatus status;
  final WidgetBuilder loaded;
  final WidgetBuilder? loading;
  final Widget? emptyState;
  final VoidCallback? onRetry;
  final String? errorMessage;

  const NovigoStateView({
    super.key,
    required this.status,
    required this.loaded,
    this.loading,
    this.emptyState,
    this.onRetry,
    this.errorMessage,
  });

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case NovigoStatus.loading:
        return loading?.call(context) ??
            const Center(child: CircularProgressIndicator(color: NC.brand));
      case NovigoStatus.loaded:
        return loaded(context);
      case NovigoStatus.empty:
        return emptyState ??
            const NovigoEmptyState.empty(
              title: 'Rien à afficher',
              message: 'Ce contenu n\'est pas encore disponible.',
            );
      case NovigoStatus.error:
        return NovigoEmptyState.error(
          message: errorMessage ?? 'Nous n\'avons pas réussi à charger cette page.',
          onAction: onRetry,
        );
      case NovigoStatus.offline:
        return NovigoEmptyState.offline(onAction: onRetry);
    }
  }
}

/// Bandeau signalant que l'écran affiche un jeu de démonstration.
///
/// Plusieurs domaines (hôtels, immobilier, interventions, factures) n'ont pas
/// encore d'API : plutôt que de laisser croire à des données réelles, l'écran le
/// dit. C'est la contrepartie honnête d'une interface qui existe avant son
/// backend.
class NovigoDemoBanner extends StatelessWidget {
  final String message;
  const NovigoDemoBanner({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: Sp.sm + 2),
      decoration: BoxDecoration(
        color: NC.info.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(R.sm),
        border: Border.all(color: NC.info.withValues(alpha: 0.25)),
      ),
      child: Row(children: [
        const Icon(Icons.science_outlined, size: 17, color: NC.info),
        const SizedBox(width: Sp.sm),
        Expanded(
          child: Text(message,
              style: const TextStyle(
                  color: NC.info, fontSize: 12.5, fontWeight: FontWeight.w600, height: 1.3)),
        ),
      ]),
    );
  }
}

/// Bandeau discret signalant que le contenu affiché provient du cache local.
class NovigoOfflineBanner extends StatelessWidget {
  final VoidCallback? onRetry;
  const NovigoOfflineBanner({super.key, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: Sp.md),
      padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: Sp.sm + 2),
      decoration: BoxDecoration(
        color: NC.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(R.sm),
        border: Border.all(color: NC.warning.withValues(alpha: 0.25)),
      ),
      child: Row(children: [
        const Icon(Icons.cloud_off_rounded, size: 17, color: NC.warning),
        const SizedBox(width: Sp.sm),
        const Expanded(
          child: Text('Connexion limitée — contenu enregistré',
              style: TextStyle(color: NC.warning, fontSize: 12.5, fontWeight: FontWeight.w600)),
        ),
        if (onRetry != null)
          InkWell(
            onTap: onRetry,
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: Sp.sm, vertical: Sp.xs),
              child: Text('Réessayer',
                  style: TextStyle(color: NC.warning, fontSize: 12.5, fontWeight: FontWeight.w800)),
            ),
          ),
      ]),
    );
  }
}
