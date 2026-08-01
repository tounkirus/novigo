import 'package:flutter/material.dart';

import 'motion.dart';
import 'theme.dart';

/// Image asset avec coins arrondis + fond de remplissage pendant le décodage.
class Img extends StatelessWidget {
  final String asset;
  final double? width, height;
  final BorderRadius radius;
  final BoxFit fit;
  const Img(this.asset,
      {super.key,
      this.width,
      this.height,
      this.fit = BoxFit.cover,
      this.radius = const BorderRadius.all(Radius.circular(0))});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: radius,
      child: Container(
        width: width,
        height: height,
        color: NC.surfaceAlt,
        child: _image(),
      ),
    );
  }

  /// Supporte asset local, URL réseau (catalogue live) et cas vide, sans crasher.
  Widget _image() {
    if (asset.isEmpty) return _placeholder();
    if (asset.startsWith('http')) {
      return Image.network(
        asset,
        width: width,
        height: height,
        fit: fit,
        gaplessPlayback: true,
        // Une photo du catalogue qui n'arrive pas laisse la place à un visuel
        // embarqué plutôt qu'à une icône : la grille reste présentable hors ligne.
        errorBuilder: (_, __, ___) => Image.asset(_bundledFallback(),
            width: width, height: height, fit: fit,
            errorBuilder: (_, __, ___) => _placeholder()),
        frameBuilder: (_, child, frame, wasSync) {
          if (wasSync || frame != null) return child;
          return _loadingTile();
        },
      );
    }
    return Image.asset(asset,
        width: width, height: height, fit: fit, gaplessPlayback: true,
        errorBuilder: (_, __, ___) => _placeholder());
  }

  /// Visuel embarqué déterministe (même URL -> même repli, pas de scintillement).
  String _bundledFallback() {
    final h = asset.hashCode.abs();
    return 'assets/img/store_${h % 6 + 1}.jpg';
  }

  Widget _loadingTile() => Shimmer(width: width, height: height, radius: radius);

  Widget _placeholder() =>
      const Center(child: Icon(Icons.image_outlined, color: NC.faint, size: 22));
}

/// Pastille arrondie (badge). tone = couleur d'accent.
class Pill extends StatelessWidget {
  final String text;
  final Color color;
  final Color? bg;
  final IconData? icon;
  const Pill(this.text, {super.key, this.color = NC.ink, this.bg, this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg ?? Colors.black.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 13, color: color), const SizedBox(width: 4)],
        // Une pastille posée dans une largeur contrainte (quartier au nom long,
        // police agrandie) rogne son libellé au lieu de déborder de la carte.
        Flexible(
          child: Text(text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: color)),
        ),
      ]),
    );
  }
}

class Stars extends StatelessWidget {
  final double rating;
  final int? reviews;
  const Stars(this.rating, {super.key, this.reviews});
  @override
  Widget build(BuildContext context) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.star_rounded, size: 17, color: NC.gold),
      const SizedBox(width: 3),
      Text(rating.toStringAsFixed(1),
          style: const TextStyle(fontWeight: FontWeight.w800, color: NC.ink, fontSize: 14)),
      // Le nombre d'avis est l'élément le moins critique de la ligne : c'est lui
      // qui cède quand la place manque, plutôt que de faire déborder la note.
      if (reviews != null)
        Flexible(
          child: Text('  (${reviews! >= 999 ? '999+' : reviews})',
              maxLines: 1,
              overflow: TextOverflow.clip,
              style: const TextStyle(color: NC.muted, fontSize: 13)),
        ),
    ]);
  }
}

/// Stepper quantité (− n +).
class QtyStepper extends StatelessWidget {
  final int qty;
  final VoidCallback onAdd;
  final VoidCallback onRemove;
  final bool compact;
  const QtyStepper({super.key, required this.qty, required this.onAdd, required this.onRemove, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final s = compact ? 30.0 : 36.0;
    return Container(
      decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        _btn(Icons.remove, onRemove, s),
        SizedBox(
            width: compact ? 26 : 34,
            child: Text('$qty', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w800, color: NC.ink))),
        _btn(Icons.add, onAdd, s, brand: true),
      ]),
    );
  }

  Widget _btn(IconData i, VoidCallback onTap, double s, {bool brand = false}) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: s,
          height: s,
          decoration: BoxDecoration(color: brand ? NC.brand : Colors.transparent, shape: BoxShape.circle),
          child: Icon(i, size: 18, color: brand ? Colors.white : NC.ink),
        ),
      );
}
