import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../../chat/application/chat_providers.dart';
import '../../shop/application/shop_providers.dart';

/// Commandes entrantes en temps réel : accepter / refuser / préparer / prête.
class MerchantOrdersScreen extends ConsumerStatefulWidget {
  const MerchantOrdersScreen({super.key});
  @override
  ConsumerState<MerchantOrdersScreen> createState() => _MerchantOrdersScreenState();
}

class _MerchantOrdersScreenState extends ConsumerState<MerchantOrdersScreen> {
  @override
  Widget build(BuildContext context) {
    // Garantit la connexion Socket.IO (push order.new / order.updated).
    ref.watch(realtimeConnectionProvider);

    // Rafraîchit la liste à chaque événement commande + toast pour une nouvelle.
    ref.listen(realtimeOrderEventsProvider, (_, next) {
      next.whenData((evt) {
        bumpRefresh(ref);
        if (evt['event'] == 'new' && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Nouvelle commande ${evt['reference'] ?? ''}'),
            backgroundColor: AppColors.brand,
          ));
        }
      });
    });

    final async = ref.watch(merchantOrdersProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Commandes'),
        actions: [
          _LiveBadge(),
          const SizedBox(width: 8),
        ],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (orders) {
          final active = orders
              .where((o) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].contains(o['status']))
              .toList();
          if (active.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => bumpRefresh(ref),
              child: ListView(children: const [
                SizedBox(height: 120),
                Icon(Icons.inbox_outlined, size: 52, color: AppColors.muted),
                SizedBox(height: 10),
                Center(child: Text('Aucune commande en cours', style: TextStyle(color: AppColors.muted))),
              ]),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => bumpRefresh(ref),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: active.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _OrderCard(order: active[i]),
            ),
          );
        },
      ),
    );
  }
}

class _LiveBadge extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rt = ref.watch(realtimeServiceProvider);
    return StreamBuilder<bool>(
      stream: rt.connectionState,
      builder: (_, snap) {
        final on = snap.data ?? false;
        return Row(children: [
          Icon(Icons.circle, size: 10, color: on ? AppColors.success : AppColors.muted),
          const SizedBox(width: 4),
          Text(on ? 'Live' : '—', style: const TextStyle(fontSize: 12)),
        ]);
      },
    );
  }
}

const _statusLabel = {
  'PENDING': 'Nouvelle', 'CONFIRMED': 'Acceptée', 'PREPARING': 'En préparation',
  'READY': 'Prête', 'ASSIGNED': 'Livreur assigné', 'PICKED_UP': 'Récupérée',
  'IN_TRANSIT': 'En livraison', 'DELIVERED': 'Livrée', 'CANCELLED': 'Refusée',
};

Color _statusColor(String s) => switch (s) {
      'PENDING' => AppColors.warning,
      'CONFIRMED' || 'PREPARING' => AppColors.info,
      'READY' => AppColors.success,
      'CANCELLED' || 'REFUNDED' => AppColors.error,
      _ => AppColors.muted,
    };

class _OrderCard extends ConsumerStatefulWidget {
  const _OrderCard({required this.order});
  final Map<String, dynamic> order;
  @override
  ConsumerState<_OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends ConsumerState<_OrderCard> {
  bool _busy = false;

  Future<void> _act(String action, {String? reason}) async {
    setState(() => _busy = true);
    try {
      await ref.read(merchantRepositoryProvider).orderAction(
            widget.order['id'] as String, action, reason: reason);
      bumpRefresh(ref);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.message), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final status = (o['status'] ?? '').toString();
    final items = (o['items'] as List?) ?? const [];
    final isCash = (o['paymentMethod'] ?? '') == 'CASH';
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(o['reference']?.toString() ?? '—',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(o['customerName']?.toString() ?? 'Client',
                    style: const TextStyle(color: AppColors.muted, fontSize: 12)),
              ]),
            ),
            _Pill(label: _statusLabel[status] ?? status, color: _statusColor(status)),
          ]),
          const Divider(height: 18),
          ...items.map((it) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 1),
                child: Row(children: [
                  Text('${it['quantity']}×  ',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.brand)),
                  Expanded(child: Text(it['name']?.toString() ?? '', style: const TextStyle(fontSize: 13))),
                  Text(formatMoney(it['unitPrice']),
                      style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                ]),
              )),
          const Divider(height: 18),
          Row(children: [
            Icon(isCash ? Icons.payments : Icons.smartphone,
                size: 15, color: isCash ? AppColors.gold : AppColors.muted),
            const SizedBox(width: 6),
            Text(isCash ? 'Espèces à la livraison' : 'Mobile Money',
                style: TextStyle(
                    fontSize: 12,
                    color: isCash ? AppColors.gold : AppColors.muted,
                    fontWeight: isCash ? FontWeight.w700 : FontWeight.w500)),
            const Spacer(),
            Text(formatMoney(o['total']),
                style: const TextStyle(color: AppColors.brandDark, fontWeight: FontWeight.w900, fontSize: 16)),
          ]),
          ..._actions(status),
        ],
      ),
    );
  }

  List<Widget> _actions(String status) {
    if (_busy) {
      return const [
        SizedBox(height: 12),
        Center(child: SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2))),
      ];
    }
    switch (status) {
      case 'PENDING':
        return [
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => _act('refuse', reason: 'Indisponible'),
                style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error, side: const BorderSide(color: AppColors.error)),
                child: const Text('Refuser'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: FilledButton(
                onPressed: () => _act('accept'),
                style: FilledButton.styleFrom(backgroundColor: AppColors.brand),
                child: const Text('Accepter'),
              ),
            ),
          ]),
        ];
      case 'CONFIRMED':
        return [
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => _act('preparing'),
              style: FilledButton.styleFrom(backgroundColor: AppColors.brand),
              child: const Text('Commencer la préparation'),
            ),
          ),
        ];
      case 'PREPARING':
        return [
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => _act('ready'),
              style: FilledButton.styleFrom(backgroundColor: AppColors.success),
              child: const Text('Marquer prête'),
            ),
          ),
        ];
      default:
        return const [];
    }
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.color});
  final String label;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: color.withValues(alpha: 0.4)),
        ),
        child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 11)),
      );
}
