import 'package:flutter/material.dart';

import '../ui/ui.dart';

/// Une adresse enregistrée.
class NovigoAddress {
  final String id;
  final IconData icon;
  final String label;
  final String detail;
  final bool isDefault;

  const NovigoAddress({
    required this.id,
    required this.icon,
    required this.label,
    required this.detail,
    this.isDefault = false,
  });

  NovigoAddress copyWith({String? label, String? detail, bool? isDefault, IconData? icon}) =>
      NovigoAddress(
        id: id,
        icon: icon ?? this.icon,
        label: label ?? this.label,
        detail: detail ?? this.detail,
        isDefault: isDefault ?? this.isDefault,
      );
}

/// Adresses de livraison — **une liste, une action**.
///
/// Les trois entrées du menu (« Modifier », « Définir par défaut »,
/// « Supprimer ») et le bouton d'ajout n'affichaient qu'un message éphémère : la
/// liste ne changeait jamais. Elles agissent désormais réellement sur la liste
/// affichée. Les adresses ne sont pas encore persistées côté serveur — aucun
/// endpoint ne les expose — ce que l'écran indique honnêtement.
class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  final List<NovigoAddress> _items = [
    const NovigoAddress(
      id: 'home',
      icon: Icons.home_rounded,
      label: 'Domicile',
      detail: 'Rue 250, porte 74 · Hamdallaye ACI',
      isDefault: true,
    ),
    const NovigoAddress(
      id: 'work',
      icon: Icons.work_outline_rounded,
      label: 'Bureau',
      detail: 'Immeuble Kanu, 3e étage · ACI 2000',
    ),
    const NovigoAddress(
      id: 'mom',
      icon: Icons.favorite_border_rounded,
      label: 'Chez Maman',
      detail: 'Rue 132, porte 12 · Badalabougou',
    ),
  ];

  void _snack(String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  void _setDefault(NovigoAddress a) {
    setState(() {
      for (var i = 0; i < _items.length; i++) {
        _items[i] = _items[i].copyWith(isDefault: _items[i].id == a.id);
      }
    });
    _snack('« ${a.label} » est votre adresse par défaut.');
  }

  void _delete(NovigoAddress a) {
    final index = _items.indexWhere((e) => e.id == a.id);
    if (index < 0) return;
    setState(() => _items.removeAt(index));
    // Une suppression doit pouvoir être annulée : c'est le geste le plus facile
    // à déclencher par erreur dans un menu contextuel.
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('« ${a.label} » supprimée'),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Annuler',
          textColor: NC.brand,
          onPressed: () => setState(() => _items.insert(index, a)),
        ),
      ));
  }

  Future<void> _edit({NovigoAddress? existing}) async {
    final result = await showNovigoSheet<NovigoAddress>(
      context,
      builder: (_) => _AddressSheet(existing: existing),
    );
    if (result == null || !mounted) return;
    setState(() {
      final index = _items.indexWhere((e) => e.id == result.id);
      if (index >= 0) {
        _items[index] = result;
      } else {
        _items.add(result.copyWith(isDefault: _items.isEmpty));
      }
    });
    _snack(existing == null ? 'Adresse ajoutée' : 'Adresse modifiée');
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      appBar: AppBar(title: const Text('Mes adresses', style: T.h2)),
      body: SafeArea(
        top: false,
        child: NovigoContentWidth(
          child: _items.isEmpty
              ? NovigoEmptyState.empty(
                  icon: Icons.location_off_outlined,
                  title: 'Aucune adresse',
                  message: 'Ajoutez une adresse pour commander plus vite la prochaine fois.',
                  actionLabel: 'Ajouter une adresse',
                  onAction: () => _edit(),
                )
              : ListView(
                  padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xl),
                  children: [
                    for (var i = 0; i < _items.length; i++) ...[
                      if (i > 0) const SizedBox(height: Sp.md),
                      FadeSlideIn(
                        index: i,
                        child: _AddressCard(
                          address: _items[i],
                          onEdit: () => _edit(existing: _items[i]),
                          onDefault: () => _setDefault(_items[i]),
                          onDelete: () => _delete(_items[i]),
                        ),
                      ),
                    ],
                    const SizedBox(height: Sp.xl),
                    NovigoButton(
                      label: 'Ajouter une adresse',
                      icon: Icons.add_location_alt_outlined,
                      onPressed: () => _edit(),
                    ),
                    const SizedBox(height: Sp.md),
                    const Text(
                      'Vos adresses sont enregistrées sur cet appareil pour l\'instant.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: NC.faint, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  final NovigoAddress address;
  final VoidCallback onEdit;
  final VoidCallback onDefault;
  final VoidCallback onDelete;

  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDefault,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final a = address;
    return NovigoCard(
      semanticLabel: '${a.label}${a.isDefault ? ', adresse par défaut' : ''}, ${a.detail}',
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(14)),
          child: Icon(a.icon, color: NC.brand),
        ),
        const SizedBox(width: Sp.md + 2),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Wrap(spacing: Sp.sm, runSpacing: Sp.xs, crossAxisAlignment: WrapCrossAlignment.center, children: [
              Text(a.label, style: T.title),
              if (a.isDefault)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                  decoration: BoxDecoration(
                      color: NC.successSoft, borderRadius: BorderRadius.circular(R.pill)),
                  child: const Text('Par défaut',
                      style: TextStyle(
                          color: NC.success, fontWeight: FontWeight.w800, fontSize: 11.5)),
                ),
            ]),
            const SizedBox(height: 5),
            Text(a.detail, style: T.muted),
          ]),
        ),
        PopupMenuButton<String>(
          icon: const Icon(Icons.more_horiz_rounded, color: NC.muted),
          color: NC.surfaceAlt,
          tooltip: 'Options de l\'adresse',
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          onSelected: (v) {
            switch (v) {
              case 'edit':
                onEdit();
                break;
              case 'default':
                onDefault();
                break;
              case 'delete':
                onDelete();
                break;
            }
          },
          itemBuilder: (_) => [
            const PopupMenuItem(
              value: 'edit',
              child: Row(children: [
                Icon(Icons.edit_outlined, color: NC.ink, size: 20),
                SizedBox(width: Sp.md - 2),
                Text('Modifier', style: T.body),
              ]),
            ),
            if (!a.isDefault)
              const PopupMenuItem(
                value: 'default',
                child: Row(children: [
                  Icon(Icons.star_outline_rounded, color: NC.ink, size: 20),
                  SizedBox(width: Sp.md - 2),
                  Text('Définir par défaut', style: T.body),
                ]),
              ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(children: [
                Icon(Icons.delete_outline_rounded, color: NC.error, size: 20),
                SizedBox(width: Sp.md - 2),
                Text('Supprimer',
                    style: TextStyle(color: NC.error, fontWeight: FontWeight.w600)),
              ]),
            ),
          ],
        ),
      ]),
    );
  }
}

