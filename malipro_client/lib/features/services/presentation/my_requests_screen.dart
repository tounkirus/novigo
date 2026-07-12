import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../application/services_providers.dart';

/// Liste des demandes de devis envoyées par le client, avec leur statut.
class MyRequestsScreen extends ConsumerWidget {
  const MyRequestsScreen({super.key});

  Future<void> _respond(
      BuildContext context, WidgetRef ref, String id, String status) async {
    try {
      await ref.read(servicesRepositoryProvider).respondQuotation(id, status);
      ref.read(quotationsTickProvider.notifier).state++;
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(status == 'ACCEPTED'
                ? 'Devis accepté.'
                : 'Devis refusé.')));
      }
    } on ApiException catch (e) {
      if (context.mounted) showError(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myQuotationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Mes demandes')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (quotations) {
          if (quotations.isEmpty) {
            return const Center(
                child: Text('Aucune demande pour le moment.',
                    style: TextStyle(color: AppColors.muted)));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myQuotationsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: quotations.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final q = quotations[i];
                return SectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              q.artisanName ?? q.artisanProfession ?? 'Artisan',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ),
                          StatusChip(_statusLabel(q.status), color: _statusColor(q.status)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(q.description),
                      const SizedBox(height: 4),
                      Text(formatMoney(q.amount),
                          style: const TextStyle(
                              color: AppColors.brandDark, fontWeight: FontWeight.w600)),
                      if (q.status.toUpperCase() == 'SENT') ...[
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: () =>
                                  _respond(context, ref, q.id, 'REJECTED'),
                              child: Text('Refuser',
                                  style: TextStyle(color: Colors.red.shade700)),
                            ),
                            const SizedBox(width: 8),
                            FilledButton(
                              onPressed: () =>
                                  _respond(context, ref, q.id, 'ACCEPTED'),
                              child: const Text('Accepter le devis'),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  String _statusLabel(String s) {
    switch (s.toUpperCase()) {
      case 'REQUESTED':
        return 'Envoyée';
      case 'SENT':
        return 'Devis reçu';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      case 'DRAFT':
        return 'Brouillon';
      default:
        return s;
    }
  }

  Color _statusColor(String s) {
    switch (s.toUpperCase()) {
      case 'ACCEPTED':
        return Colors.green;
      case 'REJECTED':
        return Colors.red;
      case 'SENT':
        return AppColors.gold;
      default:
        return AppColors.brand;
    }
  }
}
