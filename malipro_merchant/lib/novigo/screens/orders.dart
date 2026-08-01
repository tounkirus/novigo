import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../state.dart';
import '../widgets.dart';
import 'order_detail.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  String _filter = MStatus.nouvelle;

  static const _tabs = [
    (MStatus.nouvelle, 'Nouvelles'),
    (MStatus.preparation, 'En préparation'),
    (MStatus.prete, 'Prêtes'),
    (MStatus.terminee, 'Terminées'),
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListenableBuilder(
        listenable: merchant,
        builder: (_, __) {
          final list = merchant.byStatus(_filter);
          return Column(children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Align(alignment: Alignment.centerLeft, child: Text('Commandes', style: T.h1)),
            ),
            SizedBox(
              height: 46,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _tabs.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (_, i) {
                  final t = _tabs[i];
                  final count = merchant.byStatus(t.$1).length;
                  return _Tab(
                    label: t.$2,
                    count: count,
                    on: _filter == t.$1,
                    onTap: () => setState(() => _filter = t.$1),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: list.isEmpty
                  ? _empty()
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      itemCount: list.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (_, i) => OrderCard(order: list[i]),
                    ),
            ),
          ]);
        },
      ),
    );
  }

  Widget _empty() => const Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.inbox_rounded, size: 54, color: NC.faint),
          SizedBox(height: 12),
          Text('Aucune commande ici', style: T.muted),
        ]),
      );
}

class _Tab extends StatelessWidget {
  final String label;
  final int count;
  final bool on;
  final VoidCallback onTap;
  const _Tab({required this.label, required this.count, required this.on, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: on ? NC.brand : NC.surface,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(label,
              style: TextStyle(color: on ? Colors.white : NC.muted, fontWeight: FontWeight.w700, fontSize: 14)),
          if (count > 0) ...[
            const SizedBox(width: 7),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: on ? Colors.white.withValues(alpha: 0.25) : NC.surfaceAlt,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text('$count',
                  style: TextStyle(color: on ? Colors.white : NC.muted, fontWeight: FontWeight.w800, fontSize: 12)),
            ),
          ],
        ]),
      ),
    );
  }
}

/// Carte commande réutilisable (liste commandes + aperçu tableau de bord).
class OrderCard extends StatelessWidget {
  final MOrder order;
  const OrderCard({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final action = OrderAction.forStatus(order.status);
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => OrderDetailScreen(order: order))),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: cardDeco(radius: 18),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Avatar(order.customerInitials, size: 44),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(
                      child: Text(order.customerName,
                          style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
                  const SizedBox(width: 8),
                  StatusChip(order.status),
                ]),
                const SizedBox(height: 3),
                Text('${order.id} · ${order.whenLabel}', style: T.muted),
              ]),
            ),
          ]),
          const SizedBox(height: 10),
          Text(order.itemsLabel, style: T.body, maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 10),
          Row(children: [
            if (order.itemCount > 0) ...[
              const Icon(Icons.shopping_basket_rounded, size: 15, color: NC.faint),
              const SizedBox(width: 5),
              Text('${order.itemCount} article${order.itemCount > 1 ? 's' : ''}', style: T.muted),
            ],
            const Spacer(),
            Text(fcfa(order.total), style: T.price),
          ]),
          if (action != null) ...[
            const SizedBox(height: 12),
            BrandButton(
              action.label,
              icon: action.icon,
              height: 46,
              gradient: order.status == MStatus.prete ? NC.brandGradient : null,
              onTap: () {
                if (order.status == MStatus.nouvelle) {
                  merchant.acceptOrder(order.id);
                } else if (order.status == MStatus.preparation) {
                  merchant.markReady(order.id);
                } else if (order.status == MStatus.prete) {
                  merchant.completeOrder(order.id);
                }
              },
            ),
          ],
        ]),
      ),
    );
  }
}
