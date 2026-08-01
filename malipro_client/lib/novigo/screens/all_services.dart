import 'package:flutter/material.dart';

import '../services_catalog.dart';
import '../ui/ui.dart';

/// Catalogue complet des services NOVIGO, rangé par rubrique.
///
/// C'est la contrepartie du bouton « Plus » de l'accueil : l'accueil ne montre
/// que sept services, tout le reste vit ici, structuré. Une rubrique par
/// intention (se déplacer, commander, réserver…), jamais un mur d'icônes.
class AllServicesScreen extends StatelessWidget {
  /// Rubrique à ouvrir en premier (facultatif) — le rail de filtres s'y place.
  final String? initialGroupId;

  const AllServicesScreen({super.key, this.initialGroupId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tous les services', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: AllServicesBody(initialGroupId: initialGroupId),
    );
  }
}

/// Corps réutilisable : servi tel quel dans l'onglet « Explorer » (sans
/// `Scaffold`) et dans l'écran plein ouvert depuis « Plus ».
class AllServicesBody extends StatefulWidget {
  final String? initialGroupId;
  final Widget? header;

  const AllServicesBody({super.key, this.initialGroupId, this.header});

  @override
  State<AllServicesBody> createState() => _AllServicesBodyState();
}

class _AllServicesBodyState extends State<AllServicesBody> {
  late final List<NovigoServiceGroup> _groups = novigoServiceGroups;
  final _scroll = ScrollController();
  final Map<String, GlobalKey> _anchors = {};
  int _selected = 0;

  @override
  void initState() {
    super.initState();
    for (final g in _groups) {
      _anchors[g.id] = GlobalKey();
    }
    final initial = _groups.indexWhere((g) => g.id == widget.initialGroupId);
    if (initial > 0) {
      _selected = initial;
      // Le défilement ne peut viser une ancre qu'une fois la première frame
      // posée : avant cela, aucune des rubriques n'a de position connue.
      WidgetsBinding.instance.addPostFrameCallback((_) => _jumpTo(initial));
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _jumpTo(int index) {
    setState(() => _selected = index);
    final ctx = _anchors[_groups[index].id]?.currentContext;
    if (ctx == null) return;
    Scrollable.ensureVisible(
      ctx,
      duration: M.page,
      curve: M.ease,
      alignment: 0.02,
    );
  }

  void _open(NovigoService service) {
    final destination = service.destination;
    if (destination == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${service.label} — bientôt disponible sur NOVIGO'),
          duration: const Duration(seconds: 2),
        ),
      );
      return;
    }
    Navigator.of(context).push(MaterialPageRoute(builder: destination));
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Column(children: [
      if (widget.header != null) widget.header!,
      // Rail de rubriques : permet d'atteindre « Payer » sans traverser tout
      // le catalogue au doigt.
      NovigoChipRail(
        labels: [for (final g in _groups) g.title],
        selectedIndex: _selected,
        onSelected: _jumpTo,
        padding: EdgeInsets.symmetric(horizontal: gutter),
      ),
      Expanded(
        child: NovigoContentWidth(
          child: ListView.separated(
            controller: _scroll,
            padding: EdgeInsets.fromLTRB(gutter, Sp.md, gutter, Sp.xxl),
            itemCount: _groups.length,
            separatorBuilder: (_, __) => const SizedBox(height: Sp.section),
            itemBuilder: (context, i) => FadeSlideIn(
              index: i,
              child: _Group(
                key: _anchors[_groups[i].id],
                group: _groups[i],
                onOpen: _open,
              ),
            ),
          ),
        ),
      ),
    ]);
  }
}

class _Group extends StatelessWidget {
  final NovigoServiceGroup group;
  final ValueChanged<NovigoService> onOpen;

  const _Group({super.key, required this.group, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      NovigoSectionHeader(title: group.title, subtitle: group.subtitle),
      const SizedBox(height: Sp.lg),
      NovigoServiceGrid(
        tiles: [
          for (final s in group.services)
            Opacity(
              // Un service annoncé mais pas encore ouvert reste lisible, sans
              // se faire passer pour un parcours disponible.
              opacity: s.available ? 1 : 0.55,
              child: NovigoServiceTile(
                icon: s.icon,
                label: s.label,
                tone: s.tone,
                badge: s.available ? s.badge : 'Bientôt',
                onTap: () => onOpen(s),
              ),
            ),
        ],
      ),
    ]);
  }
}
