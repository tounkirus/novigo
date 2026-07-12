import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../state.dart';

class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListenableBuilder(
        listenable: merchant,
        builder: (_, __) {
          final sections = merchant.sections;
          return CustomScrollView(slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              sliver: SliverToBoxAdapter(
                child: Row(children: [
                  const Text('Menu', style: T.h1),
                  const Spacer(),
                  Text('${merchant.products.length} produits', style: T.muted),
                ]),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              sliver: SliverToBoxAdapter(child: _addButton(context)),
            ),
            for (final section in sections) ...[
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
                sliver: SliverToBoxAdapter(child: Text(section, style: T.h2)),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList.separated(
                  itemCount: merchant.products.where((p) => p.section == section).length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) {
                    final items = merchant.products.where((p) => p.section == section).toList();
                    return _ProductRow(product: items[i]);
                  },
                ),
              ),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ]);
        },
      ),
    );
  }

  Widget _addButton(BuildContext context) => GestureDetector(
        onTap: () => ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ajout de produit — bientôt disponible'), duration: Duration(seconds: 1)),
        ),
        behavior: HitTestBehavior.opaque,
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            color: NC.brandSoft,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: NC.brand.withValues(alpha: 0.4), width: 1),
          ),
          alignment: Alignment.center,
          child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.add_rounded, color: NC.brand),
            SizedBox(width: 8),
            Text('Ajouter un produit', style: TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 15)),
          ]),
        ),
      );
}

class _ProductRow extends StatelessWidget {
  final MProduct product;
  const _ProductRow({required this.product});

  @override
  Widget build(BuildContext context) {
    final off = !product.available;
    return GestureDetector(
      onTap: () => _openSheet(context),
      behavior: HitTestBehavior.opaque,
      child: Opacity(
        opacity: off ? 0.5 : 1,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: cardDeco(radius: 16),
          child: Row(children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                  color: product.tone.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
              child: Icon(product.icon, color: product.tone, size: 26),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(product.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Row(children: [
                  Text(fcfa(product.price), style: T.price),
                  const SizedBox(width: 8),
                  if (off)
                    const Text('Indisponible', style: TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600))
                  else
                    const Text('Disponible', style: TextStyle(color: NC.success, fontSize: 12.5, fontWeight: FontWeight.w600)),
                ]),
              ]),
            ),
            Switch(
              value: product.available,
              onChanged: (_) => merchant.toggleAvailable(product.id),
              activeThumbColor: Colors.white,
              activeTrackColor: NC.success,
              inactiveThumbColor: Colors.white,
              inactiveTrackColor: NC.surfaceAlt,
            ),
          ]),
        ),
      ),
    );
  }

  void _openSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ProductSheet(product: product),
    );
  }
}

class _ProductSheet extends StatelessWidget {
  final MProduct product;
  const _ProductSheet({required this.product});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: NC.paper,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SizedBox(height: 10),
          Container(width: 44, height: 5, decoration: BoxDecoration(color: NC.line, borderRadius: BorderRadius.circular(999))),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18),
            child: Container(
              height: 160,
              width: double.infinity,
              decoration: BoxDecoration(
                color: product.tone.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(20),
              ),
              alignment: Alignment.center,
              child: Icon(product.icon, color: product.tone, size: 72),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 6),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(product.name, style: T.h2),
              const SizedBox(height: 6),
              Text(product.section, style: T.muted),
              const SizedBox(height: 12),
              Text(fcfa(product.price), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: NC.ink)),
            ]),
          ),
          // Switch disponibilité
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: cardDeco(radius: 16),
              child: ListenableBuilder(
                listenable: merchant,
                builder: (_, __) => Row(children: [
                  Icon(product.available ? Icons.check_circle_rounded : Icons.remove_circle_outline_rounded,
                      color: product.available ? NC.success : NC.faint, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(product.available ? 'Disponible à la vente' : 'Masqué du menu',
                        style: T.body),
                  ),
                  Switch(
                    value: product.available,
                    onChanged: (_) => merchant.toggleAvailable(product.id),
                    activeThumbColor: Colors.white,
                    activeTrackColor: NC.success,
                    inactiveThumbColor: Colors.white,
                    inactiveTrackColor: NC.surfaceAlt,
                  ),
                ]),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
            child: GestureDetector(
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Modification — bientôt disponible'), duration: Duration(seconds: 1)),
                );
              },
              child: Container(
                height: 54,
                width: double.infinity,
                decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
                alignment: Alignment.center,
                child: const Text('Modifier le produit',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}
