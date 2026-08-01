import 'package:flutter/material.dart';
import '../theme.dart';
import '../data/env.dart';
import '../data/loyalty_api.dart';

/// Récompense prête à afficher (mock ou live, même rendu).
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

/// Écran « Fidélité NOVIGO » — points, palier, récompenses & historique.
/// En mode live, récupère le solde/l'historique/les récompenses réels (repli mock si échec).
class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();

}

// Défauts mock (démo offline).
const int _mockPoints = 1240;
const int _mockNextTier = 2000;
const List<_RewardVM> _mockRewards = [
  _RewardVM('free_delivery', 'Livraison offerte', 200, true, Icons.pedal_bike_rounded, NC.success),
  _RewardVM('discount_1000', '-1 000 FCFA', 500, true, Icons.savings_rounded, NC.brand),
  _RewardVM('free_drink', 'Boisson offerte', 350, true, Icons.local_cafe_rounded, NC.gold),
  _RewardVM('voucher_5000', 'Bon de 5 000 FCFA', 2000, false, Icons.card_giftcard_rounded, NC.violet),
];
const List<_HistVM> _mockHistory = [
  _HistVM('Commande Aux Trois Fleuves', 'Aujourd\'hui · 12:40', 43),
  _HistVM('Commande Pharmacie du Point G', 'Hier · 18:22', 65),
  _HistVM('Échange · Livraison offerte', 'Lun · 11:05', -200),
  _HistVM('Bonus parrainage', 'Sam · 09:30', 250),
];

