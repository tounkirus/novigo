import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';

import '../data/env.dart';
import '../data/orders_api.dart';
import '../ui/ui.dart';
import 'order_detail.dart';
import 'tracking.dart';

/// « Mes commandes » — deux sections : ce qui arrive, et ce qui est passé.
///
/// En mode live, liste les commandes réelles du Gateway ; en mode démo, un jeu
/// cohérent hors ligne. Les deux passent par la même mise en page, donc aucun
/// écart de rendu entre la démo et la production.
class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<OrderDto>? _orders; // null => mode mock (repli)
  bool _loading = false;
  bool _failed = false;
  int _filter = 0;

  static const _filters = ['Toutes', 'Livrées', 'Annulées'];

  /// Historique de démonstration, utilisé uniquement hors mode live.
  static const _demoHistory = [
    ['Le Balafon', 'MP-100288', 3200, 'Hier · 13:20'],
    ['Chez Fatou', 'MP-100281', 5700, 'Lun · 20:05'],
    ['Pizza Niarela', 'MP-100270', 4500, 'Dim · 21:10'],
  ];

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
      final orders = await fetchLiveOrders();
      if (!mounted) return;
      setState(() => _orders = orders); // bascule live même si vide
    } catch (_) {
      if (!mounted) return;
      // Repli sur le contenu de démonstration, mais l'utilisateur est prévenu
      // que la liste affichée n'est pas la sienne.
      setState(() => _failed = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _fmt(int n) =>
      n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]} ');

  double _progressFor(String status) {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 0.25;
      case 'PREPARING':
      case 'READY':
        return 0.5;
      case 'ASSIGNED':
        return 0.7;
      case 'IN_TRANSIT':
        return 0.9;
      default:
        return 0.4;
    }
  }

  List<OrderDto> _applyFilter(List<OrderDto> past) {
    switch (_filter) {
      case 1:
        return past.where((o) => o.delivered).toList();
      case 2:
        return past.where((o) => o.cancelled).toList();
      default:
        return past;
    }
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final live = _orders != null;
    final inProgress = live ? _orders!.where((o) => o.inProgress).toList() : const <OrderDto>[];
    final past = live ? _applyFilter(_orders!.where((o) => !o.inProgress).toList()) : const <OrderDto>[];
    final firstLoad = _loading && _orders == null && !_failed;

    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: NovigoEnv.live ? _load : () async {},
        color: NC.brand,
        backgroundColor: NC.surface,
        child: NovigoContentWidth(
          child: ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, 120),
            children: [
              Row(children: [
                const Text('Mes commandes', style: T.h1),
                if (_loading) ...[
                  const SizedBox(width: Sp.md),
                  const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: NC.brand)),
                ],
              ]),
              const SizedBox(height: Sp.lg),
              if (_failed) ...[
                NovigoOfflineBanner(onRetry: _load),
              ],

              // ───── Section 1 · En cours ─────
              if (firstLoad)
                const NovigoSkeleton(height: 190, radius: R.xl)
              else if (!live)
                _DemoOngoingCard(progress: 0.68)
              else if (inProgress.isNotEmpty)
                _OngoingCard(
                  title: inProgress.first.typeLabel,
                  subtitle: '${inProgress.first.reference} · ${_fmt(inProgress.first.total)} FCFA',
                  status: inProgress.first.statusLabel,
                  progress: _progressFor(inProgress.first.status),
                  onTrack: () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => TrackingScreen(
                      storeName: inProgress.first.typeLabel,
                      orderId: inProgress.first.id,
                      initialStatus: inProgress.first.status,
                    ),
                  )),
                )
              else
                const _NoOngoing(),

              // ───── Section 2 · Historique ─────
              const SizedBox(height: Sp.section),
              const NovigoSectionHeader(overline: 'Historique', title: 'Commandes passées'),
              const SizedBox(height: Sp.md),
              NovigoChipRail(
                labels: _filters,
                selectedIndex: _filter,
                onSelected: (i) => setState(() => _filter = i),
                padding: EdgeInsets.zero,
              ),
              const SizedBox(height: Sp.md),
              if (firstLoad)
                for (var i = 0; i < 3; i++)
                  const Padding(
                    padding: EdgeInsets.only(bottom: Sp.md),
                    child: NovigoSkeleton(height: 72, radius: R.lg),
                  )
              else if (!live)
                for (final o in _demoHistory)
                  Padding(
                    padding: const EdgeInsets.only(bottom: Sp.md),
                    child: _HistoryRow(
                      name: o[0] as String,
                      reference: o[1] as String,
                      amount: '${_fmt(o[2] as int)} FCFA',
                      when: o[3] as String,
                      status: 'Livrée',
                    ),
                  )
              else if (past.isEmpty)
                NovigoEmptyState.empty(
                  icon: Icons.receipt_long_outlined,
                  title: _filter == 0 ? 'Aucune commande passée' : 'Aucune commande ici',
                  message: _filter == 0
                      ? 'Vos commandes terminées apparaîtront ici.'
                      : 'Essayez le filtre « Toutes ».',
                  actionLabel: _filter == 0 ? null : 'Voir toutes',
                  onAction: _filter == 0 ? null : () => setState(() => _filter = 0),
                )
              else
                for (var i = 0; i < past.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: Sp.md),
                    child: FadeSlideIn(
                      index: i,
                      child: _HistoryRow(
                        name: past[i].typeLabel,
                        reference: past[i].reference,
                        amount: '${_fmt(past[i].total)} FCFA',
                        when: past[i].whenLabel,
                        status: past[i].statusLabel,
                        cancelled: past[i].cancelled,
                        orderId: past[i].id,
                      ),
                    ),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Carte « commande en cours » — le seul bloc mis en avant de l'écran.
