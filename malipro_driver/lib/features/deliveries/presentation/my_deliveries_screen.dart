import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../application/deliveries_providers.dart';
import 'delivery_card.dart';

class MyDeliveriesScreen extends ConsumerWidget {
  const MyDeliveriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myDeliveriesProvider);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              const Text('Mes courses',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () => bumpRefresh(ref),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => bumpRefresh(ref),
            child: async.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => ListView(children: [
                const SizedBox(height: 80),
                Center(child: Text('Erreur : $e')),
              ]),
              data: (list) {
                if (list.isEmpty) {
                  return ListView(children: const [
                    SizedBox(height: 100),
                    Icon(Icons.local_shipping_outlined,
                        size: 48, color: AppColors.muted),
                    SizedBox(height: 12),
                    Center(
                        child: Text('Aucune course en cours',
                            style: TextStyle(color: AppColors.muted))),
                  ]);
                }
                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  itemCount: list.length,
                  itemBuilder: (_, i) => DeliveryCard(list[i]),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
