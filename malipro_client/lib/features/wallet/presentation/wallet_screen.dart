import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/theme.dart';
import '../application/wallet_providers.dart';

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balance = ref.watch(walletBalanceProvider);
    final tx = ref.watch(walletTxProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(walletBalanceProvider);
        ref.invalidate(walletTxProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Solde', style: TextStyle(color: AppColors.muted)),
                const SizedBox(height: 4),
                balance.when(
                  loading: () => const Text('...'),
                  error: (e, _) => Text('Erreur : $e'),
                  data: (w) => Text(formatMoney((w['balance'] as Map).cast<String, dynamic>()),
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () async {
                    await ref.read(walletRepositoryProvider).deposit(5000, 'ORANGE_MONEY');
                    ref.invalidate(walletBalanceProvider);
                    ref.invalidate(walletTxProvider);
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('Déposer 5 000 FCFA'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text('Transactions', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          tx.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text('Erreur : $e'),
            data: (list) => Column(
              children: list
                  .map((t) => SectionCard(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(t['type'].toString()),
                            Text(formatMoney((t['amount'] as Map).cast<String, dynamic>())),
                          ],
                        ),
                      ))
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }
}
