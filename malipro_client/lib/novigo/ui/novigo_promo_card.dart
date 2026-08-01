import 'package:flutter/material.dart';

import '../data/feed_repository.dart';
import '../motion.dart';
import '../widgets.dart' show Img, Pill;
import 'tokens.dart';

/// Carte de recommandation du carrousel « Pour vous ».
///
/// Volontairement pauvre en informations : un visuel fort, un titre, une ligne
/// de contexte. Le détail appartient à la fiche, pas au carrousel — c'est ce qui
/// permet d'en faire défiler plusieurs sans effort de lecture.
class NovigoPromoCard extends StatelessWidget {
  final FeedItem item;
  final VoidCallback onTap;
  final double width;

  const NovigoPromoCard({
    super.key,
    required this.item,
    required this.onTap,
    this.width = 280,
  });

  /// Hauteur conseillée d'un carrousel de ces cartes, échelle de texte comprise.
  static double carouselHeight(BuildContext context, double width) {
    final scaler = MediaQuery.textScalerOf(context);
    final textBlock = scaler.scale(16.5) * 1.25 + scaler.scale(13.5) * 1.3 + Sp.md * 2 + 4;
    return width * 9 / 16 + textBlock;
  }

  @override
  Widget build(BuildContext context) {
    // Dans un carrousel, la hauteur est imposée : c'est le visuel qui absorbe
    // l'écart quand le texte grandit, jamais le bloc de texte qui se coupe.
    final bounded = width != double.infinity;
    return Semantics(
      button: true,
      label: '${item.title}, ${item.subtitle}${item.meta != null ? ', ${item.meta}' : ''}',
      child: PressableScale(
        onTap: onTap,
        child: SizedBox(
          width: width,
          child: Container(
            decoration: cardDeco(radius: R.xl, elevated: true),
            clipBehavior: Clip.antiAlias,
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
              _Flexible(
                enabled: bounded,
                child: Stack(fit: StackFit.expand, children: [
                  Img(item.image, fit: BoxFit.cover),
                  const DecoratedBox(decoration: BoxDecoration(gradient: NC.imageScrim)),
                  if (item.badge != null)
                    Positioned(
                      left: Sp.md,
                      top: Sp.md,
                      child: Pill(item.badge!, color: Colors.white, bg: NC.brand),
                    ),
                  Positioned(
                    left: Sp.md,
                    right: Sp.md,
                    bottom: Sp.sm + 2,
                    child: Text(
                      item.subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ]),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(Sp.md + 2, Sp.md - 2, Sp.md + 2, Sp.md),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(item.title,
                          style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                      if (item.meta != null) ...[
                        const SizedBox(height: Sp.xs),
                        Text(item.meta!,
                            style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                    ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

/// `Expanded` quand la hauteur est imposée (carrousel), ratio 16/9 sinon
/// (carte pleine largeur dans une liste qui défile).
class _Flexible extends StatelessWidget {
  final bool enabled;
  final Widget child;
  const _Flexible({required this.enabled, required this.child});

  @override
  Widget build(BuildContext context) =>
      enabled ? Expanded(child: child) : AspectRatio(aspectRatio: 16 / 9, child: child);
}

/// Carrousel horizontal de cartes, avec gouttière et défilement à rebond.
///
/// La dernière carte reçoit la même marge que la première : sans cela elle colle
/// au bord et donne l'impression d'un contenu tronqué.
class NovigoCarousel extends StatelessWidget {
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final double height;
  final double gutter;

  const NovigoCarousel({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    required this.height,
    this.gutter = Sp.gutter,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: gutter),
        physics: const BouncingScrollPhysics(),
        itemCount: itemCount,
        separatorBuilder: (_, __) => const SizedBox(width: Sp.md),
        itemBuilder: itemBuilder,
      ),
    );
  }
}
