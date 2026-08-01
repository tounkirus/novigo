import 'package:flutter/material.dart';

import '../data/catalog_model.dart';
import '../data/feed_repository.dart';
import '../services_catalog.dart';
import '../ui/ui.dart';
import 'addresses.dart';
import 'all_services.dart';
import 'brain_ask.dart';
import 'for_you.dart';
import 'notifications.dart';
import 'search.dart';
import 'store.dart';

/// Accueil NOVIGO — **trois zones, pas une de plus**.
///
///   1. Qui je suis, où je suis, ce que je cherche.
///   2. Ce que je peux faire (sept services + « Plus »).
///   3. Ce que NOVIGO me propose (« Pour vous » + le Brain).
///
/// La version précédente empilait une barre, une recherche, sept catégories puis
/// la liste complète des restaurants : l'écran demandait un effort de lecture
/// avant la moindre action. Ici chaque zone porte une intention unique, et tout
/// le reste du catalogue vit derrière un « Voir tout » ou l'onglet Explorer.
class HomeScreen extends StatefulWidget {
  /// Bascule vers un autre onglet de la barre inférieure (fourni par le Shell).
  final ValueChanged<int>? onNavigateTab;

  const HomeScreen({super.key, this.onNavigateTab});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Le flux se charge après la première frame : l'accueil s'affiche
    // immédiatement, la section « Pour vous » se remplit ensuite.
    WidgetsBinding.instance.addPostFrameCallback((_) => feed.load());
  }

  Future<void> _refresh() async {
    await Future.wait([
      feed.load(force: true),
      catalog.loadCategory('repas'),
    ]);
  }

  void _push(WidgetBuilder builder) =>
      Navigator.of(context).push(MaterialPageRoute(builder: builder));

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: _refresh,
        color: NC.brand,
        backgroundColor: NC.surface,
        child: NovigoContentWidth(
          child: CustomScrollView(
            slivers: [
              // ───────── Zone 1 · Identité, lieu, recherche ─────────
              SliverPadding(
                padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, 0),
                sliver: SliverToBoxAdapter(child: _HomeHeader(onNavigateTab: widget.onNavigateTab)),
              ),
              SliverPadding(
                padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, 0),
                sliver: SliverToBoxAdapter(
                  child: NovigoSearchBar(
                    onTap: () => _push((_) => const SearchScreen()),
                    onVoice: () => _push((_) => const BrainAskScreen()),
                  ),
                ),
              ),

              // ───────── Zone 2 · Que voulez-vous faire ? ─────────
              SliverPadding(
                padding: EdgeInsets.fromLTRB(gutter, Sp.section, gutter, 0),
                sliver: SliverToBoxAdapter(
                  child: NovigoSectionHeader(
                    overline: 'Services',
                    title: 'Que voulez-vous faire ?',
                    actionLabel: 'Tout voir',
                    onAction: () => _push((_) => const AllServicesScreen()),
                  ),
                ),
              ),
              SliverPadding(
                padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, 0),
                sliver: SliverToBoxAdapter(child: _ServicesGrid(onOpenAll: () => _push((_) => const AllServicesScreen()))),
              ),

              // ───────── Zone 3 · Pour vous ─────────
              SliverPadding(
                padding: EdgeInsets.fromLTRB(gutter, Sp.section, gutter, 0),
                sliver: SliverToBoxAdapter(
                  child: NovigoSectionHeader(
                    overline: 'Sélection',
                    title: 'Pour vous',
                    onAction: () => _push((_) => const ForYouScreen()),
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: Sp.lg)),
              SliverToBoxAdapter(child: _ForYouRail(gutter: gutter)),

              SliverPadding(
                padding: EdgeInsets.fromLTRB(gutter, Sp.xl, gutter, 0),
                sliver: SliverToBoxAdapter(
                  child: NovigoBrainCard(onTap: () => _push((_) => const BrainAskScreen())),
                ),
              ),
              // Dégagement sous la barre de navigation et la barre de panier.
              const SliverToBoxAdapter(child: SizedBox(height: 120)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Salutation, localisation, notifications, avatar.
class _HomeHeader extends StatelessWidget {
  final ValueChanged<int>? onNavigateTab;
  const _HomeHeader({this.onNavigateTab});

  /// Salutation selon l'heure : un « Bonsoir » à 21 h coûte une ligne de code et
  /// change la sensation de l'application.
  static String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Pas de prénom inventé : le backend ne fournit aujourd'hui que le
          // numéro, et « Bonjour Youssouf » sur le compte de quelqu'un d'autre
          // fait plus de dégâts qu'une salutation neutre n'apporte de chaleur.
          Row(children: [
            Flexible(
              child: Text('$_greeting 👋',
                  style: T.h2, maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          ]),
          const SizedBox(height: Sp.xs + 1),
          Semantics(
            button: true,
            label: 'Changer d\'adresse de livraison, actuellement Bamako',
            child: InkWell(
              onTap: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => const AddressesScreen())),
              borderRadius: BorderRadius.circular(R.pill),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: Sp.xs, horizontal: 2),
                child: Row(mainAxisSize: MainAxisSize.min, children: const [
                  Icon(Icons.place_rounded, size: 15, color: NC.brand),
                  SizedBox(width: 5),
                  // Une adresse longue se tronque : elle ne doit pas pousser le
                  // chevron hors de l'écran sur un petit téléphone.
                  Flexible(
                    child: Text('Bamako, Hamdallaye',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: NC.muted, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  ),
                  Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: NC.faint),
                ]),
              ),
            ),
          ),
        ]),
      ),
      const SizedBox(width: Sp.sm),
      NovigoIconButton(
        icon: Icons.notifications_none_rounded,
        tooltip: 'Notifications',
        onPressed: () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const NotificationsScreen())),
      ),
      const SizedBox(width: Sp.xs),
      Semantics(
        button: true,
        label: 'Mon profil',
        child: PressableScale(
          onTap: () => onNavigateTab?.call(4),
          scale: 0.9,
          child: SizedBox(
            width: 44,
            height: 44,
            child: Center(
              child: Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
                alignment: Alignment.center,
                child: const Icon(Icons.person_rounded, color: Colors.white, size: 21),
              ),
            ),
          ),
        ),
      ),
    ]);
  }
}

