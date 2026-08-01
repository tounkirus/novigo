import 'package:flutter/material.dart';

import '../../data/env.dart';
import '../../data/services_model.dart';
import '../../models.dart' show fcfa;
import '../../ui/ui.dart';
import '../../widgets.dart' show Img, Pill, Stars;
import 'booking.dart';
import 'widgets.dart';

/// Avis clients de démonstration.
///
/// Ils ne sont affichés que pour les fiches du jeu de démonstration : aucun
/// endpoint d'avis n'existe côté backend, et coller trois témoignages inventés
/// sous le nom d'un vrai prestataire n'est pas acceptable.
const _demoReviews = <List<Object>>[
  ['Aminata K.', 5.0, 'Très professionnel, ponctuel et travail impeccable. Je recommande vivement !'],
  ['Boubacar D.', 5.0, 'Rapide et efficace. Le prix annoncé a été respecté, aucune surprise.'],
  ['Mariam T.', 4.0, 'Bon travail dans l\'ensemble, un léger retard mais résultat au top.'],
];

/// Fiche prestataire — **trois sections** : qui c'est, ce qu'il fait, ce qu'il a
/// déjà fait.
class HsProviderScreen extends StatefulWidget {
  final HsProvider provider;
  const HsProviderScreen({super.key, required this.provider});

  @override
  State<HsProviderScreen> createState() => _HsProviderScreenState();
}

class _HsProviderScreenState extends State<HsProviderScreen> {
  late HsProvider p = widget.provider;
  bool _loadingServices = false;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  /// Prestations réelles du prestataire (GET /artisans/:id).
  Future<void> _loadServices() async {
    if (!NovigoEnv.live || !p.isLive) return;
    setState(() => _loadingServices = true);
    final full = await hsServices.servicesOf(p.id);
    if (!mounted) return;
    setState(() {
      _loadingServices = false;
      if (full.isNotEmpty) p = p.withServices(full);
    });
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      appBar: AppBar(
        title: Text(p.trade, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        leading: const BackButton(color: NC.ink),
      ),
      body: NovigoContentWidth(
        child: ListView(
          padding: EdgeInsets.fromLTRB(gutter, Sp.xs, gutter, Sp.xl),
          children: [
            // ───────── Section 1 · Qui c'est ─────────
            _IdentityCard(provider: p),
            const SizedBox(height: Sp.md + 2),
            Row(children: [
              _Stat(icon: Icons.star_rounded, value: p.rating.toStringAsFixed(1), label: 'Note'),
              _Stat(icon: Icons.workspace_premium_outlined, value: '${p.jobs}', label: 'Missions'),
              _Stat(icon: Icons.badge_outlined, value: '${p.years} ans', label: 'Expérience'),
            ]),
            const SizedBox(height: Sp.lg),
            Text(p.bio, style: const TextStyle(color: NC.muted, fontSize: 14.5, height: 1.4)),

            // ───────── Section 2 · Ce qu'il fait ─────────
            const SizedBox(height: Sp.section),
            const NovigoSectionHeader(overline: 'Prestations', title: 'Services & tarifs'),
            const SizedBox(height: Sp.md),
            if (_loadingServices)
              const Wrap(spacing: Sp.sm, runSpacing: Sp.sm, children: [
                NovigoSkeleton(width: 150, height: 38, radius: 12),
                NovigoSkeleton(width: 120, height: 38, radius: 12),
                NovigoSkeleton(width: 170, height: 38, radius: 12),
              ])
            else
              Wrap(spacing: Sp.sm, runSpacing: Sp.sm, children: [
                for (final s in p.services) _ServiceChip(service: s),
              ]),

            // ───────── Section 3 · Ce qu'il a déjà fait ─────────
            const SizedBox(height: Sp.section),
            const NovigoSectionHeader(overline: 'Portfolio', title: 'Réalisations'),
            const SizedBox(height: Sp.md),
            SizedBox(
              height: 120,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: p.photos.length,
                separatorBuilder: (_, __) => const SizedBox(width: Sp.md - 2),
                itemBuilder: (_, i) =>
                    Img(p.photos[i], width: 170, height: 120, radius: BorderRadius.circular(16)),
              ),
            ),
            if (!p.isLive) ...[
              const SizedBox(height: Sp.xl),
              const NovigoSectionHeader(overline: 'Retours', title: 'Avis clients'),
              const SizedBox(height: Sp.md),
              for (final r in _demoReviews) ...[
                _ReviewTile(
                  author: r[0] as String,
                  rating: r[1] as double,
                  text: r[2] as String,
                ),
                const SizedBox(height: Sp.md - 2),
              ],
            ],
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(gutter, 0, gutter, Sp.md),
          child: NovigoButton(
            label: 'Réserver',
            icon: Icons.event_available_rounded,
            trailingLabel: p.priceFrom > 0 ? 'dès ${fcfa(p.priceFrom)}' : null,
            onPressed: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => HsBookingScreen(provider: p))),
          ),
        ),
      ),
    );
  }
}

