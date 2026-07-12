import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../../chat/application/chat_providers.dart';
import '../application/artisan_providers.dart';

class QuotationsScreen extends ConsumerWidget {
  const QuotationsScreen({super.key});

  Future<void> _contactCustomer(
      BuildContext context, WidgetRef ref, String customerId) async {
    try {
      final conv = await ref
          .read(chatRepositoryProvider)
          .createConversation(customerId);
      if (context.mounted) context.push('/chat/${conv['id']}');
    } on ApiException catch (e) {
      if (context.mounted) showError(context, e.message);
    }
  }

  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final customer = TextEditingController();
    final desc = TextEditingController();
    final amount = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Nouveau devis'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                  controller: customer,
                  decoration:
                      const InputDecoration(labelText: 'ID client')),
              const SizedBox(height: 10),
              TextField(
                  controller: desc,
                  decoration:
                      const InputDecoration(labelText: 'Description')),
              const SizedBox(height: 10),
              TextField(
                  controller: amount,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Montant (FCFA)')),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Envoyer')),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await ref.read(artisanRepositoryProvider).createQuotation(
            customer.text.trim(),
            desc.text.trim(),
            int.tryParse(amount.text.trim()) ?? 0,
          );
      bumpRefresh(ref);
      if (context.mounted) showInfo(context, 'Devis envoyé');
    } on ApiException catch (e) {
      if (context.mounted) showError(context, e.message);
    }
  }

  /// Répondre à une demande client (REQUESTED) en proposant un prix (→ SENT).
  Future<void> _propose(BuildContext context, WidgetRef ref,
      Map<String, dynamic> q) async {
    final amount = TextEditingController(
        text: (amountOf((q['amount'] as Map?)?.cast<String, dynamic>()))
            .toString());
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Proposer un prix'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(q['description']?.toString() ?? '',
                style: const TextStyle(color: AppColors.muted)),
            const SizedBox(height: 10),
            TextField(
              controller: amount,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Votre prix (FCFA)'),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Envoyer le devis')),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    final value = int.tryParse(amount.text.trim());
    if (value == null || value <= 0) {
      showError(context, 'Saisissez un montant valide.');
      return;
    }
    try {
      await ref
          .read(artisanRepositoryProvider)
          .updateQuotationStatus(q['id'] as String, 'SENT', amount: value);
      bumpRefresh(ref);
      if (context.mounted) showInfo(context, 'Devis envoyé au client');
    } on ApiException catch (e) {
      if (context.mounted) showError(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(quotationsProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _create(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Devis'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                const Text('Mes devis',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: () => bumpRefresh(ref)),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => bumpRefresh(ref),
              child: async.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => ListView(children: [
                  const SizedBox(height: 80),
                  Center(child: Text('Erreur : $e')),
                ]),
                data: (list) {
                  if (list.isEmpty) {
                    return ListView(children: const [
                      SizedBox(height: 100),
                      Icon(Icons.request_quote_outlined,
                          size: 48, color: AppColors.muted),
                      SizedBox(height: 12),
                      Center(
                          child: Text('Aucun devis',
                              style: TextStyle(color: AppColors.muted))),
                    ]);
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    itemCount: list.length,
                    itemBuilder: (_, i) {
                      final q = list[i];
                      final status = (q['status'] as String?) ?? '—';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: SectionCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                        q['description']?.toString() ?? '—',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600)),
                                  ),
                                  StatusChip(status,
                                      color: quotationColor(status)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Text(
                                      formatMoney((q['amount'] as Map?)
                                          ?.cast<String, dynamic>()),
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.brand)),
                                  const Spacer(),
                                  if (q['customerId'] != null)
                                    IconButton(
                                      tooltip: 'Contacter le client',
                                      icon: const Icon(
                                          Icons.chat_bubble_outline, size: 20),
                                      onPressed: () => _contactCustomer(
                                          context, ref,
                                          q['customerId'] as String),
                                    ),
                                  if (status == 'REQUESTED')
                                    FilledButton(
                                      onPressed: () =>
                                          _propose(context, ref, q),
                                      style: FilledButton.styleFrom(
                                          minimumSize: const Size(0, 36)),
                                      child: const Text('Proposer un prix'),
                                    ),
                                  if (status == 'SENT')
                                    const Text('En attente du client',
                                        style: TextStyle(
                                            color: AppColors.muted,
                                            fontSize: 12)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
