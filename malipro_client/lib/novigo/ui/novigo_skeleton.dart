import 'package:flutter/material.dart';

import '../motion.dart';
import 'tokens.dart';

/// Bloc de chargement.
///
/// Un `CircularProgressIndicator` centré ne dit rien de ce qui arrive et fait
/// sauter la page à l'atterrissage. Le squelette dessine à l'avance la mise en
/// page réelle : le contenu se substitue à lui sans déplacer un pixel.
class NovigoSkeleton extends StatelessWidget {
  final double? width;
  final double? height;
  final double radius;

  const NovigoSkeleton({super.key, this.width, this.height, this.radius = R.sm});

  /// Ligne de texte (hauteur d'une ligne, largeur en fraction de la colonne).
  const NovigoSkeleton.text({super.key, this.width, this.height = 12})
      : radius = 6;

  @override
  Widget build(BuildContext context) => Shimmer(
        width: width,
        height: height,
        radius: BorderRadius.circular(radius),
      );
}

/// Squelette d'une carte commerce — même gabarit que `NovigoMerchantCard`.
class NovigoMerchantCardSkeleton extends StatelessWidget {
  const NovigoMerchantCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: cardDeco(radius: R.xl),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const AspectRatio(aspectRatio: 2 / 1, child: NovigoSkeleton(radius: 0)),
        Padding(
          padding: const EdgeInsets.fromLTRB(Sp.lg - 2, Sp.md, Sp.lg - 2, Sp.md + 1),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
            NovigoSkeleton(width: 170, height: 15, radius: 6),
            SizedBox(height: Sp.sm),
            NovigoSkeleton(width: 220, height: 11, radius: 6),
            SizedBox(height: Sp.md),
            NovigoSkeleton(width: 130, height: 11, radius: 6),
          ]),
        ),
      ]),
    );
  }
}

/// Squelette d'une carte de carrousel « Pour vous ».
class NovigoPromoCardSkeleton extends StatelessWidget {
  final double width;
  const NovigoPromoCardSkeleton({super.key, this.width = 280});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Container(
        decoration: cardDeco(radius: R.xl),
        clipBehavior: Clip.antiAlias,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const AspectRatio(aspectRatio: 16 / 9, child: NovigoSkeleton(radius: 0)),
          Padding(
            padding: const EdgeInsets.all(Sp.md),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
              NovigoSkeleton(width: 140, height: 13, radius: 6),
              SizedBox(height: Sp.sm),
              NovigoSkeleton(width: 90, height: 10, radius: 6),
            ]),
          ),
        ]),
      ),
    );
  }
}

/// Liste de squelettes de cartes commerce (état de chargement d'une catégorie).
class NovigoMerchantListSkeleton extends StatelessWidget {
  final int count;
  const NovigoMerchantListSkeleton({super.key, this.count = 3});

  @override
  Widget build(BuildContext context) => Column(
        children: [
          for (var i = 0; i < count; i++)
            const Padding(
              padding: EdgeInsets.only(bottom: Sp.lg),
              child: NovigoMerchantCardSkeleton(),
            ),
        ],
      );
}

/// Squelette d'une grille de services (accueil en cours de chargement).
class NovigoServiceGridSkeleton extends StatelessWidget {
  final int count;
  const NovigoServiceGridSkeleton({super.key, this.count = 8});

  @override
  Widget build(BuildContext context) {
    final cols = Rs.of(context).serviceColumns;
    return LayoutBuilder(builder: (context, c) {
      final width = (c.maxWidth - (cols - 1) * Sp.sm) / cols;
      return Wrap(
        spacing: Sp.sm,
        runSpacing: Sp.xl,
        children: [
          for (var i = 0; i < count; i++)
            SizedBox(
              width: width,
              child: Column(children: const [
                NovigoSkeleton(width: 58, height: 58, radius: R.md + 2),
                SizedBox(height: Sp.sm),
                NovigoSkeleton(width: 44, height: 10, radius: 5),
              ]),
            ),
        ],
      );
    });
  }
}