class _LoyaltyScreenState extends State<LoyaltyScreen> {
  int _points = _mockPoints;
  int _nextTier = _mockNextTier;
  int _toNext = _mockNextTier - _mockPoints;
  String _tier = 'SILVER';
  String _nextTierName = 'GOLD';
  List<_RewardVM> _rewards = _mockRewards;
  List<_HistVM> _history = _mockHistory;
  bool _live = false;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (NovigoEnv.live) _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
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
        if (history.isNotEmpty) {
          _history = history.map((e) => _HistVM(e.label, e.when, e.delta)).toList();
        }
      });
    } catch (_) {
      // repli silencieux : contenu mock premium
    } finally {
      if (mounted) setState(() => _loading = false);
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
    try {
      await loyaltyApi.redeem(r.id);
      if (!mounted) return;
      _toast('« ${r.title} » échangé contre ${r.cost} pts');
      await _load();
    } catch (_) {
      if (mounted) _toast('Échange impossible, réessayez');
    }
  }

  void _toast(String msg) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
      );

  String _fmt(int n) =>
      n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]} ');

  @override
  Widget build(BuildContext context) {
    final progress = (_nextTier <= 0 ? 1.0 : _points / _nextTier).clamp(0.0, 1.0);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fidélité', style: T.title),
        leading: const BackButton(color: NC.ink),
        actions: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 18),
              child: SizedBox(
                  width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: NC.brand)),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _live ? _load : () async {},
        child: ListView(padding: const EdgeInsets.all(16), children: [
          // Carte fidélité gradient
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
            gradient: NC.premiumGradient,
            borderRadius: BorderRadius.circular(R.xl),
            border: Border.all(color: NC.hairline),
            boxShadow: [
              BoxShadow(color: NC.brand.withValues(alpha: 0.20), blurRadius: 28, offset: const Offset(0, 14)),
            ],
          ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Text('Mes points', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: NC.gold.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(R.pill)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.workspace_premium_rounded, color: NC.gold, size: 15),
                    const SizedBox(width: 5),
                    Text(tierLabel(_tier),
                        style: const TextStyle(color: NC.gold, fontWeight: FontWeight.w800, fontSize: 12.5)),
                  ]),
                ),
              ]),
              const SizedBox(height: 8),
              Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
                Text(_fmt(_points),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 38)),
                const SizedBox(width: 6),
                const Padding(
                  padding: EdgeInsets.only(bottom: 6),
                  child: Text('pts', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700, fontSize: 16)),
                ),
              ]),
              const SizedBox(height: 16),
              // Barre de progression vers le palier suivant
              ClipRRect(
                borderRadius: BorderRadius.circular(R.pill),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 9,
                  backgroundColor: Colors.white.withValues(alpha: 0.18),
                  valueColor: const AlwaysStoppedAnimation(NC.gold),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                  _toNext <= 0
                      ? 'Palier maximum atteint · merci de votre fidélité'
                      : 'Encore ${_fmt(_toNext)} pts pour atteindre le palier ${tierLabel(_nextTierName)}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12.5, fontWeight: FontWeight.w600)),
            ]),
          ),
          const SizedBox(height: 20),
          // Paliers
          Row(children: [
            _TierChip(
                label: 'Bronze',
                icon: Icons.military_tech_rounded,
                color: const Color(0xFFCD7F32),
                active: _tier == 'BRONZE'),
            const SizedBox(width: 10),
            _TierChip(
                label: 'Argent',
                icon: Icons.workspace_premium_rounded,
                color: const Color(0xFFC0C0C0),
                active: _tier == 'SILVER'),
            const SizedBox(width: 10),
            _TierChip(
                label: 'Or',
                icon: Icons.emoji_events_rounded,
                color: NC.gold,
                active: _tier == 'GOLD'),
          ]),
          const SizedBox(height: 24),
          const Text('Échanger mes points', style: T.h2),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.98,
            children: [
              for (final r in _rewards)
                _RewardCard(
                    icon: r.icon,
                    title: r.title,
                    cost: r.cost,
                    affordable: r.affordable,
                    accent: r.accent,
                    onTap: () => _redeem(r)),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Historique des points', style: T.h2),
          const SizedBox(height: 12),
          for (final h in _history) _historyRow(h),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  Widget _historyRow(_HistVM h) {
    final gain = h.pts > 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: cardDeco(radius: R.md),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
              color: (gain ? NC.success : NC.brand).withValues(alpha: 0.14), borderRadius: BorderRadius.circular(12)),
          child: Icon(gain ? Icons.add_rounded : Icons.redeem_rounded, color: gain ? NC.success : NC.brand, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(h.label, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            Text(h.when, style: T.muted),
          ]),
        ),
        Text('${gain ? '+' : ''}${h.pts} pts',
            style: TextStyle(color: gain ? NC.success : NC.ink, fontWeight: FontWeight.w800, fontSize: 13.5)),
      ]),
    );
  }
}

class _TierChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool active;
  const _TierChip({required this.label, required this.icon, required this.color, required this.active});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: cardDeco(
          radius: 16,
          border: active ? Border.all(color: color, width: 1.5) : null,
        ),
        child: Column(children: [
          Icon(icon, color: active ? color : NC.faint, size: 24),
          const SizedBox(height: 6),
          Text(label,
              style: TextStyle(color: active ? NC.ink : NC.muted, fontWeight: FontWeight.w700, fontSize: 13)),
        ]),
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final int cost;
  final bool affordable;
  final Color accent;
  final VoidCallback onTap;
  const _RewardCard({
    required this.icon,
    required this.title,
    required this.cost,
    required this.affordable,
    required this.accent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: cardDeco(radius: R.lg),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(color: accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
            child: Icon(icon, color: accent, size: 24),
          ),
          const Spacer(),
          Text(title, style: T.title, maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: affordable ? accent.withValues(alpha: 0.16) : NC.surfaceAlt,
              borderRadius: BorderRadius.circular(R.pill),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.stars_rounded, size: 14, color: affordable ? accent : NC.faint),
              const SizedBox(width: 4),
              Text('$cost pts',
                  style: TextStyle(color: affordable ? accent : NC.faint, fontWeight: FontWeight.w800, fontSize: 12.5)),
            ]),
          ),
        ]),
      ),
    );
  }
}
