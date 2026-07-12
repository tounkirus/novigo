import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../core/theme.dart';
import '../../catalog/data/catalog_repository.dart';
import '../application/cart_controller.dart';

/// Ajoute un produit au panier. S'il a des options, ouvre un sélecteur ;
/// sinon l'ajoute directement au prix promo de base.
Future<void> addToCart(BuildContext context, WidgetRef ref, Product product) async {
  if (product.isOut) return;
  if (!product.hasOptions) {
    ref.read(cartControllerProvider.notifier).add(product);
    _toast(context, '${product.name} ajouté');
    return;
  }
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _OptionSelector(product: product),
  );
}

void _toast(BuildContext context, String msg) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(msg), duration: const Duration(milliseconds: 800)),
  );
}

class _OptionSelector extends ConsumerStatefulWidget {
  const _OptionSelector({required this.product});
  final Product product;
  @override
  ConsumerState<_OptionSelector> createState() => _OptionSelectorState();
}

class _OptionSelectorState extends ConsumerState<_OptionSelector> {
  // groupId -> set of selected choiceIds
  final Map<String, Set<String>> _selected = {};

  @override
  void initState() {
    super.initState();
    for (final g in widget.product.optionGroups) {
      _selected[g.id] = {};
    }
  }

  int get _extra {
    var sum = 0;
    for (final g in widget.product.optionGroups) {
      for (final c in g.choices) {
        if (_selected[g.id]!.contains(c.id)) sum += c.priceDelta;
      }
    }
    return sum;
  }

  bool get _valid => widget.product.optionGroups
      .every((g) => _selected[g.id]!.length >= g.minSelect);

  void _toggle(OptionGroup g, String choiceId) {
    setState(() {
      final sel = _selected[g.id]!;
      if (g.multiple) {
        if (sel.contains(choiceId)) {
          sel.remove(choiceId);
        } else if (sel.length < g.maxSelect) {
          sel.add(choiceId);
        }
      } else {
        sel
          ..clear()
          ..add(choiceId);
      }
    });
  }

  void _confirm() {
    final choiceIds = <String>[];
    final labels = <String>[];
    for (final g in widget.product.optionGroups) {
      for (final c in g.choices) {
        if (_selected[g.id]!.contains(c.id)) {
          choiceIds.add(c.id);
          labels.add(c.name);
        }
      }
    }
    final unit = widget.product.baseAmount + _extra;
    ref.read(cartControllerProvider.notifier).addConfigured(
        widget.product, choiceIds, unit, labels.isEmpty ? null : labels.join(', '));
    Navigator.of(context).pop();
    _toast(context, '${widget.product.name} ajouté');
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final unit = p.baseAmount + _extra;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(p.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...p.optionGroups.map((g) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(g.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(width: 8),
                    Text(
                      g.required
                          ? (g.multiple ? 'min ${g.minSelect}, max ${g.maxSelect}' : 'obligatoire')
                          : (g.multiple ? 'jusqu\'à ${g.maxSelect}' : 'optionnel'),
                      style: const TextStyle(color: AppColors.muted, fontSize: 11),
                    ),
                  ]),
                  ...g.choices.map((c) {
                    final sel = _selected[g.id]!.contains(c.id);
                    return InkWell(
                      onTap: () => _toggle(g, c.id),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(children: [
                          Icon(
                            g.multiple
                                ? (sel ? Icons.check_box : Icons.check_box_outline_blank)
                                : (sel ? Icons.radio_button_checked : Icons.radio_button_unchecked),
                            size: 20, color: sel ? AppColors.brand : AppColors.muted,
                          ),
                          const SizedBox(width: 10),
                          Expanded(child: Text(c.name)),
                          if (c.priceDelta != 0)
                            Text('+${formatMoney({'amount': c.priceDelta, 'currency': 'XOF'})}',
                                style: const TextStyle(color: AppColors.brandDark, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    );
                  }),
                  const Divider(height: 20),
                ],
              )),
          const SizedBox(height: 4),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _valid ? _confirm : null,
              child: Text(_valid
                  ? 'Ajouter · ${formatMoney({'amount': unit, 'currency': 'XOF'})}'
                  : 'Choix obligatoire manquant'),
            ),
          ),
        ]),
      ),
    );
  }
}
