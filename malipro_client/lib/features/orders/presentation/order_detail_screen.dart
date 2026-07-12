import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/theme.dart';
import '../application/orders_providers.dart';

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderDetailProvider(orderId));
    final tracking = ref.watch(orderTrackingProvider(orderId));
    return Scaffold(
      appBar: AppBar(title: const Text('Détail commande')),
      body: order.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (o) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(o['reference']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w700)),
                      StatusChip(o['status'].toString()),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Total : ${formatMoney((o['total'] as Map).cast<String, dynamic>())}'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Suivi en temps réel', style: TextStyle(fontWeight: FontWeight.w600)),
                      IconButton(
                        icon: const Icon(Icons.refresh, size: 20),
                        onPressed: () => ref.refresh(orderTrackingProvider(orderId)),
                      ),
                    ],
                  ),
                  tracking.when(
                    loading: () => const Text('...'),
                    error: (_, __) => const Text('Suivi indisponible', style: TextStyle(color: AppColors.muted)),
                    data: (t) => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Statut : ${t['status']}'),
                        Text('ETA : ${t['etaMinutes'] ?? '—'} min'),
                        if (t['driverLocation'] != null)
                          Text('Livreur : ${t['driverLocation']['lat']}, ${t['driverLocation']['lng']}',
                              style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
