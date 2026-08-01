import 'package:flutter/material.dart';

import 'tokens.dart';

/// Feuille modale NOVIGO.
///
/// Toutes les feuilles de l'app partagent la même poignée, le même rayon et la
/// même marge de sécurité en bas : la modale devient un objet reconnaissable
/// plutôt qu'une variante par écran.
class NovigoBottomSheet extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final Widget child;

  /// Action collée en bas, hors zone de défilement.
  final Widget? footer;

  /// Contenu défilant (utile pour les feuilles longues).
  final bool scrollable;

  const NovigoBottomSheet({
    super.key,
    required this.child,
    this.title,
    this.subtitle,
    this.footer,
    this.scrollable = false,
  });

  @override
  Widget build(BuildContext context) {
    final content = Padding(
      padding: const EdgeInsets.fromLTRB(Sp.gutter, 0, Sp.gutter, Sp.lg),
      child: child,
    );

    return Container(
      decoration: const BoxDecoration(
        color: NC.paper,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SizedBox(height: Sp.md - 2),
          const _Grabber(),
          if (title != null) ...[
            const SizedBox(height: Sp.lg),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Sp.gutter),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                SizedBox(
                  width: double.infinity,
                  child: Semantics(header: true, child: Text(title!, style: T.h2)),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: Sp.xs + 2),
                  Text(subtitle!, style: T.muted),
                ],
              ]),
            ),
          ],
          const SizedBox(height: Sp.lg),
          if (scrollable) Flexible(child: SingleChildScrollView(child: content)) else content,
          if (footer != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(Sp.gutter, 0, Sp.gutter, Sp.md),
              child: footer!,
            ),
        ]),
      ),
    );
  }
}

class _Grabber extends StatelessWidget {
  const _Grabber();

  @override
  Widget build(BuildContext context) => Container(
        width: 44,
        height: 5,
        decoration: BoxDecoration(color: NC.line, borderRadius: BorderRadius.circular(R.pill)),
      );
}

/// Ouvre une feuille NOVIGO. Retourne la valeur passée à `Navigator.pop`.
Future<T?> showNovigoSheet<T>(
  BuildContext context, {
  required WidgetBuilder builder,
  bool isScrollControlled = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: isScrollControlled,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    // La feuille doit rester sous la barre de statut même quand elle est longue.
    constraints: BoxConstraints(
      maxHeight: MediaQuery.sizeOf(context).height * 0.92,
    ),
    builder: builder,
  );
}
