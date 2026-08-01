import 'dart:async';

import 'package:flutter/material.dart';

import '../data/catalog_model.dart';
import '../models.dart';
import '../services_catalog.dart';
import '../ui/ui.dart';
import 'store.dart';

/// Recherche unifiée : commerces **et** services NOVIGO.
///
/// Taper « pharmacie » doit proposer la rubrique Pharmacie autant que les
/// pharmacies elles-mêmes — l'utilisateur ne sait pas, et n'a pas à savoir, si
/// ce qu'il cherche est un service ou un commerce.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  String _q = '';
  Timer? _debounce;
  bool _searching = false;
  Object? _error;
  List<Store> _stores = const [];
  List<NovigoService> _services = const [];

  static const _suggestions = [
    'Tiéboudienne',
    'Yassa',
    'Pizza',
    'Poulet braisé',
    'Attiéké',
    'Pharmacie',
    'Plombier',
    'Taxi',
  ];

  @override
  void dispose() {
    _debounce?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  /// Recherche côté serveur, temporisée : filtrer localement ne verrait que les
  /// quelques commerces déjà chargés, sur un catalogue qui en compte 1 450.
  void _onQueryChanged(String v) {
    setState(() {
      _q = v;
      _services = searchNovigoServices(v); // instantané, purement local
    });
    _debounce?.cancel();
    if (v.trim().isEmpty) {
      setState(() {
        _stores = const [];
        _searching = false;
        _error = null;
      });
      return;
    }
    setState(() {
      _searching = true;
      _error = null;
    });
    _debounce = Timer(const Duration(milliseconds: 350), () => _run(v));
  }

  Future<void> _run(String query) async {
    try {
      final found = await catalog.search(query);
      if (!mounted || query != _q) return; // une frappe plus récente a pris la main
      setState(() {
        _stores = found;
        _searching = false;
      });
    } catch (e) {
      if (!mounted || query != _q) return;
      setState(() {
        _error = e;
        _searching = false;
      });
    }
  }

  NovigoStatus get _status {
    if (_searching && _stores.isEmpty && _services.isEmpty) return NovigoStatus.loading;
    if (_error != null && _stores.isEmpty) return NovigoStatus.error;
    if (_stores.isEmpty && _services.isEmpty) return NovigoStatus.empty;
    return NovigoStatus.loaded;
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        leading: const BackButton(color: NC.ink),
        title: Padding(
          padding: EdgeInsets.only(right: gutter),
          child: NovigoSearchBar.field(
            controller: _ctrl,
            hint: 'Plat, commerce ou service…',
            onChanged: _onQueryChanged,
            onSubmitted: _onQueryChanged,
          ),
        ),
        toolbarHeight: 70,
      ),
      body: _q.trim().isEmpty ? _suggestionsView(gutter) : _resultsView(gutter),
    );
  }

  Widget _suggestionsView(double gutter) => ListView(
        padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, Sp.xxl),
        children: [
          const NovigoSectionHeader(overline: 'Tendances', title: 'Recherches populaires'),
          const SizedBox(height: Sp.lg),
          Wrap(
            spacing: Sp.sm + 2,
            runSpacing: Sp.sm + 2,
            children: [
              for (final s in _suggestions)
                NovigoChip(
                  label: s,
                  icon: Icons.trending_up_rounded,
                  onTap: () {
                    _ctrl.text = s;
                    _onQueryChanged(s);
                  },
                ),
            ],
          ),
        ],
      );

  Widget _resultsView(double gutter) => NovigoStateView(
        status: _status,
        onRetry: () => _run(_q),
        errorMessage: 'La recherche n\'a pas abouti. Vérifiez votre connexion.',
        loading: (_) => ListView(
          padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, Sp.xxl),
          children: const [NovigoMerchantListSkeleton(count: 2)],
        ),
        emptyState: NovigoEmptyState.empty(
          icon: Icons.search_off_rounded,
          title: 'Aucun résultat',
          message: 'Essayez un autre plat, commerce ou service.',
          actionLabel: 'Effacer',
          onAction: () {
            _ctrl.clear();
            _onQueryChanged('');
          },
        ),
        loaded: (context) => NovigoContentWidth(
          child: ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, Sp.xxl),
            children: [
              if (_services.isNotEmpty) ...[
                const NovigoSectionHeader(overline: 'Services', title: 'Services NOVIGO'),
                const SizedBox(height: Sp.md),
                NovigoTileGroup(children: [
                  for (final s in _services.take(4))
                    NovigoTile(
                      icon: s.icon,
                      tone: s.tone,
                      label: s.label,
                      subtitle: s.available ? s.subtitle : 'Bientôt disponible',
                      onTap: () {
                        final destination = s.destination;
                        if (destination == null) return;
                        Navigator.of(context).push(MaterialPageRoute(builder: destination));
                      },
                    ),
                ]),
                const SizedBox(height: Sp.section),
              ],
              if (_stores.isNotEmpty) ...[
                NovigoSectionHeader(
                  overline: 'Commerces',
                  title: '${_stores.length} résultat${_stores.length > 1 ? 's' : ''}',
                ),
                const SizedBox(height: Sp.lg),
                for (var i = 0; i < _stores.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: Sp.lg),
                    child: FadeSlideIn(
                      index: i,
                      child: NovigoMerchantCard(
                        store: _stores[i],
                        onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => StoreScreen(store: _stores[i]))),
                      ),
                    ),
                  ),
              ] else if (_searching)
                const NovigoMerchantListSkeleton(count: 2),
            ],
          ),
        ),
      );
}
