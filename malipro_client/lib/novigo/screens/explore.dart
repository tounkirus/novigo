import 'package:flutter/material.dart';

import '../ui/ui.dart';
import 'all_services.dart';
import 'search.dart';

/// Onglet « Explorer » — deux sections.
///
///   1. La recherche, qui couvre commerces, produits et services.
///   2. Le catalogue de services, rangé par rubrique.
///
/// L'ancien onglet « Services » empilait une bannière, une entrée « services à
/// domicile », puis trois grilles de tuiles : douze destinations d'un coup, sans
/// hiérarchie. Le contenu n'a pas bougé — il est simplement rangé.
class ExploreScreen extends StatelessWidget {
  const ExploreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return SafeArea(
      bottom: false,
      child: AllServicesBody(
        header: Padding(
          padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.lg),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Explorer', style: T.h1),
            const SizedBox(height: Sp.xs + 2),
            const Text('Tous les services NOVIGO, au même endroit.', style: T.muted),
            const SizedBox(height: Sp.lg),
            NovigoSearchBar(
              hint: 'Commerce, produit ou service…',
              onTap: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => const SearchScreen())),
            ),
          ]),
        ),
      ),
    );
  }
}
