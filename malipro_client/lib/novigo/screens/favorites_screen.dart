import 'package:flutter/material.dart';
import '../theme.dart';
import '../data/catalog_model.dart';
import '../widgets.dart';
import '../favorites.dart';
import 'store.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Favoris', style: T.title), leading: const BackButton(color: NC.ink)),
      body: ListenableBuilder(
        listenable: Listenable.merge([favorites, catalog]),
        builder: (_, __) {
          final favs = catalog.allStores.where((s) => favorites.contains(s.id)).toList();
          if (favs.isEmpty) return _empty();
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: favs.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (_, i) => StoreCard(
              store: favs[i],
              onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => StoreScreen(store: favs[i]))),
            ),
          );
        },
      ),
    );
  }

  Widget _empty() => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 88, height: 88,
            decoration: BoxDecoration(color: NC.surface, shape: BoxShape.circle),
            child: const Icon(Icons.favorite_border, color: NC.faint, size: 40),
          ),
          const SizedBox(height: 16),
          const Text('Aucun favori', style: T.h2),
          const SizedBox(height: 6),
          const Text('Touchez le cœur sur un commerce\npour le retrouver ici.',
              style: T.muted, textAlign: TextAlign.center),
        ]),
      );
}
