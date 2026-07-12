import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../application/shop_providers.dart';
import 'product_editor.dart';

class StoreScreen extends ConsumerWidget {
  const StoreScreen({super.key, required this.storeId, this.storeName});
  final String storeId;
  final String? storeName;

  Future<void> _guard(
      BuildContext context, WidgetRef ref, Future<void> Function() action,
      String okMsg) async {
    try {
      await action();
      bumpRefresh(ref);
      if (context.mounted) showInfo(context, okMsg);
    } on ApiException catch (e) {
      if (context.mounted) showError(context, e.message);
    }
  }

  Future<void> _editInventory(
      BuildContext context, WidgetRef ref, Map<String, dynamic> p) async {
    final ctrl =
        TextEditingController(text: (p['stockQuantity'] ?? 0).toString());
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Stock — ${p['name']}'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Quantité en stock'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Enregistrer')),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    final qty = int.tryParse(ctrl.text.trim()) ?? 0;
    await _guard(
        context, ref, () => ref
            .read(merchantRepositoryProvider)
            .setInventory(p['id'] as String, qty),
        'Stock mis à jour');
  }

  Future<void> _delete(
      BuildContext context, WidgetRef ref, Map<String, dynamic> p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer le produit ?'),
        content: Text(p['name']?.toString() ?? ''),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          FilledButton(
              style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Supprimer')),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    await _guard(
        context, ref,
        () => ref.read(merchantRepositoryProvider).deleteProduct(p['id'] as String),
        'Produit supprimé');
  }

  Widget _productRow(BuildContext context, WidgetRef ref, Map<String, dynamic> p) {
    final promo = (p['promoPercent'] as num?)?.toInt() ?? 0;
    final stockState = (p['stockState'] ?? '').toString();
    final img = p['imageUrl']?.toString();
    final (stockLabel, stockColor) = switch (stockState) {
      'OUT_OF_STOCK' => ('Rupture', AppColors.error),
      'LIMITED' => ('Stock limité (${p['stockQuantity']})', AppColors.warning),
      _ => ('En stock (${p['stockQuantity']})', AppColors.brand),
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: (img != null && img.isNotEmpty)
                    ? Image.network(img, width: 46, height: 46, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _imgPlaceholder())
                    : _imgPlaceholder(),
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(p['name']?.toString() ?? '—', style: const TextStyle(fontWeight: FontWeight.w600))),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                if (promo > 0) ...[
                  Text(formatMoney((p['finalPrice'] as Map?)?.cast<String, dynamic>()),
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.brand)),
                  Text(formatMoney((p['price'] as Map?)?.cast<String, dynamic>()),
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.muted, decoration: TextDecoration.lineThrough)),
                ] else
                  Text(formatMoney((p['price'] as Map?)?.cast<String, dynamic>()),
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.brand)),
              ]),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              StatusChip(stockLabel, color: stockColor),
              if (promo > 0) ...[
                const SizedBox(width: 6),
                StatusChip('-$promo%', color: AppColors.gold),
              ],
              const Spacer(),
              IconButton(
                tooltip: 'Stock', visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.inventory_2_outlined),
                onPressed: () => _editInventory(context, ref, p),
              ),
              IconButton(
                tooltip: 'Modifier', visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.edit_outlined),
                onPressed: () => showProductEditor(context, ref, storeId: storeId, product: p),
              ),
              IconButton(
                tooltip: 'Dupliquer', visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.copy_all_outlined),
                onPressed: () => _guard(context, ref,
                    () => ref.read(merchantRepositoryProvider).duplicateProduct(p['id'] as String).then((_) {}),
                    'Produit dupliqué'),
              ),
              IconButton(
                tooltip: 'Supprimer', visualDensity: VisualDensity.compact,
                icon: Icon(Icons.delete_outline, color: Colors.red.shade700),
                onPressed: () => _delete(context, ref, p),
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _imgPlaceholder() => Container(
      width: 46, height: 46, color: AppColors.line,
      child: const Icon(Icons.fastfood, size: 20, color: AppColors.muted));

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(productsProvider(storeId));
    final reports = ref.watch(reportsProvider(storeId));
    return Scaffold(
      appBar: AppBar(title: Text(storeName ?? 'Boutique')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showProductEditor(context, ref, storeId: storeId),
        icon: const Icon(Icons.add),
        label: const Text('Produit'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => bumpRefresh(ref),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            reports.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (r) => SectionCard(
                child: Row(
                  children: [
                    const Icon(Icons.insights, color: AppColors.gold),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                          '${r['productCount'] ?? 0} produit(s) au catalogue',
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Catalogue',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            products.when(
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
                        child: Text('Aucun produit — ajoutez-en un',
                            style: TextStyle(color: AppColors.muted))),
                  );
                }
                return Column(
                  children: [for (final p in list) _productRow(context, ref, p)],
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