/// En-tête : avatar, nom, métier, note et badges.
class _IdentityCard extends StatelessWidget {
  final HsProvider provider;
  const _IdentityCard({required this.provider});

  @override
  Widget build(BuildContext context) {
    final p = provider;
    return NovigoCard(
      child: Column(children: [
        Row(children: [
          HsAvatar(p.name, size: 68),
          const SizedBox(width: Sp.md + 2),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(p.name, style: T.h2, maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: Sp.xs),
              Text(p.trade, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: Sp.sm),
              Stars(p.rating, reviews: p.reviews),
            ]),
          ),
        ]),
        const SizedBox(height: Sp.md),
        // `Wrap` : les deux pastilles passent à la ligne plutôt que de déborder
        // quand le quartier a un nom long.
        Wrap(spacing: Sp.sm, runSpacing: Sp.sm, children: [
          if (p.verified)
            const Pill('KYC vérifié',
                color: NC.success, bg: Color(0x1F2ECC71), icon: Icons.verified_rounded),
          Pill('${p.district} · ${p.distanceKm.toStringAsFixed(1)} km',
              color: NC.muted, bg: NC.surfaceAlt, icon: Icons.place_outlined),
        ]),
      ]),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _Stat({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: Sp.xs),
          padding: const EdgeInsets.symmetric(vertical: Sp.md + 2, horizontal: Sp.xs),
          decoration: cardDeco(radius: R.md),
          child: Column(children: [
            Icon(icon, color: NC.brand, size: 20),
            const SizedBox(height: Sp.xs + 2),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(value,
                  style: const TextStyle(fontWeight: FontWeight.w800, color: NC.ink, fontSize: 15)),
            ),
            Text(label,
                style: const TextStyle(color: NC.faint, fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
          ]),
        ),
      );
}

class _ServiceChip extends StatelessWidget {
  final HsService service;
  const _ServiceChip({required this.service});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: 9),
      decoration: BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(12)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        // Un intitulé long (« Installation prise / interrupteur ») ne doit pas
        // faire déborder la pastille de la colonne.
        Flexible(
          child: Text(service.name, style: T.chip, maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
        if (service.price > 0) ...[
          const SizedBox(width: Sp.sm),
          Text(fcfa(service.price),
              style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 13)),
        ],
      ]),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final String author;
  final double rating;
  final String text;

  const _ReviewTile({required this.author, required this.rating, required this.text});

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      radius: R.md,
      padding: const EdgeInsets.all(Sp.md + 2),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 34,
            height: 34,
            decoration: const BoxDecoration(color: NC.surfaceAlt, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(hsInitials(author),
                style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 13)),
          ),
          const SizedBox(width: Sp.md - 2),
          Expanded(child: Text(author, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
          const SizedBox(width: Sp.sm),
          Stars(rating),
        ]),
        const SizedBox(height: Sp.sm),
        Text(text, style: const TextStyle(color: NC.muted, fontSize: 13.5, height: 1.35)),
      ]),
    );
  }
}