class _OngoingCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String status;
  final double progress;
  final VoidCallback onTrack;
  final Widget? trailing;

  const _OngoingCard({
    required this.title,
    required this.subtitle,
    required this.status,
    required this.progress,
    required this.onTrack,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      radius: R.xl,
      gradient: NC.premiumGradient,
      elevated: true,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.local_shipping_outlined, color: Colors.white, size: 18),
          const SizedBox(width: Sp.sm),
          const Text('Commande en cours',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
          const Spacer(),
          _StatusPill(status),
        ]),
        const SizedBox(height: Sp.md + 2),
        Row(children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.receipt_long_rounded, color: Colors.white),
          ),
          const SizedBox(width: Sp.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
              Text(subtitle,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
            ]),
          ),
          if (trailing != null) trailing!,
        ]),
        const SizedBox(height: Sp.md + 2),
        ClipRRect(
          borderRadius: BorderRadius.circular(R.pill),
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: progress),
            duration: M.page,
            curve: M.ease,
            builder: (_, v, __) => LinearProgressIndicator(
              value: v,
              minHeight: 6,
              backgroundColor: const Color(0x33FFFFFF),
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: Sp.md + 2),
        NovigoButton(
          label: 'Suivre ma commande',
          size: NovigoButtonSize.medium,
          icon: Icons.navigation_rounded,
          onPressed: onTrack,
        ),
      ]),
    );
  }
}

/// Variante de démonstration (mode hors ligne) — même gabarit exactement.
class _DemoOngoingCard extends StatelessWidget {
  final double progress;
  const _DemoOngoingCard({required this.progress});

  @override
  Widget build(BuildContext context) => _OngoingCard(
        title: 'Aux Trois Fleuves',
        subtitle: 'MP-100297 · 4 300 FCFA',
        status: 'En livraison',
        progress: progress,
        trailing: const Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('17 min',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
          Text('Arrivée estimée', style: TextStyle(color: Colors.white70, fontSize: 11)),
        ]),
        onTrack: () => Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => const TrackingScreen(storeName: 'Aux Trois Fleuves', eta: 17))),
      );
}

class _NoOngoing extends StatelessWidget {
  const _NoOngoing();

  @override
  Widget build(BuildContext context) => const NovigoCard(
        padding: EdgeInsets.all(Sp.lg + 2),
        radius: 20,
        child: Row(children: [
          Icon(Icons.local_shipping_outlined, color: NC.faint, size: 22),
          SizedBox(width: Sp.md),
          Expanded(
            child: Text('Aucune commande en cours',
                style: TextStyle(color: NC.muted, fontWeight: FontWeight.w600, fontSize: 14)),
          ),
        ]),
      );
}

class _HistoryRow extends StatelessWidget {
  final String name, reference, amount, when, status;
  final bool cancelled;
  final String? orderId;

  const _HistoryRow({
    required this.name,
    required this.reference,
    required this.amount,
    required this.when,
    required this.status,
    this.cancelled = false,
    this.orderId,
  });

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      padding: const EdgeInsets.all(Sp.md + 2),
      semanticLabel: '$name, $reference, $when, $amount, $status',
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => OrderDetailScreen(
            reference: reference, storeName: name, status: status, orderId: orderId),
      )),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: cancelled ? NC.surfaceAlt : NC.successSoft,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(cancelled ? Icons.close_rounded : Icons.check_rounded,
              color: cancelled ? NC.faint : NC.success),
        ),
        const SizedBox(width: Sp.md),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text('$reference · $when',
                style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
        const SizedBox(width: Sp.sm),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(amount,
              style: const TextStyle(
                  color: NC.ink,
                  fontWeight: FontWeight.w800,
                  fontFeatures: [FontFeature.tabularFigures()])),
          const SizedBox(height: 2),
          Text(status,
              style: TextStyle(
                  color: cancelled ? NC.faint : NC.success,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
        ]),
      ]),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String text;
  const _StatusPill(this.text);

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: Sp.sm + 2, vertical: Sp.xs),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.18),
          borderRadius: BorderRadius.circular(R.pill),
        ),
        child: Text(text,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
      );
}