/// Formulaire d'ajout / modification.
class _AddressSheet extends StatefulWidget {
  final NovigoAddress? existing;
  const _AddressSheet({this.existing});

  @override
  State<_AddressSheet> createState() => _AddressSheetState();
}

class _AddressSheetState extends State<_AddressSheet> {
  late final _label = TextEditingController(text: widget.existing?.label ?? '');
  late final _detail = TextEditingController(text: widget.existing?.detail ?? '');

  @override
  void initState() {
    super.initState();
    _label.addListener(() => setState(() {}));
    _detail.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _label.dispose();
    _detail.dispose();
    super.dispose();
  }

  bool get _valid => _label.text.trim().isNotEmpty && _detail.text.trim().isNotEmpty;

  void _submit() {
    if (!_valid) return;
    final base = widget.existing;
    Navigator.pop(
      context,
      NovigoAddress(
        id: base?.id ?? 'a${DateTime.now().microsecondsSinceEpoch}',
        icon: base?.icon ?? Icons.place_rounded,
        label: _label.text.trim(),
        detail: _detail.text.trim(),
        isDefault: base?.isDefault ?? false,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      // La feuille remonte au-dessus du clavier.
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: NovigoBottomSheet(
        title: widget.existing == null ? 'Nouvelle adresse' : 'Modifier l\'adresse',
        subtitle: 'Donnez-lui un nom court, puis l\'adresse complète.',
        footer: NovigoButton(
          label: widget.existing == null ? 'Ajouter' : 'Enregistrer',
          onPressed: _valid ? _submit : null,
        ),
        child: Column(children: [
          _SheetField(controller: _label, hint: 'Domicile, Bureau…', icon: Icons.label_outline_rounded),
          const SizedBox(height: Sp.md),
          _SheetField(
            controller: _detail,
            hint: 'Rue, porte, quartier',
            icon: Icons.place_outlined,
            onSubmitted: _submit,
          ),
        ]),
      ),
    );
  }
}

class _SheetField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final VoidCallback? onSubmitted;

  const _SheetField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Sp.md + 2),
      decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        Icon(icon, color: NC.faint, size: 20),
        const SizedBox(width: Sp.md - 2),
        Expanded(
          child: TextField(
            controller: controller,
            style: const TextStyle(color: NC.ink, fontSize: 14.5),
            cursorColor: NC.brand,
            textInputAction: onSubmitted == null ? TextInputAction.next : TextInputAction.done,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: NC.faint, fontSize: 14),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: Sp.lg),
              isDense: true,
            ),
            onSubmitted: (_) => onSubmitted?.call(),
          ),
        ),
      ]),
    );
  }
}
