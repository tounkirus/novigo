import 'package:flutter/material.dart';
import '../theme.dart';

/// Écran des adresses enregistrées du client (Domicile, Bureau, …).
class AddressesScreen extends StatelessWidget {
  const AddressesScreen({super.key});

  static const _items = <_Address>[
    _Address(
      icon: Icons.home_rounded,
      label: 'Domicile',
      detail: 'Rue 250, porte 74 · Hamdallaye ACI',
      isDefault: true,
    ),
    _Address(
      icon: Icons.work_outline_rounded,
      label: 'Bureau',
      detail: 'Immeuble Kanu, 3e étage · ACI 2000',
      isDefault: false,
    ),
    _Address(
      icon: Icons.favorite_border_rounded,
      label: 'Chez Maman',
      detail: 'Rue 132, porte 12 · Badalabougou',
      isDefault: false,
    ),
  ];

  void _snack(BuildContext context, String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes adresses', style: T.h2)),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            for (final a in _items) ...[
              _card(context, a),
              const SizedBox(height: 12),
            ],
            const SizedBox(height: 4),
            _addButton(context),
          ],
        ),
      ),
    );
  }

  Widget _card(BuildContext context, _Address a) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: cardDeco(radius: 18),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(14)),
          child: Icon(a.icon, color: NC.brand),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text(a.label, style: T.title),
              if (a.isDefault) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                  decoration: BoxDecoration(color: NC.successSoft, borderRadius: BorderRadius.circular(999)),
                  child: const Text('Par défaut',
                      style: TextStyle(color: NC.success, fontWeight: FontWeight.w800, fontSize: 11.5)),
                ),
              ],
            ]),
            const SizedBox(height: 5),
            Text(a.detail, style: T.muted),
          ]),
        ),
        _menu(context, a),
      ]),
    );
  }

  Widget _menu(BuildContext context, _Address a) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_horiz_rounded, color: NC.muted),
      color: NC.surfaceAlt,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      onSelected: (v) {
        switch (v) {
          case 'edit':
            _snack(context, 'Modifier « ${a.label} »');
            break;
          case 'default':
            _snack(context, '« ${a.label} » définie par défaut');
            break;
          case 'delete':
            _snack(context, '« ${a.label} » supprimée');
            break;
        }
      },
      itemBuilder: (_) => const [
        PopupMenuItem(
          value: 'edit',
          child: Row(children: [
            Icon(Icons.edit_outlined, color: NC.ink, size: 20),
            SizedBox(width: 10),
            Text('Modifier', style: T.body),
          ]),
        ),
        PopupMenuItem(
          value: 'default',
          child: Row(children: [
            Icon(Icons.star_outline_rounded, color: NC.ink, size: 20),
            SizedBox(width: 10),
            Text('Définir par défaut', style: T.body),
          ]),
        ),
        PopupMenuItem(
          value: 'delete',
          child: Row(children: [
            Icon(Icons.delete_outline_rounded, color: NC.error, size: 20),
            SizedBox(width: 10),
            Text('Supprimer', style: TextStyle(color: NC.error, fontWeight: FontWeight.w600)),
          ]),
        ),
      ],
    );
  }

  Widget _addButton(BuildContext context) {
    return GestureDetector(
      onTap: () => _snack(context, 'Ajout d\'une nouvelle adresse'),
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          gradient: NC.brandGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: NC.brand.withValues(alpha: 0.32), blurRadius: 20, offset: const Offset(0, 8)),
          ],
        ),
        alignment: Alignment.center,
        child: const Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.add_location_alt_outlined, color: Colors.white),
          SizedBox(width: 10),
          Text('Ajouter une adresse',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
        ]),
      ),
    );
  }
}

class _Address {
  final IconData icon;
  final String label;
  final String detail;
  final bool isDefault;
  const _Address({
    required this.icon,
    required this.label,
    required this.detail,
    required this.isDefault,
  });
}
