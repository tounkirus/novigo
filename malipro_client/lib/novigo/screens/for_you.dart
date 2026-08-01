import 'package:flutter/material.dart';

import '../data/catalog_model.dart';
import '../data/feed_repository.dart';
import '../ui/ui.dart';
import 'home.dart' show openFeedItem;
import 'store.dart';

/// « Voir tout » de la section Pour vous.
///
/// Deux sections seulement : les recommandations en pleine largeur, puis les
/// commerces les mieux notés du catalogue chargé. Le carrousel de l'accueil
/// n'en montre que quelques-unes — ici on déroule, mais on ne mélange pas.
class ForYouScreen extends StatefulWidget {
  const ForYouScreen({super.key});

  @override
  State<ForYouScreen> createState() => _ForYouScreenState();
}

class _ForYouScreenState extends State<ForYouScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => feed.load());
  }

  NovigoStatus get _status {
    if (feed.loading && feed.isEmpty) return NovigoStatus.loading;
    if (feed.error != null && feed.isEmpty) return NovigoStatus.error;
    if (feed.isEmpty) return NovigoStatus.empty;
    return NovigoStatus.loaded;
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pour vous', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListenableBuilder(
        listenable: feed,
        builder: (context, _) => NovigoStateView(
          status: _status,
          onRetry: () => feed.load(force: true),
          loading: (_) => ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, Sp.xxl),
            children: const [NovigoMerchantListSkeleton()],
          ),
          emptyState: const NovigoEmptyState.empty(
            icon: Icons.auto_awesome_outlined,
            title: 'Rien à recommander pour l\'instant',
            message: 'Passez une première commande : NOVIGO apprendra ce que vous aimez.',
          ),
          loaded: (context) => RefreshIndicator(
            onRefresh: () => feed.load(force: true),
            color: NC.brand,
            backgroundColor: NC.surface,
            child: NovigoContentWidth(
              child: ListView(
                padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, Sp.xxl),
                children: [
                  const NovigoSectionHeader(
                    overline: 'Sélection',
                    title: 'Recommandé pour vous',
                    subtitle: 'D\'après les commerces disponibles autour de vous',
                  ),
                  const SizedBox(height: Sp.lg),
                  for (var i = 0; i < feed.items.length; i++)
                    Padding(
                      padding: const EdgeInsets.only(bottom: Sp.lg),
                      child: FadeSlideIn(
                        index: i,
                        child: _FeedRow(
                          item: feed.items[i],
                          onTap: () => openFeedItem(context, feed.items[i]),
                        ),
                      ),
                    ),
                  const SizedBox(height: Sp.md),
                  const NovigoSectionHeader(
                    overline: 'Catalogue',
                    title: 'Les mieux notés',
                  ),
                  const SizedBox(height: Sp.lg),
                  ..._topRated(context),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _topRated(BuildContext context) {
    final stores = [...catalog.allStores]..sort((a, b) => b.rating.compareTo(a.rating));
    return [
      for (final s in stores.take(6))
        Padding(
          padding: const EdgeInsets.only(bottom: Sp.lg),
          child: NovigoMerchantCard(
            store: s,
            onTap: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => StoreScreen(store: s))),
          ),
        ),
    ];
  }
}

/// Recommandation en pleine largeur (visuel large + titre + contexte).
class _FeedRow extends StatelessWidget {
  final FeedItem item;
  final VoidCallback onTap;
  const _FeedRow({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return NovigoPromoCard(item: item, onTap: onTap, width: double.infinity);
  }
}
