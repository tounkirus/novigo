import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/theme.dart';
import '../application/cart_controller.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lines = ref.watch(cartControllerProvider);
    final total = ref.watch(cartTotalProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Panier')),
      body: lines.isEmpty
          ? const Center(child: Text('Votre panier est vide'))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: lines.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final l = lines[i];
                return SectionCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(l.product.name),
                            if (l.optionsLabel != null)
                              Text(l.optionsLabel!,
                                  style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => ref.read(cartControllerProvider.notifier).decrementKey(l.key),
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text('${l.quantity}'),
                      IconButton(
                        onPressed: () => ref.read(cartControllerProvider.notifier).incrementKey(l.key),
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                      SizedBox(
                        width: 90,
                        child: Text(formatMoney({'amount': l.lineTotal, 'currency': 'XOF'}),
                            textAlign: TextAlign.right),
                      ),
                    ],
                  ),
                );
              },
            ),
      bottomNavigationBar: lines.isEmpty
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total', style: TextStyle(color: AppColors.muted)),
                          Text(formatMoney({'amount': total, 'currency': 'XOF'}),
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    FilledButton(
                      onPressed: () => context.push('/checkout'),
                      style: FilledButton.styleFrom(minimumSize: const Size(160, 48)),
                      child: const Text('Commander'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
