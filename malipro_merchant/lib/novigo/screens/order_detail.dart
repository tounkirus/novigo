import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../state.dart';
import '../widgets.dart';

class OrderDetailScreen extends StatelessWidget {
  final MOrder order;
  const OrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Commande', style: T.title), leading: const BackButton(color: NC.ink)),
      body: ListenableBuilder(
        listenable: merchant,
        builder: (_, __) {
          final action = OrderAction.forStatus(order.status);
          return Column(children: [
            Expanded(
              child: ListView(padding: const EdgeInsets.all(16), children: [
                // En-tête client
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: cardDeco(radius: 20),
                  child: Row(children: [
                    Avatar(order.customerInitials, size: 52),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(order.customerName, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 3),
                        Text('${order.id} · ${order.whenLabel}', style: T.muted),
                      ]),
                    ),
                    StatusChip(order.status),
                  ]),
                ),
                const SizedBox(height: 16),
                // Timeline de statut
                const Text('Suivi', style: T.h2),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: cardDeco(radius: 18),
                  child: Column(children: [
                    _step('Reçue', 0, order.status),
                    _step('Acceptée', 1, order.status),
                    _step('Prête', 2, order.status),
                    _step('Remise au livreur', 3, order.status, last: true),
                  ]),
                ),
                const SizedBox(height: 16),
                // Détail des lignes
                const Text('Articles', style: T.h2),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: cardDeco(radius: 18),
                  child: Column(
                    children: [
                      for (final line in order.items)
                        ListTile(
                          leading: const Icon(Icons.circle, size: 8, color: NC.brand),
                          minLeadingWidth: 0,
                          title: Text(line, style: T.body),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Récap total
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: cardDeco(radius: 18),
                  child: Column(children: [
                    _recap('Articles', '${order.itemCount}'),
                    const SizedBox(height: 8),
                    _recap('Sous-total', fcfa(order.total)),
                    const Divider(color: NC.line, height: 24),
                    Row(children: [
                      const Text('Total', style: T.title),
                      const Spacer(),
                      Text(fcfa(order.total),
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: NC.ink)),
                    ]),
                  ]),
                ),
                const SizedBox(height: 24),
              ]),
            ),
            if (action != null)
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: BrandButton(
                    action.label,
                    icon: action.icon,
                    height: 56,
                    onTap: () {
                      if (order.status == MStatus.nouvelle) {
                        merchant.acceptOrder(order.id);
                      } else if (order.status == MStatus.preparation) {
                        merchant.markReady(order.id);
                      } else if (order.status == MStatus.prete) {
                        merchant.completeOrder(order.id);
                        Navigator.of(context).maybePop();
                      }
                    },
                  ),
                ),
              ),
          ]);
        },
      ),
    );
  }

  Widget _recap(String label, String value) => Row(children: [
        Text(label, style: T.muted),
        const Spacer(),
        Text(value, style: T.body),
      ]);

  /// Étape de timeline. index de l'étape vs progression du statut.
  Widget _step(String label, int idx, String status, {bool last = false}) {
    const order = [MStatus.nouvelle, MStatus.preparation, MStatus.prete, MStatus.terminee];
    final current = order.indexOf(status);
    final done = idx <= current;
    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Column(children: [
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: done ? NC.brand : NC.surfaceAlt,
              shape: BoxShape.circle,
            ),
            child: Icon(done ? Icons.check_rounded : Icons.circle_outlined,
                size: 16, color: done ? Colors.white : NC.faint),
          ),
          if (!last)
            Expanded(
              child: Container(width: 2, color: done ? NC.brand : NC.line),
            ),
        ]),
        const SizedBox(width: 14),
        Padding(
          padding: EdgeInsets.only(top: 3, bottom: last ? 0 : 18),
          child: Text(label,
              style: TextStyle(
                  color: done ? NC.ink : NC.faint, fontWeight: done ? FontWeight.w700 : FontWeight.w500, fontSize: 15)),
        ),
      ]),
    );
  }
}
