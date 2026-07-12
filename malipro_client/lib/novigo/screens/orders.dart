import 'package:flutter/material.dart';
import '../theme.dart';
import '../data/env.dart';
import '../data/orders_api.dart';
import 'tracking.dart';
import 'order_detail.dart';

/// Écran « Mes commandes ». En mode live, liste les commandes réelles du Gateway
/// (carte « en cours » + historique), avec repli sur le contenu mock si échec.
class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<OrderDto>? _orders; // null => mode mock (repli)
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (NovigoEnv.live) _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final orders = await fetchLiveOrders();
      if (!mounted) return;
      setState(() => _orders = orders); // bascule live même si vide
    } catch (_) {
      // repli silencieux : contenu mock premium
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

  @override
  Widget build(BuildContext context) {
    final live = _orders != null;
    final inProgress = live ? _orders!.where((o) => o.inProgress).toList() : const <OrderDto>[];
    final past = live ? _orders!.where((o) => !o.inProgress).toList() : const <OrderDto>[];

    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: NovigoEnv.live ? _load : () async {},
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Row(children: [
            const Text('Mes commandes', style: T.h1),
            if (_loading) ...[
              const SizedBox(width: 12),
              const SizedBox(
                  width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: NC.brand)),
            ],
          ]),
          const SizedBox(height: 16),

          // Carte « commande en cours »
          if (!live)
            _mockOngoingCard(context)
          else if (inProgress.isNotEmpty)
            _liveOngoingCard(context, inProgress.first)
          else
            _noOngoing(),

          const SizedBox(height: 22),
          const Row(children: [
            _Tab('Toutes', true),
            SizedBox(width: 10),
            _Tab('Livrées', false),
            SizedBox(width: 10),
            _Tab('Annulées', false),
          ]),
          const SizedBox(height: 16),

          // Historique
          if (!live) ...[
            _delivered(context, 'Le Balafon', 'MP-100288', '3 200 FCFA', 'Hier · 13:20', 'Livrée'),
            const SizedBox(height: 12),
            _delivered(context, 'Chez Fatou', 'MP-100281', '5 700 FCFA', 'Lun · 20:05', 'Livrée'),
            const SizedBox(height: 12),
            _delivered(context, 'Pizza Niarela', 'MP-100270', '4 500 FCFA', 'Dim · 21:10', 'Livrée'),
          ] else if (past.isEmpty)
            _emptyHistory()
          else
            for (final o in past) ...[
              _delivered(context, o.typeLabel, o.reference, '${_fmt(o.total)} FCFA', o.whenLabel, o.statusLabel,
                  cancelled: o.cancelled),
              const SizedBox(height: 12),
            ],
        ]),
      ),
    );
  }

  // -------- carte « en cours » live
  Widget _liveOngoingCard(BuildContext context, OrderDto o) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(20)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.local_shipping_outlined, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            const Text('Commande en cours',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
            const Spacer(),
            _Pill(o.statusLabel),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            Container(
              width: 46,
              height: 46,
              decoration:
                  BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
              alignment: Alignment.center,
              child: const Icon(Icons.receipt_long_rounded, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(o.typeLabel,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
              Text('${o.reference} · ${_fmt(o.total)} FCFA',
                  style: const TextStyle(color: Colors.white70, fontSize: 13)),
            ])),
          ]),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
                value: _progressFor(o.status),
                minHeight: 6,
                backgroundColor: const Color(0x33FFFFFF),
                color: Colors.white),
          ),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) =>
                    TrackingScreen(storeName: o.typeLabel, orderId: o.id, initialStatus: o.status))),
            child: Container(
              height: 46,
              width: double.infinity,
              decoration: BoxDecoration(color: NC.brand, borderRadius: BorderRadius.circular(14)),
              alignment: Alignment.center,
              child: const Text('Suivre ma commande  ›',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
            ),
          ),
        ]),
      );

  // -------- carte « en cours » mock (démo offline)
  Widget _mockOngoingCard(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(20)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [
            Icon(Icons.local_shipping_outlined, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Commande en cours', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
            Spacer(),
            _Pill('En livraison'),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            Container(
              width: 46,
              height: 46,
              decoration:
                  BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
              alignment: Alignment.center,
              child: const Text('AF', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(width: 12),
            const Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Aux Trois Fleuves',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
              Text('MP-100297 · 4 300 FCFA', style: TextStyle(color: Colors.white70, fontSize: 13)),
            ])),
            const Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('17 min', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
              Text('Arrivée estimée', style: TextStyle(color: Colors.white70, fontSize: 11)),
            ]),
          ]),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: const LinearProgressIndicator(
                value: 0.68, minHeight: 6, backgroundColor: Color(0x33FFFFFF), color: Colors.white),
          ),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const TrackingScreen(storeName: 'Aux Trois Fleuves', eta: 17))),
            child: Container(
              height: 46,
              width: double.infinity,
              decoration: BoxDecoration(color: NC.brand, borderRadius: BorderRadius.circular(14)),
              alignment: Alignment.center,
              child: const Text('Suivre ma commande  ›',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
            ),
          ),
        ]),
      );

  Widget _noOngoing() => Container(
        padding: const EdgeInsets.all(18),
        decoration: cardDeco(radius: 20),
        child: const Row(children: [
          Icon(Icons.local_shipping_outlined, color: NC.faint, size: 22),
          SizedBox(width: 12),
          Expanded(
            child: Text('Aucune commande en cours',
                style: TextStyle(color: NC.muted, fontWeight: FontWeight.w600, fontSize: 14)),
          ),
        ]),
      );

  Widget _emptyHistory() => const Padding(
        padding: EdgeInsets.only(top: 8),
        child: Text('Aucune commande passée pour le moment.', style: T.muted),
      );

  Widget _delivered(BuildContext context, String name, String ref, String amount, String when, String status,
          {bool cancelled = false}) =>
      GestureDetector(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => OrderDetailScreen(reference: ref, storeName: name, status: status))),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: cardDeco(radius: 16),
          child: Row(children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                  color: cancelled ? NC.surfaceAlt : NC.successSoft, borderRadius: BorderRadius.circular(12)),
              child: Icon(cancelled ? Icons.close_rounded : Icons.check_rounded,
                  color: cancelled ? NC.faint : NC.success),
            ),
            const SizedBox(width: 12),
            Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: T.body),
              Text('$ref · $when', style: T.muted),
            ])),
            Text(amount, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800)),
          ]),
        ),
      );
}

class _Tab extends StatelessWidget {
  final String label;
  final bool on;
  const _Tab(this.label, this.on);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(color: on ? NC.surface : Colors.transparent, borderRadius: BorderRadius.circular(999)),
        child: Text(label, style: TextStyle(color: on ? NC.ink : NC.muted, fontWeight: FontWeight.w700, fontSize: 14)),
      );
}

class _Pill extends StatelessWidget {
  final String text;
  const _Pill(this.text);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
        child: Text(text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
      );
}
