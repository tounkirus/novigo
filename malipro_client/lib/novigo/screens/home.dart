import 'package:flutter/material.dart';
import '../theme.dart';
import '../data.dart';
import '../data/catalog_model.dart';
import '../widgets.dart';
import 'category.dart';
import 'store.dart';
import 'search.dart';
import 'notifications.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: catalog,
      builder: (context, _) => SafeArea(
      bottom: false,
      child: CustomScrollView(slivers: [
        SliverToBoxAdapter(child: _topBar(context)),
        SliverToBoxAdapter(child: _hero(context)),
        SliverToBoxAdapter(child: _categories(context)),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 22, 16, 6),
          sliver: SliverToBoxAdapter(
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Populaires à Bamako', style: T.h2),
              Text('Voir tout', style: TextStyle(color: NC.brand, fontWeight: FontWeight.w700)),
            ]),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          sliver: SliverList.separated(
            itemCount: catalog.foodStores.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (_, i) => StoreCard(
              store: catalog.foodStores[i],
              onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => StoreScreen(store: catalog.foodStores[i]))),
            ),
          ),
        ),
      ]),
    ));
  }

  Widget _topBar(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
        child: Row(children: [
          Container(
            width: 42,
            height: 42,
            decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: const Text('N', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Livrer à', style: TextStyle(color: NC.faint, fontSize: 12, fontWeight: FontWeight.w600)),
              Row(children: const [
                Text('Bamako, Hamdallaye', style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 15)),
                Icon(Icons.keyboard_arrow_down_rounded, color: NC.ink, size: 20),
              ]),
            ]),
          ),
          GestureDetector(
            onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen())),
            child: Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(color: NC.surface, shape: BoxShape.circle),
              child: const Icon(Icons.notifications_none_rounded, color: NC.ink, size: 22),
            ),
          ),
        ]),
      );

  Widget _hero(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        child: Container(
          decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(24)),
          clipBehavior: Clip.antiAlias,
          child: Stack(children: [
            Positioned(
              right: -30,
              bottom: -20,
              child: Icon(Icons.pedal_bike_rounded, size: 190, color: Colors.white.withValues(alpha: 0.10)),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
                  child: const Text('✨  Super App du Mali',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12.5)),
                ),
                const SizedBox(height: 14),
                const Text('Tout Bamako livré\nchez vous, en minutes.',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 24, height: 1.15)),
                const SizedBox(height: 16),
                _searchPill(context),
              ]),
            ),
          ]),
        ),
      );

  Widget _searchPill(BuildContext context) => GestureDetector(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SearchScreen())),
        child: Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
          child: Row(children: const [
            Icon(Icons.search_rounded, color: NC.brand),
            SizedBox(width: 10),
            Text('Rechercher un plat, un commerce…', style: TextStyle(color: Color(0xFF9AA0AD), fontSize: 15)),
          ]),
        ),
      );

  Widget _categories(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 20),
        child: SizedBox(
          height: 96,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (_, i) {
              final c = categories[i];
              return GestureDetector(
                onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => CategoryScreen(category: c))),
                child: Column(children: [
                  Container(
                    width: 66,
                    height: 66,
                    decoration: BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(20)),
                    child: Icon(c.icon, color: NC.brand, size: 28),
                  ),
                  const SizedBox(height: 8),
                  Text(c.label, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w600, fontSize: 13)),
                ]),
              );
            },
          ),
        ),
      );
}
