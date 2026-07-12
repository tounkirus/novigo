import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../application/artisan_providers.dart';

/// Feuille modale de création / édition d'un service.
Future<void> showServiceEditor(
  BuildContext context,
  WidgetRef ref, {
  Map<String, dynamic>? service,
}) async {
  final isEdit = service != null;
  final title = TextEditingController(text: service?['title']?.toString() ?? '');
  final desc =
      TextEditingController(text: service?['description']?.toString() ?? '');
  final price = TextEditingController(
      text: isEdit
          ? amountOf((service['price'] as Map?)?.cast<String, dynamic>()).toString()
          : '');
  final duration = TextEditingController(
      text: (service?['durationMinutes'] ?? '').toString());

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) {
      bool busy = false;
      return StatefulBuilder(
        builder: (ctx, setState) => Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(isEdit ? 'Modifier le service' : 'Nouveau service',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(
                  controller: title,
                  decoration: const InputDecoration(labelText: 'Intitulé')),
              const SizedBox(height: 10),
              TextField(
                  controller: desc,
                  decoration:
                      const InputDecoration(labelText: 'Description (option)')),
              const SizedBox(height: 10),
              TextField(
                  controller: price,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Prix (FCFA)')),
              const SizedBox(height: 10),
              TextField(
                  controller: duration,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Durée (min, option)')),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: busy
                    ? null
                    : () async {
                        setState(() => busy = true);
                        final repo = ref.read(artisanRepositoryProvider);
                        final p = int.tryParse(price.text.trim()) ?? 0;
                        final d = int.tryParse(duration.text.trim());
                        try {
                          if (isEdit) {
                            await repo.updateService(service['id'] as String,
                                title.text.trim(), desc.text.trim(), p, d);
                          } else {
                            await repo.createService(
                                title.text.trim(), desc.text.trim(), p, d);
                          }
                          bumpRefresh(ref);
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (context.mounted) {
                            showInfo(context,
                                isEdit ? 'Service modifié' : 'Service ajouté');
                          }
                        } on ApiException catch (e) {
                          setState(() => busy = false);
                          if (ctx.mounted) showError(ctx, e.message);
                        }
                      },
                child: Text(busy ? '...' : 'Enregistrer'),
              ),
            ],
          ),
        ),
      );
    },
  );
}
