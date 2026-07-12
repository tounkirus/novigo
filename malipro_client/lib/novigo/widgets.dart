import 'package:flutter/material.dart';
import 'theme.dart';
import 'models.dart';
import 'favorites.dart';

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
      return Image.network(asset,
          width: width, height: height, fit: fit, gaplessPlayback: true,
          errorBuilder: (_, __, ___) => _placeholder());
    }
    return Image.asset(asset,
        width: width, height: height, fit: fit, gaplessPlayback: true,
        errorBuilder: (_, __, ___) => _placeholder());
  }

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
        Text(text, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: color)),
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
      if (reviews != null)
        Text('  (${reviews! >= 999 ? '999+' : reviews})',
            style: const TextStyle(color: NC.muted, fontSize: 13)),
    ]);
  }
}

/// Grande carte commerce (accueil + listing), calibre Uber Eats / Yango.
class StoreCard extends StatelessWidget {
  final Store store;
  final VoidCallback onTap;
  const StoreCard({super.key, required this.store, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        decoration: cardDeco(radius: 22),
        clipBehavior: Clip.antiAlias,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Stack(children: [
            Img(store.image, height: 170, width: double.infinity, fit: BoxFit.cover),
            if (store.freeDelivery)
              const Positioned(
                  left: 12,
                  top: 12,
                  child: Pill('Livraison offerte', color: Colors.white, bg: NC.brand, icon: Icons.pedal_bike)),
            Positioned(
              right: 12,
              top: 12,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => favorites.toggle(store.id),
                child: Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.45), shape: BoxShape.circle),
                  child: ListenableBuilder(
                    listenable: favorites,
                    builder: (_, __) {
                      final on = favorites.contains(store.id);
                      return Icon(on ? Icons.favorite : Icons.favorite_border,
                          size: 18, color: on ? NC.brand : Colors.white);
                    },
                  ),
                ),
              ),
            ),
            Positioned(
              left: 12,
              bottom: 12,
              child: Row(children: [
                Pill('${store.etaMin} min', color: Colors.white, icon: Icons.access_time_rounded),
                if (store.verified) ...[
                  const SizedBox(width: 6),
                  const Pill('Vérifié', color: Colors.white, icon: Icons.verified_rounded),
                ],
              ]),
            ),
          ]),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(store.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
                Stars(store.rating, reviews: store.reviews),
              ]),
              const SizedBox(height: 4),
              Text(store.cuisine, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 10),
              Row(children: [
                _meta(Icons.pedal_bike, store.freeDelivery ? 'Gratuit' : fcfa(store.deliveryFee)),
                const SizedBox(width: 16),
                _meta(Icons.place_outlined, '${store.distanceKm} km'),
                const SizedBox(width: 16),
                _meta(Icons.storefront_outlined, store.district),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _meta(IconData i, String t) => Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(i, size: 15, color: NC.faint),
        const SizedBox(width: 4),
        Flexible(child: Text(t, style: const TextStyle(color: NC.muted, fontSize: 12.5), overflow: TextOverflow.ellipsis)),
      ]);
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
