import 'package:flutter/material.dart';

import '../../data/services_model.dart';
import '../../ui/ui.dart';
import 'interventions.dart';
import 'provider.dart';
import 'trade.dart';
import 'widgets.dart';

/// Hauteur d'une tuile de métier : marges + pastille d'icône + deux lignes de
/// texte, mesurées à l'échelle de police effective.
double _tradeTileHeight(BuildContext context) {
  final scaler = MediaQuery.textScalerOf(context);
  return 14 * 2 + 44 + 10 + scaler.scale(15) * 1.3 + 2 + scaler.scale(12.5) * 1.3;
}

/// Services à domicile — **trois sections**.
///
///   1. Ce que l'on peut demander, et le champ pour le chercher.
///   2. Les métiers.
///   3. Les prestataires les mieux notés.
///
/// La recherche du hub ouvrait auparavant un message « bientôt disponible » :
/// elle filtre désormais réellement le catalogue chargé (nom, métier, quartier),
/// mock comme live.
class HomeServicesScreen extends StatefulWidget {
  const HomeServicesScreen({super.key});

  @override
  State<HomeServicesScreen> createState() => _HomeServicesScreenState();
}

class _HomeServicesScreenState extends State<HomeServicesScreen> {
  final _query = TextEditingController();
  String _term = '';

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  void _push(Widget screen) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Services à domicile', style: T.title),
        leading: const BackButton(color: NC.ink),
        actions: [
          IconButton(
            tooltip: 'Mes interventions',
            icon: const Icon(Icons.event_note_rounded, color: NC.ink),
            onPressed: () => _push(const HsInterventionsScreen()),
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: hsServices,
        builder: (context, _) {
          final searching = _term.trim().isNotEmpty;
          final results = searching ? hsServices.search(_term) : const <HsProvider>[];
          final firstLoad = hsServices.loading && !hsServices.liveLoaded;

          return NovigoContentWidth(
            child: ListView(
              padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xxl),
              children: [
                // ───────── Section 1 · La promesse et la recherche ─────────
                const _Hero(),
                const SizedBox(height: Sp.lg),
                NovigoSearchBar.field(
                  hint: 'Un métier, un nom, un quartier…',
                  controller: _query,
                  autofocus: false,
                  onChanged: (v) => setState(() => _term = v),
                ),

                if (searching) ...[
                  // ───────── Résultats ─────────
                  const SizedBox(height: Sp.lg),
                  Text(
                    results.isEmpty
                        ? 'Aucun prestataire pour « $_term »'
                        : '${results.length} prestataire${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}',
                    style: T.overline,
                  ),
                  const SizedBox(height: Sp.md),
                  if (results.isEmpty)
                    NovigoEmptyState.empty(
                      icon: Icons.person_search_rounded,
                      title: 'Rien ne correspond',
                      message: 'Essayez un autre métier, ou parcourez la liste complète.',
                      actionLabel: 'Effacer la recherche',
                      onAction: () {
                        _query.clear();
                        setState(() => _term = '');
                      },
                    )
                  else
                    for (var i = 0; i < results.length; i++) ...[
                      if (i > 0) const SizedBox(height: Sp.md),
                      FadeSlideIn(
                        index: i,
                        child: HsProviderCard(
                          provider: results[i],
                          onTap: () => _push(HsProviderScreen(provider: results[i])),
                        ),
                      ),
                    ],
                ] else ...[
                  // ───────── Section 2 · Les métiers ─────────
                  const SizedBox(height: Sp.section),
                  NovigoSectionHeader(
                    overline: 'Métiers',
                    title: 'Tous les métiers',
                    subtitle: '${hsServices.categories.length} spécialités disponibles à Bamako',
                  ),
                  const SizedBox(height: Sp.md),
                  if (firstLoad)
                    const NovigoServiceGridSkeleton(count: 6)
                  else
                    GridView.count(
                      crossAxisCount: Rs.of(context).isTablet ? 3 : 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: Sp.md,
                      crossAxisSpacing: Sp.md,
                      // Hauteur dérivée du contenu réel plutôt qu'un ratio fixe :
                      // à ratio constant, le bloc de texte débordait de la tuile
                      // dès que la police système était agrandie.
                      mainAxisExtent: _tradeTileHeight(context),
                      children: [
                        for (final c in hsServices.categories)
                          _TradeTile(
                            category: c,
                            onTap: () => _push(HsCategoryScreen(category: c)),
                          ),
                      ],
                    ),

                  // ───────── Section 3 · Les mieux notés ─────────
                  const SizedBox(height: Sp.section),
                  const NovigoSectionHeader(
                    overline: 'Sélection',
                    title: 'Prestataires populaires',
                  ),
                  const SizedBox(height: Sp.md),
                  if (firstLoad)
                    for (var i = 0; i < 2; i++) ...[
                      if (i > 0) const SizedBox(height: Sp.md),
                      const HsProviderCardSkeleton(),
                    ]
                  else
                    for (var i = 0; i < hsServices.popular.length; i++) ...[
                      if (i > 0) const SizedBox(height: Sp.md),
                      FadeSlideIn(
                        index: i,
                        child: HsProviderCard(
                          provider: hsServices.popular[i],
                          onTap: () => _push(HsProviderScreen(provider: hsServices.popular[i])),
                        ),
                      ),
                    ],
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Bandeau d'accroche.
class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      gradient: NC.brandGradient,
      radius: 22,
      padding: const EdgeInsets.all(Sp.gutter),
      child: Row(children: [
        const Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Un pro à domicile,\nen un clic',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22, height: 1.15)),
            SizedBox(height: Sp.sm),
            Text('Plombier, électricien, coiffeur, médecin… vérifiés et notés.',
                style: TextStyle(color: Colors.white70, fontSize: 13.5, height: 1.3)),
          ]),
        ),
        const SizedBox(width: Sp.sm),
        const Icon(Icons.handyman_rounded, color: Colors.white, size: 48),
      ]),
    );
  }
}

/// Tuile d'un métier dans la grille.
class _TradeTile extends StatelessWidget {
  final HsCategory category;
  final VoidCallback onTap;

  const _TradeTile({required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Sp.md + 2),
      semanticLabel: '${category.label}, ${category.count} prestataires',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
                color: category.accent.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(12)),
            child: Icon(category.icon, color: category.accent, size: 24),
          ),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(category.label,
                    style: const TextStyle(
                        color: NC.ink, fontWeight: FontWeight.w700, fontSize: 15),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('${category.count} pros',
                    style: const TextStyle(color: NC.faint, fontSize: 12.5),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
