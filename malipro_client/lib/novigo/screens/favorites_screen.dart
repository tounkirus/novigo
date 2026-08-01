import 'package:flutter/material.dart';

import '../data/catalog_model.dart';
import '../favorites.dart';
import '../ui/ui.dart';
import 'store.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Favoris', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListenableBuilder(
        listenable: Listenable.merge([favorites, catalog]),
        builder: (context, _) {
          final favs = catalog.allStores.where((s) => favorites.contains(s.id)).toList();
          if (favs.isEmpty) {
            return const NovigoEmptyState.empty(
              icon: Icons.favorite_border,
              title: 'Aucun favori',
              message: 'Touchez le cœur sur un commerce pour le retrouver ici.',
            );
          }
          return NovigoContentWidth(
            child: ListView.separated(
              padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, Sp.xxl),
              itemCount: favs.length,
              separatorBuilder: (_, __) => const SizedBox(height: Sp.lg),
              itemBuilder: (_, i) => FadeSlideIn(
                index: i,
                child: NovigoMerchantCard(
                  store: favs[i],
                  onTap: () => Navigator.of(context)
                      .push(MaterialPageRoute(builder: (_) => StoreScreen(store: favs[i]))),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
