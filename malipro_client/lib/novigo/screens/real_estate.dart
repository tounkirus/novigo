import 'package:flutter/material.dart';

import '../data/verticals_repository.dart';
import '../models.dart' show fcfa;
import '../ui/ui.dart';
import '../widgets.dart' show Img;

/// Immobilier — **trois sections**.
///
///   1. Acheter ou louer, où, et jusqu'à quel budget.
///   2. Les biens qui correspondent.
///   3. Les quartiers populaires.
///
/// Comme les hôtels, la verticale n'a pas encore d'API : les annonces viennent
/// du jeu de démonstration et l'écran l'annonce. Le contrat
/// `RealEstateRepository` attend l'endpoint.
class RealEstateScreen extends StatefulWidget {
  const RealEstateScreen({super.key});

  @override
  State<RealEstateScreen> createState() => _RealEstateScreenState();
}

class _RealEstateScreenState extends State<RealEstateScreen> {
  final _area = TextEditingController();

  ListingKind _kind = ListingKind.rent;
  List<Property> _items = const [];
  List<String> _districts = const [];
  bool _loading = true;
  bool _failed = false;
  bool _isDemo = false;

  /// Budget maximum, `null` = sans limite.
  int? _budget;

  /// Paliers proposés, par mode : les ordres de grandeur d'un loyer et d'un
  /// achat n'ont rien à voir.
  List<int> get _budgetSteps => _kind == ListingKind.rent
      ? const [100000, 250000, 500000]
      : const [15000000, 50000000, 100000000];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _area.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final result = await realEstateRepository.search(kind: _kind, area: _area.text);
      final districts = await realEstateRepository.popularDistricts();
      if (!mounted) return;
      setState(() {
        _items = result.items;
        _isDemo = result.isDemo;
        _districts = districts;
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

  List<Property> get _visible {
    final max = _budget;
    if (max == null) return _items;
    return [
      for (final p in _items)
        if (p.price <= max) p,
    ];
  }

  void _switchKind(ListingKind kind) {
    if (kind == _kind) return;
    setState(() {
      _kind = kind;
      // Un budget de location n'a aucun sens en achat : on repart sans filtre.
      _budget = null;
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final items = _visible;

    return Scaffold(
      appBar: AppBar(title: const Text('Immobilier', style: T.title)),
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
                    message: 'Annonces de démonstration — les annonces réelles arrivent bientôt.',
                  ),
                  const SizedBox(height: Sp.md),
                ],

                // ───────── Section 1 · Ce que je cherche ─────────
                NovigoCard(
                  gradient: NC.premiumGradient,
                  radius: 22,
                  padding: const EdgeInsets.all(Sp.gutter),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    _KindToggle(kind: _kind, onChanged: _switchKind),
                    const SizedBox(height: Sp.lg),
                    NovigoSearchBar.field(
                      hint: 'Quartier ou type de bien',
                      controller: _area,
                      autofocus: false,
                      onChanged: (_) => setState(() {}),
                      onSubmitted: (_) => _load(),
                    ),
                    const SizedBox(height: Sp.md),
                    NovigoButton(
                      label: 'Rechercher',
                      icon: Icons.search_rounded,
                      onPressed: _load,
                    ),
                  ]),
                ),

                // ───────── Section 2 · Les biens ─────────
                const SizedBox(height: Sp.section),
                NovigoSectionHeader(
                  overline: _kind == ListingKind.rent ? 'Location' : 'Vente',
                  title: 'Biens recommandés',
                  subtitle: _loading
                      ? null
                      : '${items.length} annonce${items.length > 1 ? 's' : ''} à Bamako',
                ),
                const SizedBox(height: Sp.md),
                // Budget : un seul palier actif à la fois, « Tous » remet à zéro.
                NovigoChipRail(
                  labels: [
                    'Tous budgets',
                    for (final step in _budgetSteps) 'Jusqu\'à ${_compact(step)}',
                  ],
                  selectedIndex: _budget == null ? 0 : _budgetSteps.indexOf(_budget!) + 1,
                  onSelected: (i) =>
                      setState(() => _budget = i == 0 ? null : _budgetSteps[i - 1]),
                  padding: EdgeInsets.zero,
                ),
                const SizedBox(height: Sp.md),
                if (_loading)
                  const NovigoMerchantListSkeleton(count: 2)
                else if (_failed)
                  NovigoEmptyState.error(onAction: _load)
                else if (items.isEmpty)
                  NovigoEmptyState.empty(
                    icon: Icons.home_work_outlined,
                    title: 'Aucun bien trouvé',
                    message: 'Élargissez le budget ou changez de quartier.',
                    actionLabel: 'Tout afficher',
                    onAction: () {
                      _area.clear();
                      setState(() => _budget = null);
                      _load();
                    },
                  )
                else
                  for (var i = 0; i < items.length; i++) ...[
                    if (i > 0) const SizedBox(height: Sp.lg),
                    FadeSlideIn(index: i, child: _PropertyCard(property: items[i])),
                  ],

                // ───────── Section 3 · Les quartiers ─────────
                if (_districts.isNotEmpty) ...[
                  const SizedBox(height: Sp.section),
                  const NovigoSectionHeader(
                      overline: 'Bamako', title: 'Quartiers populaires'),
                  const SizedBox(height: Sp.md),
                  Wrap(spacing: Sp.sm, runSpacing: Sp.sm, children: [
                    for (final d in _districts)
                      NovigoChip(
                        label: d,
                        icon: Icons.location_city_rounded,
                        selected: _area.text.trim().toLowerCase() == d.toLowerCase(),
                        onTap: () {
                          _area.text = d;
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

/// Montant abrégé pour les libellés de filtre (« 15 M », « 250 k »).
String _compact(int amount) {
  if (amount >= 1000000) {
    final m = amount / 1000000;
    return '${m % 1 == 0 ? m.toInt() : m.toStringAsFixed(1)} M';
  }
  if (amount >= 1000) return '${(amount / 1000).round()} k';
  return '$amount';
}

/// Bascule Acheter / Louer.
class _KindToggle extends StatelessWidget {
  final ListingKind kind;
  final ValueChanged<ListingKind> onChanged;

  const _KindToggle({required this.kind, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.28),
        borderRadius: BorderRadius.circular(R.pill),
      ),
      child: Row(children: [
        _Segment(
          label: 'Louer',
          selected: kind == ListingKind.rent,
          onTap: () => onChanged(ListingKind.rent),
        ),
        _Segment(
          label: 'Acheter',
          selected: kind == ListingKind.sale,
          onTap: () => onChanged(ListingKind.sale),
        ),
      ]),
    );
  }
}

class _Segment extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Segment({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        child: GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: M.fast,
            curve: M.ease,
            height: 42,
            decoration: BoxDecoration(
              color: selected ? Colors.white : Colors.transparent,
              borderRadius: BorderRadius.circular(R.pill),
            ),
            alignment: Alignment.center,
            child: Text(
              label,
              style: TextStyle(
                color: selected ? NC.shell : Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 14.5,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Grande carte d'annonce.
class _PropertyCard extends StatelessWidget {
  final Property property;
  const _PropertyCard({required this.property});

  @override
  Widget build(BuildContext context) {
    final p = property;
    final rent = p.kind == ListingKind.rent;

    return NovigoCard.flush(
      semanticLabel: '${p.title}, ${p.district}, ${p.surface} mètres carrés, ${fcfa(p.price)}'
          '${rent ? ' par mois' : ''}',
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Stack(children: [
          AspectRatio(aspectRatio: 2 / 1, child: Img(p.image, fit: BoxFit.cover)),
          const Positioned.fill(
            child: DecoratedBox(decoration: BoxDecoration(gradient: NC.imageScrim)),
          ),
          Positioned(
            left: Sp.md,
            top: Sp.md,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: Sp.sm + 2, vertical: 4),
              decoration: BoxDecoration(
                color: (rent ? NC.info : NC.gold).withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(R.pill),
              ),
              child: Text(rent ? 'À louer' : 'À vendre',
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11.5)),
            ),
          ),
          if (p.furnished)
            Positioned(
              right: Sp.md,
              top: Sp.md,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: Sp.sm + 2, vertical: 4),
                decoration: BoxDecoration(
                    color: NC.glass, borderRadius: BorderRadius.circular(R.pill)),
                child: const Text('Meublé',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11.5)),
              ),
            ),
        ]),
        Padding(
          padding: const EdgeInsets.all(Sp.lg - 2),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(p.title, style: T.title, maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: Sp.xs),
            Row(children: [
              const Icon(Icons.place_outlined, size: 14, color: NC.faint),
              const SizedBox(width: 3),
              Expanded(
                child: Text(p.district,
                    style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
            ]),
            const SizedBox(height: Sp.md),
            Wrap(spacing: Sp.sm - 2, runSpacing: Sp.sm - 2, children: [
              if (p.rooms > 0)
                _Feature(icon: Icons.bed_outlined, label: '${p.rooms} pièce${p.rooms > 1 ? 's' : ''}'),
              _Feature(icon: Icons.square_foot_rounded, label: '${p.surface} m²'),
            ]),
            const SizedBox(height: Sp.md),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(fcfa(p.price), style: T.price),
                ),
              ),
              if (rent) ...[
                const SizedBox(width: Sp.sm),
                const Text('par mois', style: T.muted),
              ],
            ]),
          ]),
        ),
      ]),
    );
  }
}

class _Feature extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Feature({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: Sp.sm + 2, vertical: 5),
        decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(R.pill)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14, color: NC.muted),
          const SizedBox(width: 4),
          Text(label,
              style: const TextStyle(color: NC.muted, fontSize: 12, fontWeight: FontWeight.w600)),
        ]),
      );
}
