import 'package:flutter/material.dart';

import '../models.dart' show fcfa;
import '../ui/ui.dart';
import '../widgets.dart' show Pill;

/// Un fournisseur de services facturés.
class _Provider {
  final IconData icon;
  final String name;
  final String category;
  final Color color;
  const _Provider(this.icon, this.name, this.category, this.color);
}

const _providers = <_Provider>[
  _Provider(Icons.bolt_rounded, 'EDM', 'Électricité', Color(0xFFFFC043)),
  _Provider(Icons.water_drop_rounded, 'SOMAGEP', 'Eau', Color(0xFF2196F3)),
  _Provider(Icons.sim_card_rounded, 'Orange', 'Mobile / Fibre', Color(0xFFFF7A00)),
  _Provider(Icons.sim_card_rounded, 'Malitel', 'Mobile', Color(0xFF2ECC71)),
  _Provider(Icons.sim_card_rounded, 'Telecel', 'Mobile', Color(0xFF7C4DFF)),
  _Provider(Icons.tv_rounded, 'Canal+', 'Télévision', Color(0xFFE53935)),
  _Provider(Icons.flight_rounded, 'ASKY', 'Billets / Abo', Color(0xFF00BCD4)),
  _Provider(Icons.wifi_rounded, 'Orange Fibre', 'Internet', Color(0xFFFF7A00)),
  _Provider(Icons.more_horiz_rounded, 'Autres', 'Voir tout', NC.muted),
];

class _PaidBill {
  final String name;
  final String status;
  final int amount;
  final IconData icon;
  final Color color;
  final bool paid;
  const _PaidBill(this.name, this.status, this.amount, this.icon, this.color, this.paid);
}

const _history = <_PaidBill>[
  _PaidBill('SOMAGEP — Eau', 'Payée le 02 juil.', 8750, Icons.water_drop_rounded,
      Color(0xFF2196F3), true),
  _PaidBill('Canal+ Access', 'Payée le 28 juin', 10000, Icons.tv_rounded, NC.brand, true),
  _PaidBill('Orange Fibre', 'En attente', 25000, Icons.wifi_rounded, Color(0xFFFF7A00), false),
  _PaidBill('EDM — Électricité', 'Payée le 12 juin', 11200, Icons.bolt_rounded,
      Color(0xFFFFC043), true),
];

/// Factures — **trois sections** : ce qu'il y a à payer, chez qui payer, ce qui
/// a déjà été payé.
///
/// L'écran commençait par une bannière d'accroche puis une grille de nine
/// fournisseurs avant de montrer la seule chose utile — la facture à échéance.
/// L'ordre est inversé : l'action d'abord.
class BillsScreen extends StatelessWidget {
  const BillsScreen({super.key});

