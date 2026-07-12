import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../application/services_providers.dart';
import '../data/services_repository.dart';

class ArtisanDetailScreen extends ConsumerWidget {
  const ArtisanDetailScreen({super.key, required this.artisanId});
  final String artisanId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(artisanDetailProvider(artisanId));
    return Scaffold(
      appBar: AppBar(title: const Text('Artisan')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (detail) {
          final a = detail.artisan;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SectionCard(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: AppColors.brand,
                      foregroundImage: (a.photoUrl != null && a.photoUrl!.isNotEmpty)
                          ? NetworkImage(a.photoUrl!)
                          : null,
                      child: (a.photoUrl == null || a.photoUrl!.isEmpty)
                          ? const Icon(Icons.handyman, color: Colors.white)
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(a.displayName,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 2),
                          Text(
                            [
                              a.profession,
                              if (a.serviceArea != null && a.serviceArea!.isNotEmpty) a.serviceArea,
                            ].join(' · '),
                            style: const TextStyle(color: AppColors.muted),
                          ),
                          if (a.rating > 0) ...[
                            const SizedBox(height: 2),
                            Row(children: [
                              const Icon(Icons.star, size: 15, color: Color(0xFFC9A84C)),
                              const SizedBox(width: 3),
                              Text(a.rating.toStringAsFixed(1),
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            ]),
                          ],
                          if (a.bio != null && a.bio!.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(a.bio!),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text('Services proposés',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (detail.services.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Text('Cet artisan n\'a pas encore listé de service.',
                      style: TextStyle(color: AppColors.muted)),
                )
              else
                ...detail.services.map((s) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SectionCard(
                        child: Row(
                          children: [
                            if (s.imageUrl != null && s.imageUrl!.isNotEmpty) ...[
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.network(
                                  s.imageUrl!,
                                  width: 52, height: 52, fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const _SvcIconFallback(),
                                ),
                              ),
                              const SizedBox(width: 12),
                            ],
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(s.title,
                                      style: const TextStyle(fontWeight: FontWeight.w600)),
                                  if (s.description != null && s.description!.isNotEmpty)
                                    Text(s.description!,
                                        style: const TextStyle(
                                            color: AppColors.muted, fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text(
                                    formatMoney(s.price) +
                                        (s.durationMinutes != null
                                            ? '  ·  ${s.durationMinutes} min'
                                            : ''),
                                    style: const TextStyle(
                                        color: AppColors.brandDark,
                                        fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                            OutlinedButton(
                              onPressed: () =>
                                  _requestDialog(context, ref, a, service: s),
                              child: const Text('Réserver'),
                            ),
                          ],
                        ),
                      ),
                    )),
            ],
          );
        },
      ),
      bottomNavigationBar: async.maybeWhen(
        data: (detail) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton.icon(
              onPressed: () => _requestDialog(context, ref, detail.artisan),
              icon: const Icon(Icons.request_quote_outlined),
              label: const Text('Demander un devis'),
            ),
          ),
        ),
        orElse: () => const SizedBox.shrink(),
      ),
    );
  }

  Future<void> _requestDialog(BuildContext context, WidgetRef ref, Artisan a,
      {ArtisanService? service}) async {
    final desc = TextEditingController(
        text: service != null ? 'Réservation : ${service.title}' : '');
    final budget = TextEditingController(
        text: service != null ? amountOf(service.price).toString() : '');
    bool busy = false;

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text(service != null ? 'Réserver « ${service.title} »' : 'Demander un devis'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: desc,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Décrivez votre besoin',
                  hintText: 'Ex. Fuite sous l\'évier à réparer',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: budget,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Budget indicatif (FCFA, optionnel)',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: busy ? null : () => Navigator.pop(ctx),
              child: const Text('Annuler'),
            ),
            FilledButton(
              onPressed: busy
                  ? null
                  : () async {
                      if (desc.text.trim().isEmpty) {
                        showError(ctx, 'Décrivez votre besoin.');
                        return;
                      }
                      setState(() => busy = true);
                      try {
                        await ref.read(servicesRepositoryProvider).requestQuotation(
                              a.id,
                              desc.text.trim(),
                              int.tryParse(budget.text.trim()),
                            );
                        ref.read(quotationsTickProvider.notifier).state++;
                        if (ctx.mounted) Navigator.pop(ctx);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Demande envoyée à l\'artisan.')),
                          );
                        }
                      } on ApiException catch (e) {
                        setState(() => busy = false);
                        if (ctx.mounted) showError(ctx, e.message);
                      }
                    },
              child: Text(busy ? '...' : 'Envoyer'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Vignette de repli quand la photo d'un service ne charge pas.
class _SvcIconFallback extends StatelessWidget {
  const _SvcIconFallback();
  @override
  Widget build(BuildContext context) => Container(
        width: 52,
        height: 52,
        color: AppColors.line,
        child: const Icon(Icons.handyman, color: AppColors.muted),
      );
}
