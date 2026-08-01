import 'package:flutter/material.dart';

import '../ui/ui.dart';

/// NOVIGO Premium — **trois sections** : la promesse, ce que ça apporte, ce que
/// ça coûte.
///
/// L'abonnement n'est pas encore branché sur un moyen de paiement : l'écran le
/// dit au lieu de faire croire qu'un appui suffit à s'abonner.
class PremiumScreen extends StatefulWidget {
  const PremiumScreen({super.key});

  @override
  State<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  int _selected = 1; // 0 = mensuel, 1 = annuel (par défaut, meilleur prix)

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      appBar: AppBar(
        title: const Text('NOVIGO Premium', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: SafeArea(
        top: false,
        child: NovigoContentWidth(
          child: ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xxl),
            children: [
              // ───────── Section 1 · La promesse ─────────
              NovigoCard(
                gradient: NC.premiumGradient,
                radius: R.xl,
                padding: const EdgeInsets.all(Sp.xl - 2),
                elevated: true,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: Sp.xs + 2),
                    decoration: BoxDecoration(
                        color: NC.gold.withValues(alpha: 0.22),
                        borderRadius: BorderRadius.circular(R.pill)),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.workspace_premium_rounded, color: NC.gold, size: 15),
                      SizedBox(width: 5),
                      Text('PREMIUM',
                          style: TextStyle(
                              color: NC.gold,
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                              letterSpacing: 1)),
                    ]),
                  ),
                  const SizedBox(height: Sp.md + 2),
                  const Text('Passez à\nNOVIGO Premium',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 28,
                          height: 1.15)),
                  const SizedBox(height: Sp.sm),
                  const Text('Livraisons offertes, réductions exclusives et bien plus.',
                      style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.35)),
                ]),
              ),

              // ───────── Section 2 · Les avantages ─────────
              const SizedBox(height: Sp.section),
              const NovigoSectionHeader(overline: 'Inclus', title: 'Vos avantages'),
              const SizedBox(height: Sp.md),
              const _Benefit(
                  icon: Icons.pedal_bike_rounded,
                  title: 'Livraisons offertes',
                  subtitle: 'Sur toutes vos commandes éligibles',
                  accent: NC.success),
              const _Benefit(
                  icon: Icons.percent_rounded,
                  title: 'Réductions exclusives',
                  subtitle: 'Jusqu\'à -20% chez nos partenaires',
                  accent: NC.brand),
              const _Benefit(
                  icon: Icons.support_agent_rounded,
                  title: 'Support prioritaire',
                  subtitle: 'Une équipe dédiée 7j/7',
                  accent: NC.info),
              const _Benefit(
                  icon: Icons.savings_rounded,
                  title: 'Cashback 2%',
                  subtitle: 'Reversé sur votre NOVIGO Pay',
                  accent: NC.gold,
                  last: true),

              // ───────── Section 3 · Les formules ─────────
              const SizedBox(height: Sp.section),
              const NovigoSectionHeader(overline: 'Tarifs', title: 'Choisissez votre formule'),
              const SizedBox(height: Sp.md),
              _PlanCard(
                selected: _selected == 0,
                onTap: () => setState(() => _selected = 0),
                title: 'Mensuel',
                price: '2 500 FCFA',
                period: '/ mois',
                note: 'Sans engagement',
              ),
              const SizedBox(height: Sp.md),
              _PlanCard(
                selected: _selected == 1,
                onTap: () => setState(() => _selected = 1),
                title: 'Annuel',
                price: '24 000 FCFA',
                period: '/ an',
                note: 'Soit 2 000 FCFA / mois',
                badge: '-20%',
              ),
              const SizedBox(height: Sp.xl),
              NovigoButton(
                label: 'S\'abonner',
                icon: Icons.workspace_premium_rounded,
                onPressed: () {
                  ScaffoldMessenger.of(context)
                    ..hideCurrentSnackBar()
                    ..showSnackBar(SnackBar(
                      content: Text(
                          'Formule ${_selected == 0 ? 'mensuelle' : 'annuelle'} retenue — le paiement de l\'abonnement ouvre bientôt.'),
                      backgroundColor: NC.surfaceAlt,
                      behavior: SnackBarBehavior.floating,
                    ));
                },
              ),
              const SizedBox(height: Sp.md - 2),
              const Center(
                child: Text('Résiliable à tout moment',
                    style: TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w500)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Benefit extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final Color accent;
  final bool last;

  const _Benefit({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.accent,
    this.last = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : Sp.md),
      child: NovigoCard(
        radius: R.md,
        padding: const EdgeInsets.all(Sp.md + 2),
        semanticLabel: '$title, $subtitle, inclus',
        child: Row(children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
            child: Icon(icon, color: accent, size: 23),
          ),
          const SizedBox(width: Sp.md + 2),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text(subtitle, style: T.muted, maxLines: 2, overflow: TextOverflow.ellipsis),
            ]),
          ),
          const SizedBox(width: Sp.md - 2),
          Container(
            width: 26,
            height: 26,
            decoration: const BoxDecoration(color: NC.success, shape: BoxShape.circle),
            child: const Icon(Icons.check_rounded, color: Colors.white, size: 17),
          ),
        ]),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final bool selected;
  final VoidCallback onTap;
  final String title, price, period, note;
  final String? badge;

  const _PlanCard({
    required this.selected,
    required this.onTap,
    required this.title,
    required this.price,
    required this.period,
    required this.note,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: '$title, $price $period, $note',
      child: NovigoCard(
        onTap: onTap,
        radius: 18,
        padding: const EdgeInsets.all(Sp.lg + 2),
        border: Border.all(color: selected ? NC.brand : NC.hairline, width: selected ? 2 : 1),
        child: Row(children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: selected ? NC.brand : NC.faint, width: 2),
              color: selected ? NC.brand : Colors.transparent,
            ),
            child: selected ? const Icon(Icons.check_rounded, color: Colors.white, size: 16) : null,
          ),
          const SizedBox(width: Sp.md + 2),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Wrap(
                spacing: Sp.sm,
                runSpacing: Sp.xs,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(title, style: T.title),
                  if (badge != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: Sp.sm, vertical: 3),
                      decoration: BoxDecoration(
                          color: NC.success.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(R.pill)),
                      child: Text(badge!,
                          style: const TextStyle(
                              color: NC.success, fontWeight: FontWeight.w800, fontSize: 12)),
                    ),
                ],
              ),
              const SizedBox(height: 3),
              Text(note, style: T.muted),
            ]),
          ),
          const SizedBox(width: Sp.sm),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerRight,
              child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(price,
                    style:
                        const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 17)),
                Text(period,
                    style: const TextStyle(
                        color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}
