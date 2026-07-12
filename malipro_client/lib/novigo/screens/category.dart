import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../data/catalog_model.dart';
import '../widgets.dart';
import 'store.dart';

class CategoryScreen extends StatefulWidget {
  final Category category;
  const CategoryScreen({super.key, required this.category});
  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  int _filter = 0;
  final _filters = const ['Tous', 'Populaires', 'Livraison offerte', 'Proche'];

  @override
  Widget build(BuildContext context) {
    if (widget.category.id == 'colis') return _ColisView(label: widget.category.label);
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.category.label, style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListenableBuilder(
        listenable: catalog,
        builder: (context, _) {
          final stores = catalog.storesForCategory(widget.category.id);
          return CustomScrollView(slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${widget.category.label} à Bamako', style: T.h1),
              const SizedBox(height: 6),
              Row(children: [
                const Icon(Icons.storefront_outlined, size: 17, color: NC.muted),
                const SizedBox(width: 6),
                Text('${widget.category.count} commerces disponibles', style: T.muted),
              ]),
            ]),
          ),
        ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final on = i == _filter;
                return GestureDetector(
                  onTap: () => setState(() => _filter = i),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      color: on ? NC.brand : NC.surface,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    alignment: Alignment.center,
                    child: Text(_filters[i],
                        style: TextStyle(color: on ? Colors.white : NC.ink, fontWeight: FontWeight.w700, fontSize: 13.5)),
                  ),
                );
              },
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          sliver: SliverList.separated(
            itemCount: stores.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (_, i) => StoreCard(
              store: stores[i],
              onTap: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => StoreScreen(store: stores[i]))),
            ),
          ),
        ),
          ]);
        },
      ),
    );
  }
}

/// Envoi de colis (coursier NOVIGO) — parcours dédié pour la catégorie « Colis ».
class _ColisView extends StatelessWidget {
  final String label;
  const _ColisView({required this.label});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(label, style: T.title), leading: const BackButton(color: NC.ink)),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(22)),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Text('Envoyez partout à Bamako', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20, height: 1.15)),
                SizedBox(height: 8),
                Text('Un coursier récupère et livre votre colis en moins de 40 min.',
                    style: TextStyle(color: Colors.white70, fontSize: 13.5, height: 1.3)),
              ]),
            ),
            const Icon(Icons.local_shipping_rounded, color: Colors.white, size: 54),
          ]),
        ),
        const SizedBox(height: 18),
        Container(
          decoration: cardDeco(radius: 18),
          padding: const EdgeInsets.all(4),
          child: Column(children: [
            _point(Icons.trip_origin, NC.success, 'Point de retrait', 'Hamdallaye ACI · Rue 250'),
            const Divider(color: NC.line, height: 1, indent: 56),
            _point(Icons.place, NC.brand, 'Point de livraison', 'Ajouter une adresse'),
          ]),
        ),
        const SizedBox(height: 16),
        const Text('Taille du colis', style: T.h2),
        const SizedBox(height: 12),
        Row(children: const [
          _Size(Icons.inventory_2_outlined, 'Petit', '≤ 2 kg', '1 000'),
          SizedBox(width: 10),
          _Size(Icons.work_outline, 'Moyen', '≤ 8 kg', '1 800'),
          SizedBox(width: 10),
          _Size(Icons.luggage_outlined, 'Grand', '≤ 20 kg', '3 000'),
        ]),
        const SizedBox(height: 22),
        GestureDetector(
          onTap: () => ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Recherche d\'un coursier — bientôt disponible'), duration: Duration(seconds: 1)),
          ),
          child: Container(
            height: 56,
            decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
            alignment: Alignment.center,
            child: const Text('Demander un coursier', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
          ),
        ),
      ]),
    );
  }

  Widget _point(IconData icon, Color c, String title, String sub) => ListTile(
        leading: Icon(icon, color: c),
        title: Text(title, style: const TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
        subtitle: Text(sub, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 15)),
        trailing: const Icon(Icons.chevron_right_rounded, color: NC.faint),
      );
}

class _Size extends StatelessWidget {
  final IconData icon;
  final String name, weight, price;
  const _Size(this.icon, this.name, this.weight, this.price);
  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          decoration: cardDeco(radius: 16),
          child: Column(children: [
            Icon(icon, color: NC.brand, size: 26),
            const SizedBox(height: 8),
            Text(name, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 14)),
            Text(weight, style: const TextStyle(color: NC.faint, fontSize: 11.5)),
            const SizedBox(height: 6),
            Text('$price F', style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 13.5)),
          ]),
        ),
      );
}
