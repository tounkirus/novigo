import 'package:flutter/material.dart';

import '../../data/services_model.dart';
import '../../models.dart' show fcfa;
import '../../ui/ui.dart';
import '../../widgets.dart' show Stars;

/// Briques communes aux écrans « Services à domicile ».
///
/// Le fichier d'origine redéfinissait son propre formateur de montant et sa
/// propre pastille d'initiales : les deux vivent désormais au même endroit que
/// le reste de l'application (`fcfa`, design system).

/// Initiales d'un prestataire, pour l'avatar.
String hsInitials(String name) {
  final parts = name.replaceAll('Dr ', '').trim().split(' ');
  if (parts.isEmpty) return '?';
  if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
  return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
}

/// Avatar dégradé porteur des initiales.
class HsAvatar extends StatelessWidget {
  final String name;
  final double size;
  const HsAvatar(this.name, {super.key, this.size = 52});

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
        alignment: Alignment.center,
        child: Text(hsInitials(name),
            style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.w800, fontSize: size * 0.34)),
      );
}

/// Carte prestataire — utilisée par le hub, la liste par métier et la recherche.
class HsProviderCard extends StatelessWidget {
  final HsProvider provider;
  final VoidCallback onTap;

  const HsProviderCard({super.key, required this.provider, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = provider;
    return NovigoCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Sp.md + 2),
      semanticLabel: '${p.name}, ${p.trade}, noté ${p.rating} sur 5, '
          'à ${p.distanceKm} kilomètres, à partir de ${fcfa(p.priceFrom)}',
      child: Row(children: [
        HsAvatar(p.name, size: 56),
        const SizedBox(width: Sp.md + 2),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Flexible(
                child: Text(p.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
              if (p.verified) ...[
                const SizedBox(width: Sp.xs + 2),
                const Icon(Icons.verified_rounded, color: NC.success, size: 16),
              ],
            ]),
            const SizedBox(height: 3),
            Text(p.trade, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: Sp.sm),
            // La ligne « note + quartier » se réduit d'un bloc quand la place
            // manque, plutôt que de rogner le quartier ou de pousser le prix
            // hors de la carte : les deux informations restent lisibles.
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Stars(p.rating, reviews: p.reviews),
                const SizedBox(width: Sp.md),
                const Icon(Icons.place_outlined, size: 14, color: NC.faint),
                const SizedBox(width: 2),
                Text('${p.district} · ${p.distanceKm.toStringAsFixed(1)} km',
                    style: const TextStyle(color: NC.muted, fontSize: 12.5)),
              ]),
            ),
          ]),
        ),
        const SizedBox(width: Sp.sm),
        _PriceFrom(amount: p.priceFrom),
      ]),
    );
  }
}

/// Prix d'appel, aligné à droite de la carte.
class _PriceFrom extends StatelessWidget {
  final int amount;
  const _PriceFrom({required this.amount});

  @override
  Widget build(BuildContext context) {
    if (amount <= 0) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
      const Text('dès', style: TextStyle(color: NC.faint, fontSize: 11)),
      Text(
        fcfa(amount).replaceAll(' FCFA', ''),
        style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 15),
      ),
      const Text('FCFA', style: TextStyle(color: NC.faint, fontSize: 11)),
    ]);
  }
}

/// Squelette d'une carte prestataire — même gabarit que la carte réelle.
class HsProviderCardSkeleton extends StatelessWidget {
  const HsProviderCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      padding: const EdgeInsets.all(Sp.md + 2),
      child: Row(children: const [
        NovigoSkeleton(width: 56, height: 56, radius: 28),
        SizedBox(width: Sp.md + 2),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            NovigoSkeleton(width: 150, height: 14, radius: 6),
            SizedBox(height: Sp.sm),
            NovigoSkeleton(width: 90, height: 11, radius: 6),
            SizedBox(height: Sp.sm),
            NovigoSkeleton(width: 180, height: 11, radius: 6),
          ]),
        ),
      ]),
    );
  }
}
