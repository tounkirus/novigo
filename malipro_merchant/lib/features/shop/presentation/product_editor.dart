import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../application/shop_providers.dart';

/// Feuille modale de création / édition d'un produit :
/// nom, description, prix, promo %, rubrique de menu, photos (URLs), stock.
Future<void> showProductEditor(
  BuildContext context,
  WidgetRef ref, {
  required String storeId,
  Map<String, dynamic>? product,
}) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => _ProductEditorSheet(storeId: storeId, product: product),
  );
}

class _ProductEditorSheet extends ConsumerStatefulWidget {
  const _ProductEditorSheet({required this.storeId, this.product});
  final String storeId;
  final Map<String, dynamic>? product;
  @override
  ConsumerState<_ProductEditorSheet> createState() => _ProductEditorSheetState();
}

class _ProductEditorSheetState extends ConsumerState<_ProductEditorSheet> {
  late final bool isEdit = widget.product != null;
  late final _name = TextEditingController(text: widget.product?['name']?.toString() ?? '');
  late final _desc = TextEditingController(text: widget.product?['description']?.toString() ?? '');
  late final _price = TextEditingController(
      text: isEdit ? amountOf((widget.product!['price'] as Map?)?.cast<String, dynamic>()).toString() : '');
  late final _stock = TextEditingController(text: (widget.product?['stockQuantity'] ?? 0).toString());
  late final _image = TextEditingController(text: widget.product?['imageUrl']?.toString() ?? '');
  late int _promo = (widget.product?['promoPercent'] as num?)?.toInt() ?? 0;
  late String? _categoryId = widget.product?['menuCategoryId']?.toString();
  late final List<String> _gallery =
      ((widget.product?['images'] as List?) ?? const []).map((e) => e.toString()).toList();
  late final List<Map<String, dynamic>> _groups =
      ((widget.product?['optionGroups'] as List?) ?? const []).cast<Map<String, dynamic>>().toList();
  bool _busy = false;

