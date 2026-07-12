import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../application/shop_providers.dart';

class StoresScreen extends ConsumerWidget {
  const StoresScreen({super.key});

  Future<void> _createStore(BuildContext context, WidgetRef ref) async {
    final name = TextEditingController();
    final category = TextEditingController(text: 'RESTAURANT');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Nouvelle boutique'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
                controller: name,
                decoration: const InputDecoration(labelText: 'Nom')),
            const SizedBox(height: 10),
            TextField(
                controller: category,
                decoration: const InputDecoration(labelText: 'Catégorie')),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Créer')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref
          .read(merchantRepositoryProvider)
          .createStore(name.text.trim(), category.text.trim());
      bumpRefresh(ref);
      if (context.mounted) showInfo(context, 'Boutique créée');
    } on ApiException catch (e) {
      if (context.mounted) showError(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(storesProvider);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              const Text('Mes boutiques',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Spacer(),
              IconButton(
                  icon: const Icon(Icons.add_business),
                  onPressed: () => _createStore(context, ref)),
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
                    Icon(Icons.storefront_outlined,
                        size: 48, color: AppColors.muted),
                    SizedBox(height: 12),
                    Center(
                        child: Text('Aucune boutique',
                            style: TextStyle(color: AppColors.muted))),
                  ]);
                }
                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  itemCount: list.length,
                  itemBuilder: (_, i) {
                    final s = list[i];
                    final open = s['isOpen'] == true;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: () => context.push('/stores/${s['id']}',
                            extra: s['name']),
                        child: SectionCard(
                          child: Row(
                            children: [
                              const Icon(Icons.store, color: AppColors.brand),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(s['name']?.toString() ?? '—',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 2),
                                    Text(s['category']?.toString() ?? '',
                                        style: const TextStyle(
                                            color: AppColors.muted,
                                            fontSize: 12)),
                                  ],
                                ),
                              ),
                              StatusChip(open ? 'Ouverte' : 'Fermée',
                                  color: open
                                      ? Colors.green.shade700
                                      : AppColors.muted),
                            ],
                          ),
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
    );
  }
}
