import 'package:flutter/material.dart';

import '../data/verticals_repository.dart';
import '../models.dart' show fcfa;
import '../ui/ui.dart';
import '../widgets.dart' show Img;

/// Hôtels — **trois sections**.
///
///   1. Où, quand, combien de voyageurs.
///   2. Les hôtels recommandés.
///   3. Les destinations populaires.
///
/// La verticale n'a pas encore d'API : les données viennent du jeu de
/// démonstration (`MockHotelsRepository`) et l'écran le dit explicitement. Le
/// contrat `HotelsRepository` est déjà en place — voir
/// `data/verticals_repository.dart`.
class HotelsScreen extends StatefulWidget {
  const HotelsScreen({super.key});

  @override
  State<HotelsScreen> createState() => _HotelsScreenState();
}

class _HotelsScreenState extends State<HotelsScreen> {
  final _destination = TextEditingController();

  List<Hotel> _hotels = const [];
  List<String> _destinations = const [];
  bool _loading = true;
  bool _failed = false;
  bool _isDemo = false;

  int _nights = 1;
  int _guests = 2;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _destination.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final result = await hotelsRepository.search(destination: _destination.text);
      final destinations = await hotelsRepository.popularDestinations();
      if (!mounted) return;
      setState(() {
        _hotels = result.items;
        _isDemo = result.isDemo;
        _destinations = destinations;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _failed = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      appBar: AppBar(title: const Text('Hôtels', style: T.title)),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          onRefresh: _load,
          color: NC.brand,
          backgroundColor: NC.surface,
          child: NovigoContentWidth(
            child: ListView(
              padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xxl),
              children: [
                if (_isDemo && !_loading) ...[
                  const NovigoDemoBanner(
                    message: 'Sélection de démonstration — la réservation d\'hôtels ouvre bientôt.',
                  ),
                  const SizedBox(height: Sp.md),
                ],

                // ───────── Section 1 · La recherche ─────────
                NovigoCard(
                  gradient: NC.premiumGradient,
                  radius: 22,
                  padding: const EdgeInsets.all(Sp.gutter),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Où allez-vous ?',
                        style: TextStyle(
                            color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22)),
                    const SizedBox(height: Sp.lg),
                    NovigoSearchBar.field(
                      hint: 'Ville, quartier ou hôtel',
                      controller: _destination,
                      autofocus: false,
                      onChanged: (_) => setState(() {}),
                      onSubmitted: (_) => _load(),
                    ),
                    const SizedBox(height: Sp.md),
                    Row(children: [
                      Expanded(
                        child: _Counter(
                          icon: Icons.dark_mode_outlined,
                          label: 'Nuit${_nights > 1 ? 's' : ''}',
                          value: _nights,
                          onChanged: (v) => setState(() => _nights = v),
                        ),
                      ),
                      const SizedBox(width: Sp.md),
                      Expanded(
                        child: _Counter(
                          icon: Icons.person_outline_rounded,
                          label: 'Voyageur${_guests > 1 ? 's' : ''}',
                          value: _guests,
                          onChanged: (v) => setState(() => _guests = v),
                        ),
                      ),
                    ]),
                    const SizedBox(height: Sp.md),
                    NovigoButton(
                      label: 'Rechercher',
                      icon: Icons.search_rounded,
                      onPressed: _load,
                    ),
                  ]),
                ),

                // ───────── Section 2 · Les hôtels ─────────
                const SizedBox(height: Sp.section),
                NovigoSectionHeader(
                  overline: 'Séjours',
                  title: 'Hôtels recommandés',
                  subtitle: _loading
                      ? null
                      : '${_hotels.length} établissement${_hotels.length > 1 ? 's' : ''} · $_nights nuit${_nights > 1 ? 's' : ''}, $_guests voyageur${_guests > 1 ? 's' : ''}',
                ),
                const SizedBox(height: Sp.md),
                if (_loading)
                  const NovigoMerchantListSkeleton(count: 2)
                else if (_failed)
                  NovigoEmptyState.error(onAction: _load)
                else if (_hotels.isEmpty)
                  NovigoEmptyState.empty(
                    icon: Icons.hotel_outlined,
                    title: 'Aucun hôtel trouvé',
                    message: 'Essayez une autre ville ou effacez votre recherche.',
                    actionLabel: 'Effacer',
                    onAction: () {
                      _destination.clear();
                      _load();
                    },
                  )
                else
                  for (var i = 0; i < _hotels.length; i++) ...[
                    if (i > 0) const SizedBox(height: Sp.lg),
                    FadeSlideIn(
                      index: i,
                      child: _HotelCard(hotel: _hotels[i], nights: _nights),
                    ),
                  ],

                // ───────── Section 3 · Les destinations ─────────
                if (_destinations.isNotEmpty) ...[
                  const SizedBox(height: Sp.section),
                  const NovigoSectionHeader(
                      overline: 'Inspiration', title: 'Destinations populaires'),
                  const SizedBox(height: Sp.md),
                  Wrap(spacing: Sp.sm, runSpacing: Sp.sm, children: [
                    for (final d in _destinations)
                      NovigoChip(
                        label: d,
                        icon: Icons.place_outlined,
                        selected: _destination.text.trim().toLowerCase() == d.toLowerCase(),
                        onTap: () {
                          _destination.text = d;
                          _load();
                        },
                      ),
                  ]),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Compteur (nuits, voyageurs) posé sur le bandeau de recherche.
class _Counter extends StatelessWidget {
  final IconData icon;
  final String label;
  final int value;
  final ValueChanged<int> onChanged;

  const _Counter({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$label : $value',
      child: Container(
        height: 54,
        padding: const EdgeInsets.symmetric(horizontal: Sp.sm),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(R.md),
        ),
        child: Row(children: [
          Icon(icon, color: Colors.white70, size: 18),
          const SizedBox(width: Sp.xs + 2),
          Expanded(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text('$value $label',
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13.5)),
            ),
          ),
          _Round(
            icon: Icons.remove_rounded,
            onTap: value > 1 ? () => onChanged(value - 1) : null,
            tooltip: 'Retirer',
          ),
          const SizedBox(width: Sp.xs),
          _Round(
            icon: Icons.add_rounded,
            onTap: value < 9 ? () => onChanged(value + 1) : null,
            tooltip: 'Ajouter',
          ),
        ]),
      ),
    );
  }
}

