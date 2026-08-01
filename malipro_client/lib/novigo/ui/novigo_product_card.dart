import 'package:flutter/material.dart';

import '../cart.dart';
import '../models.dart';
import '../motion.dart';
import '../widgets.dart' show Img, Pill;
import 'tokens.dart';

/// Bouton « + » d'ajout au panier posé sur un visuel produit.
///
/// Affiche la quantité déjà au panier dès qu'elle dépasse zéro : l'utilisateur
/// n'a pas besoin d'ouvrir le panier pour savoir où il en est.
class NovigoAddButton extends StatelessWidget {
  final Product product;
  final Store store;
  final double size;
  final Color ringColor;

  const NovigoAddButton({
    super.key,
    required this.product,
    required this.store,
    this.size = 34,
    this.ringColor = NC.shell,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: cart,
      builder: (_, __) {
        final q = cart.qtyOf(product);
        return Semantics(
          button: true,
          label: q > 0
              ? '${product.name}, $q au panier, ajouter un de plus'
              : 'Ajouter ${product.name} au panier',
          child: PressableScale(
            onTap: () => cart.add(product, store),
            scale: 0.85,
            child: SizedBox(
              // Cible tactile de 44 pt, pastille visuelle plus petite.
              width: 44,
              height: 44,
              child: Center(
                child: AnimatedContainer(
                  duration: M.fast,
                  curve: M.spring,
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    color: q > 0 ? NC.brand : NC.surfaceAlt,
                    shape: BoxShape.circle,
                    border: Border.all(color: ringColor, width: 3),
                  ),
                  alignment: Alignment.center,
                  child: q > 0
                      ? Text('$q',
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13))
                      : Icon(Icons.add, color: NC.ink, size: size * 0.58),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Carte produit en grille (rayons supermarché / pharmacie / marché).
class NovigoProductCard extends StatelessWidget {
  final Product product;
  final Store store;
  final VoidCallback onTap;

  const NovigoProductCard({
    super.key,
    required this.product,
    required this.store,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tone = product.tone ?? NC.brand;
    return Semantics(
      button: true,
      label: '${product.name}, ${fcfa(product.price)}',
      child: PressableScale(
        onTap: onTap,
        child: Container(
          decoration: cardDeco(radius: 18),
          clipBehavior: Clip.antiAlias,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: Stack(children: [
                Positioned.fill(child: _visual(tone)),
                if (product.discount != null)
                  Positioned(
                    left: Sp.sm,
                    top: Sp.sm,
                    child: Pill('-${product.discount}%', color: Colors.white, bg: NC.brand),
                  )
                else if (product.popular)
                  const Positioned(
                    left: Sp.sm,
                    top: Sp.sm,
                    child: Pill('Populaire',
                        color: NC.brand,
                        bg: Color(0x1FE53935),
                        icon: Icons.local_fire_department_rounded),
                  ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: NovigoAddButton(product: product, store: store, ringColor: NC.surface),
                ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(Sp.sm + 2, Sp.sm, Sp.sm + 2, Sp.md - 2),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(product.name,
                    style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 13.5),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(product.desc,
                    style: const TextStyle(color: NC.faint, fontSize: 11.5),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: Sp.xs + 2),
                Text(fcfa(product.price),
                    style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 14.5)),
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _visual(Color tone) => product.isTile
      ? Container(
          color: tone.withValues(alpha: 0.14),
          alignment: Alignment.center,
          child: Icon(product.icon, color: tone, size: 44),
        )
      : Img(product.image, fit: BoxFit.cover);
}

/// Ligne produit d'un menu de restaurant (texte à gauche, photo à droite).
class NovigoProductRow extends StatelessWidget {
  final Product product;
  final Store store;
  final VoidCallback onTap;

  const NovigoProductRow({
    super.key,
    required this.product,
    required this.store,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '${product.name}, ${fcfa(product.price)}',
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Flexible(
                  child: Text(product.name,
                      style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
                if (product.popular) ...[
                  const SizedBox(width: Sp.sm),
                  const Pill('Populaire',
                      color: NC.brand,
                      bg: Color(0x1FE53935),
                      icon: Icons.local_fire_department_rounded),
                ],
              ]),
              const SizedBox(height: Sp.xs),
              Text(product.desc, style: T.muted, maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: Sp.sm),
              // Wrap plutôt que Row : prix + prix barré + remise ne tiennent
              // pas sur une ligne en gros caractères ou sur un écran étroit.
              Wrap(
                spacing: Sp.sm,
                runSpacing: Sp.xs,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(fcfa(product.price), style: T.price),
                  if (product.discount != null) ...[
                    // Prix barré à côté de la remise : le gain devient lisible
                    // au lieu d'un pourcentage seul.
                    Text(
                      fcfa((product.price * 100 / (100 - product.discount!)).round()),
                      style: const TextStyle(
                        color: NC.faint,
                        fontSize: 13,
                        decoration: TextDecoration.lineThrough,
                        decorationColor: NC.faint,
                      ),
                    ),
                    Pill('-${product.discount}%', color: Colors.white, bg: NC.brand),
                  ],
                ],
              ),
            ]),
          ),
          const SizedBox(width: Sp.md),
          Stack(clipBehavior: Clip.none, children: [
            Img(product.image, width: 96, height: 96, radius: BorderRadius.circular(R.md)),
            Positioned(
              right: -13,
              bottom: -13,
              child: NovigoAddButton(product: product, store: store),
            ),
          ]),
        ]),
      ),
    );
  }
}
