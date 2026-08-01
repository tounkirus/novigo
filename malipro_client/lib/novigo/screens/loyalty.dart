import 'package:flutter/material.dart';

import '../data/env.dart';
import '../data/loyalty_api.dart';
import '../ui/ui.dart';

/// Récompense prête à afficher (démonstration ou live, même rendu).
class _RewardVM {
  final String id, title;
  final int cost;
  final bool affordable;
  final IconData icon;
  final Color accent;
  const _RewardVM(this.id, this.title, this.cost, this.affordable, this.icon, this.accent);

  factory _RewardVM.fromLive(RewardDto r) {
    final (icon, accent) = _visualFor(r.id);
    return _RewardVM(r.id, r.title, r.cost, r.affordable, icon, accent);
  }

  static (IconData, Color) _visualFor(String id) {
    switch (id) {
      case 'free_delivery':
        return (Icons.pedal_bike_rounded, NC.success);
      case 'discount_1000':
        return (Icons.savings_rounded, NC.brand);
      case 'free_drink':
        return (Icons.local_cafe_rounded, NC.gold);
      case 'voucher_5000':
        return (Icons.card_giftcard_rounded, NC.violet);
      default:
        return (Icons.card_giftcard_rounded, NC.brand);
    }
  }
}

/// Point d'historique prêt à afficher.
class _HistVM {
  final String label, when;
  final int pts;
  const _HistVM(this.label, this.when, this.pts);
}

// Défauts de démonstration (offline).
const int _demoPoints = 1240;
const int _demoNextTier = 2000;

const List<_RewardVM> _demoRewards = [
  _RewardVM('free_delivery', 'Livraison offerte', 200, true, Icons.pedal_bike_rounded, NC.success),
  _RewardVM('discount_1000', '-1 000 FCFA', 500, true, Icons.savings_rounded, NC.brand),
  _RewardVM('free_drink', 'Boisson offerte', 350, true, Icons.local_cafe_rounded, NC.gold),
  _RewardVM(
      'voucher_5000', 'Bon de 5 000 FCFA', 2000, false, Icons.card_giftcard_rounded, NC.violet),
];

const List<_HistVM> _demoHistory = [
  _HistVM('Commande Aux Trois Fleuves', 'Aujourd\'hui · 12:40', 43),
  _HistVM('Commande Pharmacie du Point G', 'Hier · 18:22', 65),
  _HistVM('Échange · Livraison offerte', 'Lun · 11:05', -200),
  _HistVM('Bonus parrainage', 'Sam · 09:30', 250),
];

/// Fidélité — **trois sections** : mon solde, ce que je peux en faire, ce que
/// j'ai gagné.
///
/// En mode live, tout provient du domaine finance ; un échec réseau est signalé
/// au lieu de replacer discrètement le solde de démonstration à la place du
/// vrai. L'échange d'une récompense porte désormais son état de chargement.
class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> {
  int _points = _demoPoints;
  int _nextTier = _demoNextTier;
  int _toNext = _demoNextTier - _demoPoints;
  String _tier = 'SILVER';
  String _nextTierName = 'GOLD';
  List<_RewardVM> _rewards = _demoRewards;
  List<_HistVM> _history = _demoHistory;

  bool _live = false;
  bool _loading = false;
  bool _failed = false;
  String? _redeeming;

