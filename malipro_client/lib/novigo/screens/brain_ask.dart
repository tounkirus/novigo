import 'package:flutter/material.dart';

import '../data/brain_ask_repository.dart';
import '../data/catalog_model.dart';
import '../services_catalog.dart';
import '../ui/ui.dart';
import 'store.dart';

/// Carte d'appel du NOVIGO Brain, posée en bas de l'accueil.
///
/// Délibérément discrète : l'accueil reste une page de services, pas une
/// conversation. Le Brain se propose, il ne s'impose pas.
class NovigoBrainCard extends StatelessWidget {
  final VoidCallback onTap;
  const NovigoBrainCard({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      onTap: onTap,
      radius: R.xl,
      gradient: NC.premiumGradient,
      semanticLabel: 'NOVIGO Brain, poser une question',
      child: Row(children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Icon(Icons.auto_awesome_rounded, color: NC.gold, size: 23),
        ),
        const SizedBox(width: Sp.md + 2),
        const Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('NOVIGO Brain',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15.5)),
            SizedBox(height: 3),
            Text('Que puis-je trouver pour vous ?',
                style: TextStyle(color: Colors.white70, fontSize: 13),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
          ]),
        ),
        const Icon(Icons.arrow_forward_rounded, color: Colors.white70, size: 20),
      ]),
    );
  }
}

/// Écran de demande en langage naturel.
///
/// L'écran est déjà branché sur le contrat `BrainAskRepository` : hors ligne il
/// route la demande vers le bon service, en ligne il passera par le Brain réel
/// sans qu'une ligne d'interface change.
class BrainAskScreen extends StatefulWidget {
  const BrainAskScreen({super.key});

  @override
  State<BrainAskScreen> createState() => _BrainAskScreenState();
}

class _BrainAskScreenState extends State<BrainAskScreen> {
  final _ctrl = TextEditingController();
  final _repo = brainAsk;

  BrainAnswer? _answer;
  bool _asking = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _ask(String prompt) async {
    final q = prompt.trim();
    if (q.isEmpty || _asking) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _asking = true;
      _answer = null;
    });
    try {
      final answer = await _repo.ask(q);
      if (!mounted) return;
      setState(() => _answer = answer);
    } finally {
      if (mounted) setState(() => _asking = false);
    }
  }

  void _follow(BrainSuggestion s) {
    if (s.storeId != null) {
      final matches = catalog.allStores.where((x) => x.id == s.storeId);
      if (matches.isNotEmpty) {
        Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => StoreScreen(store: matches.first)));
        return;
      }
    }
    if (s.serviceId != null) {
      final services = allNovigoServices.where((x) => x.id == s.serviceId);
      final destination = services.isEmpty ? null : services.first.destination;
      if (destination != null) {
        Navigator.of(context).push(MaterialPageRoute(builder: destination));
        return;
      }
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Ce service arrive bientôt sur NOVIGO')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(color: NC.ink),
        title: Row(children: const [
          Icon(Icons.auto_awesome_rounded, color: NC.gold, size: 20),
          SizedBox(width: Sp.sm),
          Flexible(
            child: Text('NOVIGO Brain',
                style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
        ]),
      ),
      body: NovigoContentWidth(
        child: ListView(
          padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xxl),
          children: [
            const Text('Dites-moi ce dont vous avez besoin', style: T.h1),
            const SizedBox(height: Sp.sm),
            const Text(
              'En une phrase, comme à un ami. Je vous emmène au bon endroit.',
              style: T.muted,
            ),
            const SizedBox(height: Sp.xl),
            NovigoSearchBar.field(
              controller: _ctrl,
              hint: 'Trouve-moi un plombier ce soir…',
              onSubmitted: _ask,
              leading: const Icon(Icons.auto_awesome_rounded, color: NC.gold, size: 22),
            ),
            const SizedBox(height: Sp.md),
            NovigoButton(
              label: 'Demander au Brain',
              icon: Icons.send_rounded,
              loading: _asking,
              onPressed: () => _ask(_ctrl.text),
            ),
            const SizedBox(height: Sp.section),
            if (_asking) ...[
              const NovigoSkeleton(height: 68, radius: R.lg),
              const SizedBox(height: Sp.md),
              const NovigoSkeleton(height: 68, radius: R.lg),
            ] else if (_answer == null)
              _starters()
            else
              _result(_answer!),
          ],
        ),
      ),
    );
  }

  Widget _starters() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const NovigoSectionHeader(title: 'Essayez par exemple', overline: 'Suggestions'),
        const SizedBox(height: Sp.lg),
        for (final s in _repo.starters)
          Padding(
            padding: const EdgeInsets.only(bottom: Sp.md),
            child: NovigoCard(
              onTap: () {
                _ctrl.text = s;
                _ask(s);
              },
              padding: const EdgeInsets.all(Sp.md + 2),
              radius: R.md,
              child: Row(children: [
                const Icon(Icons.north_east_rounded, size: 17, color: NC.faint),
                const SizedBox(width: Sp.md),
                Expanded(child: Text(s, style: T.body)),
              ]),
            ),
          ),
      ]);

  Widget _result(BrainAnswer answer) {
    if (answer.isEmpty) {
      return NovigoEmptyState.empty(
        icon: Icons.psychology_alt_outlined,
        title: answer.headline,
        message: 'Reformulez avec le service recherché — « repas », « colis », « plombier »…',
        actionLabel: 'Voir tous les services',
        onAction: () => Navigator.of(context).pop(),
      );
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(answer.headline, style: T.h2),
      const SizedBox(height: Sp.xs + 2),
      Text(
        answer.live
            ? 'Décision du NOVIGO Brain.'
            : 'Aiguillage local — le Brain en ligne affinera cette réponse.',
        style: T.muted,
      ),
      const SizedBox(height: Sp.lg),
      for (var i = 0; i < answer.suggestions.length; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: Sp.md),
          child: FadeSlideIn(
            index: i,
            child: NovigoCard(
              onTap: () => _follow(answer.suggestions[i]),
              padding: const EdgeInsets.all(Sp.md + 2),
              radius: R.md,
              child: Row(children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: NC.brandSoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.bolt_rounded, color: NC.brand, size: 20),
                ),
                const SizedBox(width: Sp.md),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(answer.suggestions[i].label,
                        style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(answer.suggestions[i].reason,
                        style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ]),
                ),
                const Icon(Icons.chevron_right_rounded, color: NC.faint),
              ]),
            ),
          ),
        ),
    ]);
  }
}
