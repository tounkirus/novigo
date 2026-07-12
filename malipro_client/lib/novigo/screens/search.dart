import 'package:flutter/material.dart';
import '../theme.dart';
import '../data/catalog_model.dart';
import '../models.dart';
import '../widgets.dart';
import 'store.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  String _q = '';
  final _suggestions = const ['Tiéboudienne', 'Yassa', 'Pizza', 'Poulet braisé', 'Attiéké', 'Burger'];

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  List<Store> get _stores {
    final q = _q.trim().toLowerCase();
    if (q.isEmpty) return [];
    return catalog.allStores.where((s) {
      if (s.name.toLowerCase().contains(q) || s.cuisine.toLowerCase().contains(q) || s.district.toLowerCase().contains(q)) {
        return true;
      }
      return s.products.any((p) => p.name.toLowerCase().contains(q));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Container(
          height: 44,
          margin: const EdgeInsets.only(right: 16),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(14)),
          child: Row(children: [
            const Icon(Icons.search_rounded, color: NC.brand, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _ctrl,
                autofocus: true,
                style: const TextStyle(color: NC.ink, fontSize: 15),
                cursorColor: NC.brand,
                decoration: const InputDecoration(
                  isCollapsed: true,
                  border: InputBorder.none,
                  hintText: 'Rechercher un plat, un commerce…',
                  hintStyle: TextStyle(color: NC.faint, fontSize: 15),
                ),
                onChanged: (v) => setState(() => _q = v),
              ),
            ),
            if (_q.isNotEmpty)
              GestureDetector(
                onTap: () => setState(() {
                  _q = '';
                  _ctrl.clear();
                }),
                child: const Icon(Icons.close_rounded, color: NC.muted, size: 20),
              ),
          ]),
        ),
      ),
      body: _q.trim().isEmpty ? _empty() : _results(),
    );
  }

  Widget _empty() => ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Suggestions', style: T.h2),
        const SizedBox(height: 12),
        Wrap(spacing: 10, runSpacing: 10, children: [
          for (final s in _suggestions)
            GestureDetector(
              onTap: () => setState(() {
                _q = s;
                _ctrl.text = s;
              }),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(999)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.trending_up_rounded, size: 16, color: NC.brand),
                  const SizedBox(width: 6),
                  Text(s, style: T.chip),
                ]),
              ),
            ),
        ]),
      ]);

  Widget _results() {
    final stores = _stores;
    if (stores.isEmpty) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: const [
          Icon(Icons.search_off_rounded, size: 48, color: NC.faint),
          SizedBox(height: 12),
          Text('Aucun résultat', style: T.h2),
          SizedBox(height: 6),
          Text('Essayez un autre plat ou commerce.', style: T.muted),
        ]),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: stores.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (_, i) {
        if (i == 0) {
          return Text('${stores.length} résultat${stores.length > 1 ? 's' : ''}', style: T.muted);
        }
        final s = stores[i - 1];
        return StoreCard(
          store: s,
          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => StoreScreen(store: s))),
        );
      },
    );
  }
}