  @override
  void initState() {
    super.initState();
    if (NovigoEnv.live) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final me = await loyaltyApi.me();
      final rewards = await loyaltyApi.rewards();
      final history = await loyaltyApi.history();
      if (!mounted) return;
      setState(() {
        _live = true;
        _points = me.points;
        _nextTier = me.nextTierPoints;
        _toNext = me.toNext;
        _tier = me.tier;
        _nextTierName = me.nextTier;
        if (rewards.isNotEmpty) _rewards = rewards.map(_RewardVM.fromLive).toList();
        _history = history.map((e) => _HistVM(e.label, e.when, e.delta)).toList();
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _failed = true;
      });
    }
  }

  Future<void> _redeem(_RewardVM r) async {
    if (!r.affordable) {
      _toast('Pas assez de points pour « ${r.title} »');
      return;
    }
    if (!_live) {
      _toast('« ${r.title} » échangé contre ${r.cost} pts');
      return;
    }
    setState(() => _redeeming = r.id);
    try {
      await loyaltyApi.redeem(r.id);
      if (!mounted) return;
      _toast('« ${r.title} » échangé contre ${r.cost} pts');
      await _load();
    } catch (_) {
      if (mounted) _toast('Échange impossible, réessayez');
    } finally {
      if (mounted) setState(() => _redeeming = null);
    }
  }

  void _toast(String msg) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: NC.surfaceAlt,
      behavior: SnackBarBehavior.floating,
    ));

  String _fmt(int n) =>
      n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]} ');

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final progress = (_nextTier <= 0 ? 1.0 : _points / _nextTier).clamp(0.0, 1.0);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fidélité', style: T.title),
        leading: const BackButton(color: NC.ink),
        actions: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: Sp.lg + 2),
              child: Center(
                child: SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: NC.brand)),
              ),
            ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          onRefresh: NovigoEnv.live ? _load : () async {},
          color: NC.brand,
          backgroundColor: NC.surface,
          child: NovigoContentWidth(
            child: ListView(
              padding: EdgeInsets.fromLTRB(gutter, Sp.md, gutter, Sp.xl),
              children: [
                if (_failed) NovigoOfflineBanner(onRetry: _load),

                // ───────── Section 1 · Mon solde ─────────
                NovigoCard(
                  gradient: NC.premiumGradient,
                  radius: R.xl,
                  padding: const EdgeInsets.all(Sp.gutter),
                  elevated: true,
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      const Text('Mes points',
                          style: TextStyle(color: Colors.white70, fontSize: 13)),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: Sp.xs + 2),
                        decoration: BoxDecoration(
                            color: NC.gold.withValues(alpha: 0.22),
                            borderRadius: BorderRadius.circular(R.pill)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.workspace_premium_rounded, color: NC.gold, size: 15),
                          const SizedBox(width: 5),
                          Text(tierLabel(_tier),
                              style: const TextStyle(
                                  color: NC.gold, fontWeight: FontWeight.w800, fontSize: 12.5)),
                        ]),
                      ),
                    ]),
                    const SizedBox(height: Sp.sm),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(_fmt(_points),
                              style: const TextStyle(
                                  color: Colors.white, fontWeight: FontWeight.w900, fontSize: 38)),
                          const SizedBox(width: Sp.xs + 2),
                          const Padding(
                            padding: EdgeInsets.only(bottom: Sp.xs + 2),
                            child: Text('pts',
                                style: TextStyle(
                                    color: Colors.white70,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: Sp.lg),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(R.pill),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 9,
                        backgroundColor: Colors.white.withValues(alpha: 0.18),
                        valueColor: const AlwaysStoppedAnimation(NC.gold),
                      ),
                    ),
                    const SizedBox(height: Sp.sm),
                    Text(
                        _toNext <= 0
                            ? 'Palier maximum atteint · merci de votre fidélité'
                            : 'Encore ${_fmt(_toNext)} pts pour atteindre le palier ${tierLabel(_nextTierName)}',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12.5, fontWeight: FontWeight.w600)),
                  ]),
                ),
                const SizedBox(height: Sp.lg),
                Row(children: [
                  _TierChip(
                      label: 'Bronze',
                      icon: Icons.military_tech_rounded,
                      color: const Color(0xFFCD7F32),
                      active: _tier == 'BRONZE'),
                  const SizedBox(width: Sp.md - 2),
                  _TierChip(
                      label: 'Argent',
                      icon: Icons.workspace_premium_rounded,
                      color: const Color(0xFFC0C0C0),
                      active: _tier == 'SILVER'),
                  const SizedBox(width: Sp.md - 2),
                  _TierChip(
                      label: 'Or',
                      icon: Icons.emoji_events_rounded,
                      color: NC.gold,
                      active: _tier == 'GOLD'),
                ]),

                // ───────── Section 2 · Échanger ─────────
                const SizedBox(height: Sp.section),
                const NovigoSectionHeader(overline: 'Boutique', title: 'Échanger mes points'),
                const SizedBox(height: Sp.md),
                GridView.count(
                  crossAxisCount: Rs.of(context).isTablet ? 4 : 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: Sp.md,
                  mainAxisSpacing: Sp.md,
                  childAspectRatio: 0.98,
                  children: [
                    for (final r in _rewards)
                      _RewardCard(
                        reward: r,
                        busy: _redeeming == r.id,
                        onTap: () => _redeem(r),
                      ),
                  ],
                ),

                // ───────── Section 3 · Historique ─────────
                const SizedBox(height: Sp.section),
                const NovigoSectionHeader(overline: 'Mouvements', title: 'Historique des points'),
                const SizedBox(height: Sp.md),
                if (_history.isEmpty)
                  const NovigoEmptyState.empty(
                    icon: Icons.stars_rounded,
                    title: 'Aucun mouvement',
                    message: 'Vos points gagnés et échangés apparaîtront ici.',
                  )
                else
                  for (var i = 0; i < _history.length; i++) ...[
                    if (i > 0) const SizedBox(height: Sp.md),
                    FadeSlideIn(index: i, child: _HistoryRow(entry: _history[i])),
                  ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  final _HistVM entry;
  const _HistoryRow({required this.entry});

  @override
  Widget build(BuildContext context) {
    final gain = entry.pts > 0;
    return NovigoCard(
      radius: R.md,
      padding: const EdgeInsets.all(Sp.md + 2),
      semanticLabel: '${entry.label}, ${entry.when}, ${gain ? '+' : ''}${entry.pts} points',
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
              color: (gain ? NC.success : NC.brand).withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12)),
          child: Icon(gain ? Icons.add_rounded : Icons.redeem_rounded,
              color: gain ? NC.success : NC.brand, size: 20),
        ),
        const SizedBox(width: Sp.md),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(entry.label, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            Text(entry.when, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
        const SizedBox(width: Sp.sm),
        Flexible(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerRight,
            child: Text('${gain ? '+' : ''}${entry.pts} pts',
                style: TextStyle(
                    color: gain ? NC.success : NC.ink,
                    fontWeight: FontWeight.w800,
                    fontSize: 13.5)),
          ),
        ),
      ]),
    );
  }
}

