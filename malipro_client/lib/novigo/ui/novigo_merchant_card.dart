import 'package:flutter/material.dart';

import '../favorites.dart';
import '../models.dart';
import '../motion.dart';
import '../widgets.dart' show Img, Pill;
import 'tokens.dart';

/// Grande carte commerce — l'objet visuel principal de l'application.
///
/// Règle de composition : une photo forte, puis **quatre informations au
/// maximum** (nom, spécialité, note/délai, frais/distance). Tout ce qui pouvait
/// s'ajouter — nombre d'avis, badges multiples, quartier en doublon — chargeait
/// la carte sans jamais changer une décision.
class NovigoMerchantCard extends StatelessWidget {
  final Store store;
  final VoidCallback onTap;

  /// Variante compacte pour les carrousels horizontaux.
  final bool compact;

  const NovigoMerchantCard({
    super.key,
    required this.store,
    required this.onTap,
    this.compact = false,
  });

  /// Hauteur conseillée d'un carrousel de cartes compactes.
  ///
  /// Le bloc de texte grandit avec le réglage système de taille de police ; une
  /// hauteur écrite en dur finit toujours par rogner la deuxième ligne. On la
  /// dérive donc de l'échelle réelle, et le visuel absorbe le reste.
  static double carouselHeight(BuildContext context, double width) {
    final scaler = MediaQuery.textScalerOf(context);
    final textBlock = scaler.scale(16.5) * 1.25 + scaler.scale(13.5) * 1.3 + Sp.md * 2 + 6;
    return width * 9 / 16 + textBlock;
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '${store.name}, ${store.cuisine}, '
          'noté ${store.rating.toStringAsFixed(1)} sur 5, '
          '${store.etaMin} minutes, '
          '${store.freeDelivery ? 'livraison offerte' : 'livraison ${fcfa(store.deliveryFee)}'}',
      child: PressableScale(
        onTap: onTap,
        child: Container(
          decoration: cardDeco(radius: R.xl),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // En compact, la carte vit dans un carrousel de hauteur imposée :
              // c'est le visuel qui absorbe l'écart, jamais le texte.
              if (compact) Expanded(child: _cover()) else _cover(),
              Padding(
                padding: EdgeInsets.fromLTRB(
                    Sp.md + 2, Sp.md, Sp.md + 2, compact ? Sp.md : Sp.md + 1),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(store.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Text(
                      compact
                          ? store.cuisine
                          : '${store.cuisine}  ·  ${store.district}',
                      style: T.muted,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    // La carte compacte s'arrête là : frais et distance sont
                    // déjà lisibles sur la photo, les répéter ferait déborder
                    // une carte deux fois plus étroite.
                    if (!compact) ...[
                      const SizedBox(height: Sp.md - 1),
                      _footer(),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Visuel : ratio 2/1 constant en pleine largeur, donc une grille régulière
  /// quelle que soit la photo servie par le catalogue.
  Widget _cover() {
    final stack = Stack(fit: StackFit.expand, children: [
      // La couverture se prolonge dans la fiche boutique : la navigation
      // devient un mouvement continu, pas une coupure.
      Hero(tag: 'store-cover-${store.id}', child: Img(store.image, fit: BoxFit.cover)),
      const DecoratedBox(decoration: BoxDecoration(gradient: NC.imageScrim)),
      if (store.freeDelivery)
        const Positioned(
          left: Sp.md,
          top: Sp.md,
          child: Pill('Livraison offerte',
              color: Colors.white, bg: NC.brand, icon: Icons.pedal_bike),
        ),
      Positioned(right: Sp.sm + 2, top: Sp.sm + 2, child: _FavoriteButton(storeId: store.id)),
      Positioned(
        left: Sp.md,
        right: Sp.md,
        bottom: Sp.sm + 2,
        child: Row(children: [
          // Les pastilles de gauche se réduisent plutôt que de pousser la note
          // hors de la photo sur un écran étroit ou en gros caractères.
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Pill('${store.etaMin} min', color: Colors.white, icon: Icons.access_time_rounded),
                if (store.verified && !compact) ...[
                  const SizedBox(width: 6),
                  const Pill('Vérifié', color: Colors.white, icon: Icons.verified_rounded),
                ],
              ]),
            ),
          ),
          const SizedBox(width: Sp.sm),
          Pill(store.rating.toStringAsFixed(1), color: Colors.white, icon: Icons.star_rounded),
        ]),
      ),
    ]);
    return compact ? stack : AspectRatio(aspectRatio: 2 / 1, child: stack);
  }

  Widget _footer() => Row(children: [
        _meta(
          Icons.pedal_bike,
          store.freeDelivery ? 'Livraison offerte' : fcfa(store.deliveryFee),
          accent: store.freeDelivery,
        ),
        const SizedBox(width: Sp.md + 2),
        // Une décimale : les distances calculées tombent sinon en
        // 1.7999999999999998 km à l'écran.
        _meta(Icons.place_outlined, '${store.distanceKm.toStringAsFixed(1)} km'),
      ]);

  Widget _meta(IconData i, String t, {bool accent = false}) =>
      Flexible(
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(i, size: 15, color: accent ? NC.success : NC.faint),
          const SizedBox(width: 5),
          Flexible(
            child: Text(t,
                style: TextStyle(
                    color: accent ? NC.success : NC.muted,
                    fontSize: 12.5,
                    fontWeight: accent ? FontWeight.w700 : FontWeight.w500),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
          ),
        ]),
      );
}

/// Cœur de favori posé sur la photo — animé, avec libellé accessible qui suit
/// réellement l'état.
class _FavoriteButton extends StatelessWidget {
  final String storeId;
  const _FavoriteButton({required this.storeId});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: favorites,
      builder: (_, __) {
        final on = favorites.contains(storeId);
        return Semantics(
          button: true,
          toggled: on,
          label: on ? 'Retirer des favoris' : 'Ajouter aux favoris',
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => favorites.toggle(storeId),
            child: SizedBox(
              width: 44,
              height: 44,
              child: Center(
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: NC.glass, shape: BoxShape.circle),
                  child: AnimatedScale(
                    scale: on ? 1.12 : 1,
                    duration: M.fast,
                    curve: M.spring,
                    child: Icon(on ? Icons.favorite : Icons.favorite_border,
                        size: 18, color: on ? NC.brand : Colors.white),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