  void _soon(BuildContext context, String label) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('$label — bientôt disponible'),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Factures', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: SafeArea(
        top: false,
        child: NovigoContentWidth(
          child: ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xxl),
            children: [
              const NovigoDemoBanner(
                message:
                    'Factures de démonstration — le raccordement aux fournisseurs est en cours.',
              ),

              // ───────── Section 1 · À payer ─────────
              const SizedBox(height: Sp.lg),
              const NovigoSectionHeader(overline: 'À régler', title: 'Votre facture en cours'),
              const SizedBox(height: Sp.md),
              NovigoCard(
                padding: const EdgeInsets.all(Sp.lg + 2),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                          color: const Color(0xFFFFC043).withValues(alpha: 0.16),
                          borderRadius: BorderRadius.circular(14)),
                      child: const Icon(Icons.bolt_rounded, color: Color(0xFFFFC043), size: 24),
                    ),
                    const SizedBox(width: Sp.md),
                    const Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('EDM — Électricité', style: T.title),
                        SizedBox(height: 2),
                        Text('Compteur N° 0021 4478 991', style: T.muted),
                      ]),
                    ),
                    const SizedBox(width: Sp.sm),
                    // La pastille cède la place au nom du fournisseur quand la
                    // police est agrandie sur un petit écran.
                    const Flexible(
                      child: Pill('À échéance',
                          color: NC.warning, bg: Color(0x22FF9800), icon: Icons.schedule_rounded),
                    ),
                  ]),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: Sp.md + 2),
                    child: NovigoDivider(),
                  ),
                  const _DetailLine(label: 'Référence', value: 'FACT-2026-07-4471'),
                  const SizedBox(height: Sp.sm + 2),
                  const _DetailLine(label: 'Échéance', value: '15 juillet 2026'),
                  const SizedBox(height: Sp.sm + 2),
                  Row(children: [
                    const Expanded(child: Text('Montant dû', style: T.muted)),
                    const SizedBox(width: Sp.md),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerRight,
                        child: Text(fcfa(12400),
                            style: const TextStyle(
                                color: NC.ink, fontWeight: FontWeight.w900, fontSize: 20)),
                      ),
                    ),
                  ]),
                  const SizedBox(height: Sp.lg),
                  NovigoButton(
                    label: 'Payer',
                    trailingLabel: fcfa(12400),
                    onPressed: () => _soon(context, 'Paiement de ${fcfa(12400)}'),
                  ),
                ]),
              ),

              // ───────── Section 2 · Les fournisseurs ─────────
              const SizedBox(height: Sp.section),
              const NovigoSectionHeader(
                overline: 'Payer',
                title: 'Vos fournisseurs',
                subtitle: 'Électricité, eau, télécom, télévision.',
              ),
              const SizedBox(height: Sp.md),
              LayoutBuilder(builder: (context, c) {
                final columns = Rs.of(context).isTablet ? 4 : 3;
                return GridView.count(
                  crossAxisCount: columns,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: Sp.md,
                  mainAxisSpacing: Sp.md,
                  // Hauteur dérivée de la police réelle : à ratio fixe, les deux
                  // lignes de libellé débordaient de la tuile en grand texte.
                  mainAxisExtent: _providerTileHeight(context),
                  children: [
                    for (final p in _providers)
                      _ProviderTile(provider: p, onTap: () => _soon(context, p.name)),
                  ],
                );
              }),

              // ───────── Section 3 · L'historique ─────────
              const SizedBox(height: Sp.section),
              const NovigoSectionHeader(overline: 'Historique', title: 'Factures récentes'),
              const SizedBox(height: Sp.md),
              for (var i = 0; i < _history.length; i++) ...[
                if (i > 0) const SizedBox(height: Sp.md),
                FadeSlideIn(index: i, child: _HistoryCard(bill: _history[i])),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Hauteur d'une tuile fournisseur, dérivée de la police réelle plutôt que d'un
/// ratio fixe. Les deux points de marge supplémentaires couvrent le liseré de la
/// carte et l'interligne du texte, qui varie selon la police du système.
double _providerTileHeight(BuildContext context) {
  final scaler = MediaQuery.textScalerOf(context);
  return 14 * 2 + 46 + 8 + scaler.scale(13) * 1.45 + 1 + scaler.scale(11) * 1.45 + 2;
}

class _DetailLine extends StatelessWidget {
  final String label;
  final String value;
  const _DetailLine({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(child: Text(label, style: T.muted)),
        const SizedBox(width: Sp.md),
        Flexible(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerRight,
            child: Text(value,
                style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 14)),
          ),
        ),
      ]);
}

class _ProviderTile extends StatelessWidget {
  final _Provider provider;
  final VoidCallback onTap;
  const _ProviderTile({required this.provider, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = provider;
    return NovigoCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(vertical: Sp.md + 2, horizontal: Sp.sm),
      semanticLabel: '${p.name}, ${p.category}',
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
              color: p.color.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
          child: Icon(p.icon, color: p.color, size: 24),
        ),
        const SizedBox(height: Sp.sm),
        // Le bloc de texte est flexible : la hauteur de tuile est calculée, mais
        // l'interligne réel d'une police système peut la dépasser d'une fraction
        // de pixel — ce qui suffit à provoquer un débordement.
        Flexible(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text(p.name,
                  style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
              const SizedBox(height: 1),
              Text(p.category,
                  style: const TextStyle(color: NC.faint, fontSize: 11),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final _PaidBill bill;
  const _HistoryCard({required this.bill});

  @override
  Widget build(BuildContext context) {
    final b = bill;
    return NovigoCard(
      radius: R.md,
      padding: const EdgeInsets.all(Sp.md + 2),
      semanticLabel: '${b.name}, ${b.status}, ${fcfa(b.amount)}',
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
              color: b.color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(12)),
          child: Icon(b.icon, color: b.color, size: 20),
        ),
        const SizedBox(width: Sp.md),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(b.name, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Row(children: [
              Container(
                width: 8,
                height: 8,
                decoration:
                    BoxDecoration(color: b.paid ? NC.success : NC.error, shape: BoxShape.circle),
              ),
              const SizedBox(width: Sp.xs + 2),
              Flexible(
                child: Text(b.status,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        color: b.paid ? NC.success : NC.error,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600)),
              ),
            ]),
          ]),
        ),
        const SizedBox(width: Sp.sm),
        Flexible(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerRight,
            child: Text(fcfa(b.amount),
                style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 13.5)),
          ),
        ),
      ]),
    );
  }
}