/// Grille 4 × 2 : sept services prioritaires + « Plus ».
class _ServicesGrid extends StatelessWidget {
  final VoidCallback onOpenAll;
  const _ServicesGrid({required this.onOpenAll});

  @override
  Widget build(BuildContext context) {
    final services = homeServices;
    return NovigoServiceGrid(
      columns: 4,
      tiles: [
        for (final s in services)
          NovigoServiceTile(
            icon: s.icon,
            label: s.label,
            tone: s.tone,
            onTap: () {
              final destination = s.destination;
              if (destination == null) return;
              Navigator.of(context).push(MaterialPageRoute(builder: destination));
            },
          ),
        NovigoServiceTile(
          icon: Icons.more_horiz_rounded,
          label: 'Plus',
          tone: Tone.more,
          onTap: onOpenAll,
        ),
      ],
    );
  }
}

/// Carrousel « Pour vous » — chargement, vide et contenu gérés explicitement.
class _ForYouRail extends StatelessWidget {
  final double gutter;
  const _ForYouRail({required this.gutter});

  @override
  Widget build(BuildContext context) {
    final cardWidth = Rs.of(context).carouselCardWidth;
    // Photo 16/9 + deux lignes de texte : la hauteur est calculée à partir de
    // l'échelle de police réelle, pas devinée — sinon la carte déborde dès que
    // l'utilisateur agrandit le texte système.
    final height = NovigoPromoCard.carouselHeight(context, cardWidth);

    return ListenableBuilder(
      listenable: feed,
      builder: (context, _) {
        if (feed.loading && feed.isEmpty) {
          return NovigoCarousel(
            height: height,
            gutter: gutter,
            itemCount: 3,
            itemBuilder: (_, __) => NovigoPromoCardSkeleton(width: cardWidth),
          );
        }
        if (feed.isEmpty) {
          return Padding(
            padding: EdgeInsets.symmetric(horizontal: gutter),
            child: NovigoCard(
              child: Row(children: [
                const Icon(Icons.auto_awesome_outlined, color: NC.faint, size: 22),
                const SizedBox(width: Sp.md),
                const Expanded(
                  child: Text('Vos recommandations arriveront après votre première commande.',
                      style: T.muted),
                ),
              ]),
            ),
          );
        }
        return NovigoCarousel(
          height: height,
          gutter: gutter,
          itemCount: feed.items.length,
          itemBuilder: (context, i) => FadeSlideIn(
            index: i,
            child: NovigoPromoCard(
              item: feed.items[i],
              width: cardWidth,
              onTap: () => openFeedItem(context, feed.items[i]),
            ),
          ),
        );
      },
    );
  }
}

/// Ouvre la destination d'une recommandation (commerce, service ou catégorie).
void openFeedItem(BuildContext context, FeedItem item) {
  if (item.storeId != null) {
    final matches = catalog.allStores.where((s) => s.id == item.storeId);
    if (matches.isNotEmpty) {
      Navigator.of(context)
          .push(MaterialPageRoute(builder: (_) => StoreScreen(store: matches.first)));
      return;
    }
  }
  if (item.serviceId != null) {
    final services = allNovigoServices.where((s) => s.id == item.serviceId);
    final destination = services.isEmpty ? null : services.first.destination;
    if (destination != null) {
      Navigator.of(context).push(MaterialPageRoute(builder: destination));
      return;
    }
  }
  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AllServicesScreen()));
}