  String? get _productId => widget.product?['id']?.toString();

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider(widget.storeId));
    final price = int.tryParse(_price.text.trim()) ?? 0;
    final finalPrice = _promo > 0 ? (price * (100 - _promo) / 100).round() : price;

    return Padding(
      padding: EdgeInsets.only(
          left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(isEdit ? 'Modifier le produit' : 'Nouveau produit',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Nom')),
            const SizedBox(height: 10),
            TextField(controller: _desc, decoration: const InputDecoration(labelText: 'Description (option)')),
            const SizedBox(height: 10),
            TextField(
              controller: _price,
              keyboardType: TextInputType.number,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(labelText: 'Prix (FCFA)'),
            ),
            const SizedBox(height: 14),

            // Promotion
            Row(children: [
              const Icon(Icons.local_offer_outlined, size: 18, color: AppColors.gold),
              const SizedBox(width: 6),
              Text('Promotion : ${_promo == 0 ? "aucune" : "-$_promo %"}',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              const Spacer(),
              if (_promo > 0 && price > 0)
                Text('$finalPrice F',
                    style: const TextStyle(color: AppColors.brandDark, fontWeight: FontWeight.w800)),
            ]),
            Slider(
              value: _promo.toDouble(), min: 0, max: 90, divisions: 18,
              label: '$_promo%',
              onChanged: (v) => setState(() => _promo = v.round()),
            ),

            // Rubrique de menu
            cats.when(
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const SizedBox.shrink(),
              data: (list) => Row(children: [
                Expanded(
                  child: DropdownButtonFormField<String?>(
                    initialValue: list.any((c) => c['id'] == _categoryId) ? _categoryId : null,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Rubrique de menu'),
                    items: [
                      const DropdownMenuItem<String?>(value: null, child: Text('— Aucune —')),
                      ...list.map((c) => DropdownMenuItem<String?>(
                          value: c['id'] as String, child: Text(c['name']?.toString() ?? ''))),
                    ],
                    onChanged: (v) => setState(() => _categoryId = v),
                  ),
                ),
                IconButton(
                  tooltip: 'Nouvelle rubrique',
                  icon: const Icon(Icons.add_circle_outline, color: AppColors.brand),
                  onPressed: _addCategory,
                ),
              ]),
            ),
            const SizedBox(height: 12),

            // Photos
            TextField(controller: _image, decoration: const InputDecoration(labelText: 'Photo principale (URL)')),
            const SizedBox(height: 8),
            Row(children: [
              const Text('Galerie', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(width: 8),
              Text('${_gallery.length} photo(s)', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
              const Spacer(),
              TextButton.icon(
                icon: const Icon(Icons.add_photo_alternate_outlined, size: 18),
                label: const Text('Ajouter'),
                onPressed: _addGalleryImage,
              ),
            ]),
            if (_gallery.isNotEmpty)
              SizedBox(
                height: 62,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _gallery.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => Stack(children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(_gallery[i], width: 62, height: 62, fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(width: 62, height: 62, color: AppColors.line,
                              child: const Icon(Icons.broken_image, size: 18, color: AppColors.muted))),
                    ),
                    Positioned(
                      right: 0, top: 0,
                      child: GestureDetector(
                        onTap: () => setState(() => _gallery.removeAt(i)),
                        child: const CircleAvatar(radius: 9, backgroundColor: Colors.black54,
                            child: Icon(Icons.close, size: 12, color: Colors.white)),
                      ),
                    ),
                  ]),
                ),
              ),

            if (!isEdit) ...[
              const SizedBox(height: 10),
              TextField(controller: _stock, keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Stock initial')),
            ],

            // Options & suppléments (produit existant uniquement)
            if (isEdit) ...[
              const Divider(height: 24),
              Row(children: [
                const Icon(Icons.tune, size: 18, color: AppColors.brand),
                const SizedBox(width: 6),
                const Text('Options & suppléments', style: TextStyle(fontWeight: FontWeight.w700)),
                const Spacer(),
                TextButton.icon(
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Groupe'),
                  onPressed: _addOptionGroup,
                ),
              ]),
              if (_groups.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 4),
                  child: Text('Aucune option (ex. Taille, Sauces, Accompagnements).',
                      style: TextStyle(color: AppColors.muted, fontSize: 12)),
                )
              else
                ..._groups.map((g) => Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: const BorderSide(color: AppColors.line)),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(12, 8, 4, 8),
                        child: Row(children: [
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Text(g['name']?.toString() ?? '',
                                    style: const TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(width: 6),
                                Text(
                                    (g['minSelect'] ?? 0) > 0 ? 'obligatoire' : 'optionnel',
                                    style: const TextStyle(color: AppColors.muted, fontSize: 10)),
                              ]),
                              Text(
                                ((g['choices'] as List?) ?? [])
                                    .map((c) => (c['priceDelta'] ?? 0) != 0
                                        ? '${c['name']} (+${c['priceDelta']})'
                                        : '${c['name']}')
                                    .join(' · '),
                                style: const TextStyle(color: AppColors.muted, fontSize: 12),
                              ),
                            ]),
                          ),
                          IconButton(
                            icon: Icon(Icons.delete_outline, color: Colors.red.shade700, size: 20),
                            onPressed: () => _deleteOptionGroup(g['id'] as String),
                          ),
                        ]),
                      ),
                    )),
            ],
            const SizedBox(height: 16),
            FilledButton(onPressed: _busy ? null : _save, child: Text(_busy ? '...' : 'Enregistrer')),
          ],
        ),
      ),
    );
  }

  Future<void> _addGalleryImage() async {
    final ctrl = TextEditingController();
    final url = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Ajouter une photo'),
        content: TextField(controller: ctrl, decoration: const InputDecoration(labelText: 'URL de la photo')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Ajouter')),
        ],
      ),
    );
    if (url != null && url.isNotEmpty) setState(() => _gallery.add(url));
  }

  Future<void> _addCategory() async {
    final ctrl = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Nouvelle rubrique'),
        content: TextField(controller: ctrl, decoration: const InputDecoration(labelText: 'Nom (ex. Desserts)')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Créer')),
        ],
      ),
    );
    if (name == null || name.isEmpty) return;
    try {
      final c = await ref.read(merchantRepositoryProvider).createCategory(widget.storeId, name);
      bumpRefresh(ref);
      setState(() => _categoryId = c['id']?.toString());
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    }
  }

  Future<void> _addOptionGroup() async {
    final id = _productId;
    if (id == null) return;
    final body = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (_) => const _OptionGroupDialog(),
    );
    if (body == null) return;
    try {
      final g = await ref.read(merchantRepositoryProvider).createOptionGroup(id, body);
      bumpRefresh(ref);
      setState(() => _groups.add(g));
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    }
  }

  Future<void> _deleteOptionGroup(String groupId) async {
    try {
      await ref.read(merchantRepositoryProvider).deleteOptionGroup(groupId);
      bumpRefresh(ref);
      setState(() => _groups.removeWhere((g) => g['id'] == groupId));
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    }
  }

  Future<void> _save() async {
    setState(() => _busy = true);
    final repo = ref.read(merchantRepositoryProvider);
    final price = int.tryParse(_price.text.trim()) ?? 0;
    final body = <String, dynamic>{
      'name': _name.text.trim(),
      'description': _desc.text.trim(),
      'price': price,
      'promoPercent': _promo,
      'menuCategoryId': _categoryId,
      'imageUrl': _image.text.trim().isEmpty ? null : _image.text.trim(),
      'images': _gallery,
    };
    try {
      if (isEdit) {
        await repo.updateProduct(widget.product!['id'] as String, body);
      } else {
        body['stockQuantity'] = int.tryParse(_stock.text.trim()) ?? 0;
        await repo.createProduct(widget.storeId, body);
      }
      bumpRefresh(ref);
      if (mounted) Navigator.pop(context);
      if (mounted) showInfo(context, isEdit ? 'Produit modifié' : 'Produit ajouté');
    } on ApiException catch (e) {
      setState(() => _busy = false);
      if (mounted) showError(context, e.message);
    }
  }
}

