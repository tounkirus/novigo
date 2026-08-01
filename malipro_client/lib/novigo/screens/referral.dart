import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../ui/ui.dart';

/// Parrainage — **trois sections** : la promesse, le code à partager, le bilan.
///
/// Le bouton « Copier » annonçait « Code copié dans le presse-papiers » sans
/// rien copier ; il copie désormais réellement. « Partager » ouvrait un message
/// « bientôt disponible » : faute de fournisseur de partage embarqué dans le
/// projet, il copie le message d'invitation complet, prêt à être collé.
class ReferralScreen extends StatelessWidget {
  const ReferralScreen({super.key});

  static const _code = 'YOUSSOUF223';
  static const _invitation =
      'Rejoins-moi sur NOVIGO ! Utilise mon code $_code à ta première commande : '
      'on gagne 2 000 FCFA chacun.';

  Future<void> _copy(BuildContext context, String value, String confirmation) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(confirmation),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Parrainage', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: SafeArea(
        top: false,
        child: NovigoContentWidth(
          child: ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xxl),
            children: [
              // ───────── Section 1 · La promesse et le code ─────────
              NovigoCard(
                gradient: NC.premiumGradient,
                radius: R.xl,
                padding: const EdgeInsets.all(Sp.xl - 2),
                elevated: true,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.16),
                        borderRadius: BorderRadius.circular(18)),
                    child: const Icon(Icons.card_giftcard_rounded, color: Colors.white, size: 28),
                  ),
                  const SizedBox(height: Sp.lg),
                  const Text('Parrainez, gagnez\n2 000 FCFA',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 28,
                          height: 1.15)),
                  const SizedBox(height: Sp.sm),
                  const Text(
                      'Pour chaque ami qui passe sa première commande, vous gagnez tous les deux 2 000 FCFA.',
                      style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.4)),
                ]),
              ),
              const SizedBox(height: Sp.lg),
              NovigoCard(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('VOTRE CODE DE PARRAINAGE', style: T.overline),
                  const SizedBox(height: Sp.md),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: Sp.lg, vertical: Sp.md + 2),
                    decoration: BoxDecoration(
                      color: NC.surfaceAlt,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: NC.brand.withValues(alpha: 0.4), width: 1.2),
                    ),
                    child: Row(children: [
                      const Icon(Icons.confirmation_number_outlined, color: NC.brand, size: 20),
                      const SizedBox(width: Sp.md),
                      const Expanded(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(_code,
                              style: TextStyle(
                                  color: NC.ink,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 20,
                                  letterSpacing: 2)),
                        ),
                      ),
                      const SizedBox(width: Sp.sm),
                      NovigoButton.ghost(
                        label: 'Copier',
                        icon: Icons.copy_rounded,
                        size: NovigoButtonSize.small,
                        onPressed: () => _copy(context, _code, 'Code copié'),
                      ),
                    ]),
                  ),
                  const SizedBox(height: Sp.md + 2),
                  NovigoButton(
                    label: 'Copier l\'invitation',
                    icon: Icons.share_rounded,
                    onPressed: () => _copy(
                        context, _invitation, 'Invitation copiée — collez-la dans vos messages'),
                  ),
                ]),
              ),

              // ───────── Section 2 · Comment ça marche ─────────
              const SizedBox(height: Sp.section),
              const NovigoSectionHeader(overline: 'Mode d\'emploi', title: 'Comment ça marche'),
              const SizedBox(height: Sp.lg),
              const _Step(n: 1, title: 'Partagez votre code', subtitle: 'Envoyez $_code à vos amis.'),
              const _Step(
                  n: 2,
                  title: 'Ils commandent',
                  subtitle: 'Votre ami passe sa première commande avec le code.'),
              const _Step(
                  n: 3,
                  title: 'Vous gagnez tous les deux',
                  subtitle: '2 000 FCFA crédités sur votre NOVIGO Pay.',
                  last: true),

              // ───────── Section 3 · Le bilan ─────────
              const SizedBox(height: Sp.section),
              const NovigoSectionHeader(overline: 'Bilan', title: 'Vos gains'),
              const SizedBox(height: Sp.md),
              Row(children: const [
                _StatCard(
                    value: '7',
                    label: 'Amis parrainés',
                    icon: Icons.group_rounded,
                    accent: NC.info),
                SizedBox(width: Sp.md),
                _StatCard(
                    value: '14 000 FCFA',
                    label: 'Gains cumulés',
                    icon: Icons.savings_rounded,
                    accent: NC.success),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final int n;
  final String title, subtitle;
  final bool last;
  const _Step({required this.n, required this.title, required this.subtitle, this.last = false});

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Column(children: [
          Container(
            width: 34,
            height: 34,
            alignment: Alignment.center,
            decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
            child: Text('$n',
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
          ),
          if (!last)
            Expanded(
              child: Container(
                  width: 2, color: NC.line, margin: const EdgeInsets.symmetric(vertical: Sp.xs)),
            ),
        ]),
        const SizedBox(width: Sp.md + 2),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: last ? 0 : Sp.lg + 4),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SizedBox(height: Sp.xs),
              Text(title, style: T.title),
              const SizedBox(height: 3),
              Text(subtitle, style: T.muted),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value, label;
  final IconData icon;
  final Color accent;
  const _StatCard(
      {required this.value, required this.label, required this.icon, required this.accent});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: NovigoCard(
        semanticLabel: '$label : $value',
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: accent, size: 22),
          ),
          const SizedBox(height: Sp.md),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value,
                style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 20)),
          ),
          const SizedBox(height: 2),
          Text(label, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
        ]),
      ),
    );
  }
}