class _Round extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final String tooltip;

  const _Round({required this.icon, required this.onTap, required this.tooltip});

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: tooltip,
        child: InkResponse(
          onTap: onTap,
          radius: 20,
          child: Opacity(
            opacity: onTap == null ? 0.35 : 1,
            child: Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.20),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 16),
            ),
          ),
        ),
      );
}

/// Grande carte hôtel : photo, note, quartier, prix.
class _HotelCard extends StatelessWidget {
  final Hotel hotel;
  final int nights;

  const _HotelCard({required this.hotel, required this.nights});

  @override
  Widget build(BuildContext context) {
    final h = hotel;
    final total = h.pricePerNight * nights;

    return NovigoCard.flush(
      semanticLabel:
          '${h.name}, ${h.district}, noté ${h.rating} sur 5, ${fcfa(h.pricePerNight)} la nuit',
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Stack(children: [
          AspectRatio(
            aspectRatio: 2 / 1,
            child: Img(h.image, fit: BoxFit.cover),
          ),
          const Positioned.fill(
            child: DecoratedBox(decoration: BoxDecoration(gradient: NC.imageScrim)),
          ),
          Positioned(
            left: Sp.md,
            bottom: Sp.md,
            right: Sp.md,
            // Deux pastilles posées sur la photo : chacune se réduit plutôt que
            // de pousser l'autre hors du cadre sur un écran étroit.
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: Sp.sm + 2, vertical: 4),
                    decoration: BoxDecoration(
                        color: NC.glass, borderRadius: BorderRadius.circular(R.pill)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.star_rounded, color: NC.gold, size: 15),
                      const SizedBox(width: 3),
                      Text('${h.rating}',
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12.5)),
                      Text('  (${h.reviews})',
                          style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    ]),
                  ),
                ),
              ),
              if (h.freeCancellation) ...[
                const SizedBox(width: Sp.sm),
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerRight,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: Sp.sm + 2, vertical: 4),
                      decoration: BoxDecoration(
                          color: NC.success.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(R.pill)),
                      child: const Text('Annulation gratuite',
                          style: TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11.5)),
                    ),
                  ),
                ),
              ],
            ]),
          ),
        ]),
        Padding(
          padding: const EdgeInsets.all(Sp.lg - 2),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(h.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: Sp.xs),
            Row(children: [
              const Icon(Icons.place_outlined, size: 14, color: NC.faint),
              const SizedBox(width: 3),
              Expanded(
                child: Text(h.district,
                    style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
            ]),
            if (h.amenities.isNotEmpty) ...[
              const SizedBox(height: Sp.md),
              Wrap(spacing: Sp.sm - 2, runSpacing: Sp.sm - 2, children: [
                for (final a in h.amenities)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: Sp.sm + 2, vertical: 4),
                    decoration: BoxDecoration(
                        color: NC.surfaceAlt, borderRadius: BorderRadius.circular(R.pill)),
                    child: Text(a,
                        style: const TextStyle(
                            color: NC.muted, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
              ]),
            ],
            const SizedBox(height: Sp.md),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(fcfa(h.pricePerNight), style: T.price),
                  const Text('la nuit', style: T.muted),
                ]),
              ),
              const SizedBox(width: Sp.md),
              if (nights > 1)
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerRight,
                    child: Text('${fcfa(total)} au total',
                        style: const TextStyle(
                            color: NC.brand, fontWeight: FontWeight.w800, fontSize: 13.5)),
                  ),
                ),
            ]),
          ]),
        ),
      ]),
    );
  }
}

