import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/theme.dart';
import '../application/orders_providers.dart';

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myOrdersProvider);
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Erreur : $e')),
      data: (orders) => orders.isEmpty
          ? const Center(child: Text('Aucune commande'))
          : RefreshIndicator(
              onRefresh: () async => ref.refresh(myOrdersProvider.future),
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: orders.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final o = orders[i];
                  return InkWell(
                    onTap: () => context.push('/orders/${o['id']}'),
                    child: SectionCard(
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(o['reference']?.toString() ?? o['id'].toString(),
                                    style: const TextStyle(fontWeight: FontWeight.w600)),
                                Text(formatMoney((o['total'] as Map).cast<String, dynamic>()),
                                    style: const TextStyle(color: AppColors.muted)),
                              ],
                            ),
                          ),
                          StatusChip(o['status'].toString()),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