/// Dialogue de création d'un groupe d'options : nom, obligatoire/multiple, choix.
class _OptionGroupDialog extends StatefulWidget {
  const _OptionGroupDialog();
  @override
  State<_OptionGroupDialog> createState() => _OptionGroupDialogState();
}

class _OptionGroupDialogState extends State<_OptionGroupDialog> {
  final _name = TextEditingController();
  bool _required = false;
  bool _multiple = false;
  final _maxSelect = TextEditingController(text: '1');
  // chaque choix : {name, priceDelta}
  final List<Map<String, dynamic>> _choices = [];

  void _addChoice() {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController(text: '0');
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Choix'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nom (ex. Grande)')),
          TextField(controller: priceCtrl, keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Supplément (FCFA)')),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          FilledButton(
            onPressed: () {
              if (nameCtrl.text.trim().isNotEmpty) {
                setState(() => _choices.add({
                      'name': nameCtrl.text.trim(),
                      'priceDelta': int.tryParse(priceCtrl.text.trim()) ?? 0,
                    }));
              }
              Navigator.pop(ctx);
            },
            child: const Text('Ajouter'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final maxSel = _multiple ? (int.tryParse(_maxSelect.text.trim()) ?? 1) : 1;
    return AlertDialog(
      title: const Text('Groupe d\'options'),
      content: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          TextField(controller: _name, onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(labelText: 'Nom du groupe (ex. Taille)')),
          SwitchListTile(
            contentPadding: EdgeInsets.zero, dense: true,
            title: const Text('Obligatoire'),
            value: _required, onChanged: (v) => setState(() => _required = v),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero, dense: true,
            title: const Text('Choix multiple'),
            value: _multiple, onChanged: (v) => setState(() => _multiple = v),
          ),
          if (_multiple)
            TextField(controller: _maxSelect, keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Nombre max de choix')),
          const SizedBox(height: 8),
          Row(children: [
            const Text('Choix', style: TextStyle(fontWeight: FontWeight.w600)),
            const Spacer(),
            TextButton.icon(icon: const Icon(Icons.add, size: 16), label: const Text('Ajouter'), onPressed: _addChoice),
          ]),
          ..._choices.asMap().entries.map((e) => ListTile(
                dense: true, contentPadding: EdgeInsets.zero,
                title: Text(e.value['name']?.toString() ?? ''),
                trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                  if ((e.value['priceDelta'] ?? 0) != 0) Text('+${e.value['priceDelta']} F'),
                  IconButton(icon: const Icon(Icons.close, size: 16),
                      onPressed: () => setState(() => _choices.removeAt(e.key))),
                ]),
              )),
        ]),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Annuler')),
        FilledButton(
          onPressed: (_name.text.trim().isEmpty || _choices.isEmpty)
              ? null
              : () => Navigator.pop(context, {
                    'name': _name.text.trim(),
                    'minSelect': _required ? 1 : 0,
                    'maxSelect': maxSel,
                    'choices': _choices,
                  }),
          child: const Text('Créer'),
        ),
      ],
    );
  }
}
