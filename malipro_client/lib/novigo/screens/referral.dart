import 'package:flutter/material.dart';
import '../theme.dart';

/// Écran « Parrainage » — hero, code à partager, étapes, gains cumulés.
class ReferralScreen extends StatelessWidget {
  const ReferralScreen({super.key});

  static const _code = 'YOUSSOUF223';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Parrainage', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Hero
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(24)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(18)),
              child: const Icon(Icons.card_giftcard_rounded, color: Colors.white, size: 28),
            ),
            const SizedBox(height: 16),
            const Text('Parrainez, gagnez\n2 000 FCFA',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 28, height: 1.15)),
            const SizedBox(height: 8),
            const Text('Pour chaque ami qui passe sa première commande, vous gagnez tous les deux 2 000 FCFA.',
                style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.4)),
          ]),
        ),
        const SizedBox(height: 20),
        // Carte code de parrainage
        Container(
          padding: const EdgeInsets.all(18),
          decoration: cardDeco(radius: 20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Votre code de parrainage', style: T.muted),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: NC.surfaceAlt,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: NC.brand.withValues(alpha: 0.4), width: 1.2),
              ),
              child: Row(children: [
                const Icon(Icons.confirmation_number_outlined, color: NC.brand, size: 20),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(_code,
                      style: TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: 2)),
                ),
                GestureDetector(
                  onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Code copié dans le presse-papiers'), duration: Duration(seconds: 2)),
                  ),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(color: NC.brand.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(999)),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.copy_rounded, size: 15, color: NC.brand),
                      SizedBox(width: 5),
                      Text('Copier', style: TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 13)),
                    ]),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 14),
            // Bouton Partager 56px gradient
            GestureDetector(
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Partage du code — bientôt disponible'), duration: Duration(seconds: 2)),
              ),
              child: Container(
                height: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(18), boxShadow: [
                  BoxShadow(color: NC.brand.withValues(alpha: 0.35), blurRadius: 22, offset: const Offset(0, 10)),
                ]),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.share_rounded, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Text('Partager mon code', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                ]),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 24),
        const Text('Comment ça marche', style: T.h2),
        const SizedBox(height: 12),
        const _Step(n: 1, title: 'Partagez votre code', subtitle: 'Envoyez YOUSSOUF223 à vos amis.'),
        const _Step(n: 2, title: 'Ils commandent', subtitle: 'Votre ami passe sa première commande avec le code.'),
        const _Step(n: 3, title: 'Vous gagnez tous les deux', subtitle: '2 000 FCFA crédités sur votre NOVIGO Pay.', last: true),
        const SizedBox(height: 24),
        // Compteurs
        Row(children: const [
          _StatCard(value: '7', label: 'Amis parrainés', icon: Icons.group_rounded, accent: NC.info),
          SizedBox(width: 12),
          _StatCard(value: '14 000 FCFA', label: 'Gains cumulés', icon: Icons.savings_rounded, accent: NC.success),
        ]),
        const SizedBox(height: 8),
      ]),
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
            decoration: BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
            child: Text('$n', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
          ),
          if (!last)
            Expanded(child: Container(width: 2, color: NC.line, margin: const EdgeInsets.symmetric(vertical: 4))),
        ]),
        const SizedBox(width: 14),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: last ? 0 : 20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SizedBox(height: 4),
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
  const _StatCard({required this.value, required this.label, required this.icon, required this.accent});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: cardDeco(radius: 18),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(color: accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: accent, size: 22),
          ),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 20)),
          const SizedBox(height: 2),
          Text(label, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
        ]),
      ),
    );
  }
}
