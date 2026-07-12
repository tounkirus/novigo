import 'package:flutter/material.dart';
import '../theme.dart';

/// Écran « NOVIGO Premium » — hero, avantages, plans sélectionnables, abonnement.
class PremiumScreen extends StatefulWidget {
  const PremiumScreen({super.key});

  @override
  State<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  int _selected = 1; // 0 = mensuel, 1 = annuel (par défaut, meilleur prix)

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NOVIGO Premium', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Hero
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(24)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: NC.gold.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(999)),
              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.workspace_premium_rounded, color: NC.gold, size: 15),
                SizedBox(width: 5),
                Text('PREMIUM', style: TextStyle(color: NC.gold, fontWeight: FontWeight.w800, fontSize: 12, letterSpacing: 1)),
              ]),
            ),
            const SizedBox(height: 14),
            const Text('Passez à\nNOVIGO Premium',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 28, height: 1.15)),
            const SizedBox(height: 8),
            const Text('Livraisons offertes, réductions exclusives et bien plus.',
                style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.35)),
          ]),
        ),
        const SizedBox(height: 24),
        const Text('Vos avantages', style: T.h2),
        const SizedBox(height: 12),
        const _Benefit(icon: Icons.pedal_bike_rounded, title: 'Livraisons offertes', subtitle: 'Sur toutes vos commandes éligibles', accent: NC.success),
        const _Benefit(icon: Icons.percent_rounded, title: 'Réductions exclusives', subtitle: 'Jusqu\'à -20% chez nos partenaires', accent: NC.brand),
        const _Benefit(icon: Icons.support_agent_rounded, title: 'Support prioritaire', subtitle: 'Une équipe dédiée 7j/7', accent: NC.info),
        const _Benefit(icon: Icons.savings_rounded, title: 'Cashback 2%', subtitle: 'Reversé sur votre NOVIGO Pay', accent: NC.gold),
        const SizedBox(height: 24),
        const Text('Choisissez votre formule', style: T.h2),
        const SizedBox(height: 12),
        _PlanCard(
          selected: _selected == 0,
          onTap: () => setState(() => _selected = 0),
          title: 'Mensuel',
          price: '2 500 FCFA',
          period: '/ mois',
          note: 'Sans engagement',
        ),
        const SizedBox(height: 12),
        _PlanCard(
          selected: _selected == 1,
          onTap: () => setState(() => _selected = 1),
          title: 'Annuel',
          price: '24 000 FCFA',
          period: '/ an',
          note: 'Soit 2 000 FCFA / mois',
          badge: '-20%',
        ),
        const SizedBox(height: 24),
        // Bouton S'abonner 56px gradient
        GestureDetector(
          onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Abonnement ${_selected == 0 ? 'Mensuel' : 'Annuel'} — bientôt disponible'),
            duration: const Duration(seconds: 2),
          )),
          child: Container(
            height: 56,
            alignment: Alignment.center,
            decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(18), boxShadow: [
              BoxShadow(color: NC.brand.withValues(alpha: 0.35), blurRadius: 22, offset: const Offset(0, 10)),
            ]),
            child: const Text('S\'abonner', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
          ),
        ),
        const SizedBox(height: 10),
        const Center(
          child: Text('Résiliable à tout moment', style: TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w500)),
        ),
        const SizedBox(height: 8),
      ]),
    );
  }
}

class _Benefit extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final Color accent;
  const _Benefit({required this.icon, required this.title, required this.subtitle, required this.accent});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: cardDeco(radius: 16),
      child: Row(children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(color: accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
          child: Icon(icon, color: accent, size: 23),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(subtitle, style: T.muted, maxLines: 2, overflow: TextOverflow.ellipsis),
          ]),
        ),
        const SizedBox(width: 10),
        Container(
          width: 26,
          height: 26,
          decoration: const BoxDecoration(color: NC.success, shape: BoxShape.circle),
          child: const Icon(Icons.check_rounded, color: Colors.white, size: 17),
        ),
      ]),
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
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: cardDeco(
          radius: 18,
          border: Border.all(color: selected ? NC.brand : NC.line, width: selected ? 2 : 1),
        ),
        child: Row(children: [
          // Radio
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
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(title, style: T.title),
                if (badge != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: NC.success.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
                    child: Text(badge!, style: const TextStyle(color: NC.success, fontWeight: FontWeight.w800, fontSize: 12)),
                  ),
                ],
              ]),
              const SizedBox(height: 3),
              Text(note, style: T.muted),
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(price, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 17)),
            Text(period, style: const TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
          ]),
        ]),
      ),
    );
  }
}
