import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/ui.dart';
import '../../../core/theme.dart';
import '../application/services_providers.dart';

/// Onglet Services : parcourir les artisans du Mali et demander un devis.
class ServicesScreen extends ConsumerWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(artisansProvider);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Rechercher un métier (plombier, électricien…)',
                    prefixIcon: Icon(Icons.search),
                    isDense: true,
                  ),
                  onSubmitted: (v) =>
                      ref.read(artisanSearchProvider.notifier).state = v.trim(),
                ),
              ),
              IconButton(
                tooltip: 'Mes demandes',
                icon: const Icon(Icons.assignment_outlined),
                onPressed: () => context.push('/services/requests'),
              ),
            ],
          ),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Erreur : $e')),
            data: (artisans) {
              if (artisans.isEmpty) {
                return const Center(child: Text('Aucun artisan trouvé.'));
              }
              return RefreshIndicator(
                onRefresh: () async => ref.refresh(artisansProvider.future),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: artisans.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final a = artisans[i];
                    return InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => context.push('/services/${a.id}'),
                      child: SectionCard(
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: AppColors.brand.withValues(alpha: 0.12),
                              child: const Icon(Icons.handyman, color: AppColors.brand),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(a.displayName,
                                      style: const TextStyle(fontWeight: FontWeight.w600)),
                                  Text(
                                    [
                                      a.profession,
                                      if (a.serviceArea != null && a.serviceArea!.isNotEmpty)
                                        a.serviceArea,
                                    ].join(' · '),
                                    style: const TextStyle(color: AppColors.muted, fontSize: 12),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${a.serviceCount} service(s)'
                                    '${a.rating > 0 ? '  ·  ★ ${a.rating.toStringAsFixed(1)}' : ''}',
                                    style: const TextStyle(fontSize: 12, color: AppColors.brandDark),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right, color: AppColors.muted),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