class _TierChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool active;

  const _TierChip(
      {required this.label, required this.icon, required this.color, required this.active});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: NovigoCard(
        radius: 16,
        padding: const EdgeInsets.symmetric(vertical: Sp.md + 2, horizontal: Sp.xs),
        border: active ? Border.all(color: color, width: 1.5) : null,
        semanticLabel: active ? 'Palier actuel : $label' : 'Palier $label',
        child: Column(children: [
          Icon(icon, color: active ? color : NC.faint, size: 24),
          const SizedBox(height: Sp.xs + 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(label,
                style: TextStyle(
                    color: active ? NC.ink : NC.muted,
                    fontWeight: FontWeight.w700,
                    fontSize: 13)),
          ),
        ]),
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  final _RewardVM reward;
  final bool busy;
  final VoidCallback onTap;

  const _RewardCard({required this.reward, required this.busy, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final r = reward;
    return NovigoCard(
      onTap: busy ? null : onTap,
      semanticLabel: '${r.title}, ${r.cost} points'
          '${r.affordable ? '' : ', pas encore accessible'}',
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
              color: r.accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
          child: busy
              ? const Center(
                  child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: NC.brand)),
                )
              : Icon(r.icon, color: r.accent, size: 24),
        ),
        const Spacer(),
        Text(r.title, style: T.title, maxLines: 2, overflow: TextOverflow.ellipsis),
        const SizedBox(height: Sp.sm),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: Sp.xs + 2),
          decoration: BoxDecoration(
            color: r.affordable ? r.accent.withValues(alpha: 0.16) : NC.surfaceAlt,
            borderRadius: BorderRadius.circular(R.pill),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.stars_rounded, size: 14, color: r.affordable ? r.accent : NC.faint),
            const SizedBox(width: 4),
            Text('${r.cost} pts',
                style: TextStyle(
                    color: r.affordable ? r.accent : NC.faint,
                    fontWeight: FontWeight.w800,
                    fontSize: 12.5)),
          ]),
        ),
      ]),
    );
  }
}
