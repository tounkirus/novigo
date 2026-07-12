import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../application/artisan_providers.dart';
import 'service_editor.dart';

class ServicesScreen extends ConsumerWidget {
  const ServicesScreen({super.key});

  Future<void> _delete(
      BuildContext context, WidgetRef ref, Map<String, dynamic> s) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer le service ?'),
        content: Text(s['title']?.toString() ?? ''),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          FilledButton(
              style:
                  FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Supprimer')),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await ref
          .read(artisanRepositoryProvider)
          .deleteService(s['id'] as String);
      bumpRefresh(ref);
      if (context.mounted) showInfo(context, 'Service supprimé');
    } on ApiException catch (e) {
      if (context.mounted) showError(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(artisanProfileProvider);
    final earnings = ref.watch(earningsProvider);
    final services = ref.watch(servicesProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showServiceEditor(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Service'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => bumpRefresh(ref),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                const Text('Mes services',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: () => bumpRefresh(ref)),
              ],
            ),
            const SizedBox(height: 8),
            profile.when(
              loading: () => const SizedBox.shrink(),
              error: (e, _) => SectionCard(
                child: Text('Profil artisan indisponible : $e',
                    style: const TextStyle(color: AppColors.muted)),
              ),
              data: (a) => SectionCard(
                child: Row(
                  children: [
                    const CircleAvatar(
                      radius: 24,
                      backgroundColor: AppColors.brand,
                      child: Icon(Icons.handyman, color: Colors.white),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(a['profession']?.toString() ?? 'Artisan',
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                          Text(
                              [
                                if (a['serviceArea'] != null) a['serviceArea'],
                                '★ ${a['rating'] ?? 0}',
                              ].join(' · '),
                              style: const TextStyle(
                                  color: AppColors.muted, fontSize: 13)),
                        ],
                      ),
                    ),
                    earnings.maybeWhen(
                      data: (e) => Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Revenus',
                              style: TextStyle(
                                  color: AppColors.muted, fontSize: 11)),
                          Text(
                              formatMoney(
                                  (e['total'] as Map?)?.cast<String, dynamic>()),
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.brand)),
                        ],
                      ),
                      orElse: () => const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Catalogue de services',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            services.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => Text('Erreur : $e'),
              data: (list) {
                if (list.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(
                        child: Text('Aucun service — ajoutez-en un',
                            style: TextStyle(color: AppColors.muted))),
                  );
                }
                return Column(
                  children: [
                    for (final s in list)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: SectionCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(s['title']?.toString() ?? '—',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600)),
                                  ),
                                  Text(
                                      formatMoney((s['price'] as Map?)
                                          ?.cast<String, dynamic>()),
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.brand)),
                                ],
                              ),
                              if (s['description'] != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(s['description'].toString(),
                                      style: const TextStyle(
                                          color: AppColors.muted, fontSize: 13)),
                                ),
                              Row(
                                children: [
                                  if (s['durationMinutes'] != null)
                                    StatusChip('${s['durationMinutes']} min',
                                        color: AppColors.muted),
                                  const Spacer(),
                                  IconButton(
                                    tooltip: 'Modifier',
                                    icon: const Icon(Icons.edit_outlined),
                                    onPressed: () => showServiceEditor(
                                        context, ref, service: s),
                                  ),
                                  IconButton(
                                    tooltip: 'Supprimer',
                                    icon: Icon(Icons.delete_outline,
                                        color: Colors.red.shade700),
                                    onPressed: () => _delete(context, ref, s),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }
}
