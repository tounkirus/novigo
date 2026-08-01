import 'package:flutter/material.dart';

import '../../data/services_model.dart';
import '../../ui/ui.dart';
import 'provider.dart';
import 'widgets.dart';

/// Critères de tri d'une liste de prestataires.
///
/// Les trois pastilles existaient déjà, mais aucune n'était reliée à quoi que ce
/// soit : la première était peinte en rouge et la liste ne bougeait jamais. Elles
/// trient désormais réellement.
enum _Sort { rating, distance, price }

const _sortLabels = ['Mieux notés', 'Plus proches', 'Moins chers'];

/// Liste des prestataires d'un métier — **deux sections** : le métier, puis les
/// prestataires triés.
class HsCategoryScreen extends StatefulWidget {
  final HsCategory category;
  const HsCategoryScreen({super.key, required this.category});

  @override
  State<HsCategoryScreen> createState() => _HsCategoryScreenState();
}

class _HsCategoryScreenState extends State<HsCategoryScreen> {
  _Sort _sort = _Sort.rating;

  List<HsProvider> _sorted(List<HsProvider> source) {
    final list = [...source];
    switch (_sort) {
      case _Sort.rating:
        list.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case _Sort.distance:
        list.sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
        break;
      case _Sort.price:
        // Un prix inconnu (0) ne doit pas remonter en tête du classement
        // « moins chers » : il est renvoyé en fin de liste.
        list.sort((a, b) {
          final pa = a.priceFrom <= 0 ? 1 << 30 : a.priceFrom;
          final pb = b.priceFrom <= 0 ? 1 << 30 : b.priceFrom;
          return pa.compareTo(pb);
        });
        break;
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final category = widget.category;

    return Scaffold(
      appBar: AppBar(
        title: Text(category.label, style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListenableBuilder(
        listenable: hsServices,
        builder: (context, _) {
          final pros = _sorted(hsServices.providersFor(category.id));
          return NovigoContentWidth(
            child: ListView(
              padding: EdgeInsets.fromLTRB(gutter, Sp.xs, gutter, Sp.xl),
              children: [
                // ───────── Section 1 · Le métier ─────────
                Row(children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                        color: category.accent.withValues(alpha: 0.16),
                        borderRadius: BorderRadius.circular(14)),
                    child: Icon(category.icon, color: category.accent, size: 26),
                  ),
                  const SizedBox(width: Sp.md),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('${category.label} à Bamako',
                          style: T.h2, maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 2),
                      Text(
                        pros.isEmpty
                            ? 'Aucun prestataire pour le moment'
                            : '${pros.length} prestataire${pros.length > 1 ? 's' : ''} disponible${pros.length > 1 ? 's' : ''}',
                        style: T.muted,
                      ),
                    ]),
                  ),
                ]),

                // ───────── Section 2 · Les prestataires ─────────
                const SizedBox(height: Sp.lg),
                NovigoChipRail(
                  labels: _sortLabels,
                  selectedIndex: _Sort.values.indexOf(_sort),
                  onSelected: (i) => setState(() => _sort = _Sort.values[i]),
                  padding: EdgeInsets.zero,
                ),
                const SizedBox(height: Sp.lg),
                if (pros.isEmpty)
                  const NovigoEmptyState.empty(
                    icon: Icons.handyman_outlined,
                    title: 'Personne pour l\'instant',
                    message:
                        'Aucun prestataire n\'est encore référencé sur ce métier. Revenez bientôt.',
                  )
                else
                  for (var i = 0; i < pros.length; i++) ...[
                    if (i > 0) const SizedBox(height: Sp.md),
                    FadeSlideIn(
                      index: i,
                      child: HsProviderCard(
                        provider: pros[i],
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => HsProviderScreen(provider: pros[i])),
                        ),
                      ),
                    ),
                  ],
              ],
            ),
          );
        },
      ),
    );
  }
}
