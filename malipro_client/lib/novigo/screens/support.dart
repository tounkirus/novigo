import 'package:flutter/material.dart';
import '../theme.dart';

/// Centre d'aide & support client.
class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  static const _cats = <_HelpCat>[
    _HelpCat(Icons.receipt_long_outlined, 'Commandes'),
    _HelpCat(Icons.account_balance_wallet_outlined, 'Paiement'),
    _HelpCat(Icons.person_outline_rounded, 'Compte'),
    _HelpCat(Icons.pedal_bike, 'Livraison'),
  ];

  static const _faq = <_Faq>[
    _Faq(
      'Comment suivre ma commande ?',
      'Rendez-vous dans l\'onglet « Commandes », ouvrez la commande en cours puis appuyez sur « Suivre ma commande » pour voir le livreur en temps réel sur la carte.',
    ),
    _Faq(
      'Quels moyens de paiement acceptez-vous ?',
      'NOVIGO accepte NOVIGO Pay, Orange Money, Moov Money, les cartes bancaires ainsi que le paiement en espèces à la livraison.',
    ),
    _Faq(
      'Puis-je annuler une commande ?',
      'Une commande peut être annulée gratuitement tant qu\'elle n\'a pas été acceptée par le commerçant. Passé ce délai, contactez le support pour étudier votre demande.',
    ),
    _Faq(
      'Combien de temps prend la livraison ?',
      'Le délai estimé s\'affiche sur chaque commerce avant la commande. En moyenne, une livraison à Bamako prend entre 20 et 40 minutes selon la distance et l\'affluence.',
    ),
    _Faq(
      'Que faire si un article manque ?',
      'Signalez-le depuis le détail de la commande dans les 24 h. Notre équipe procède au remboursement de l\'article manquant sur votre solde NOVIGO Pay.',
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
      appBar: AppBar(title: const Text('Aide & support', style: T.h2)),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            _hero(context),
            const SizedBox(height: 20),
            const Text('Catégories d\'aide', style: T.h2),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 2.6,
              children: [
                for (final c in _cats) _catCard(context, c),
              ],
            ),
            const SizedBox(height: 22),
            const Text('Questions fréquentes', style: T.h2),
            const SizedBox(height: 12),
            Container(
              decoration: cardDeco(radius: 18),
              clipBehavior: Clip.antiAlias,
              child: Column(children: [
                for (int i = 0; i < _faq.length; i++) ...[
                  if (i > 0) const Divider(color: NC.line, height: 1),
                  _faqTile(_faq[i]),
                ],
              ]),
            ),
            const SizedBox(height: 22),
            _contactCard(context),
          ],
        ),
      ),
    );
  }

  Widget _hero(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(22)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Comment pouvons-nous aider ?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22, height: 1.15)),
        const SizedBox(height: 6),
        const Text('Trouvez une réponse ou contactez notre équipe.',
            style: TextStyle(color: Colors.white70, fontSize: 13.5)),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: () => _snack(context, 'Recherche dans l\'aide'),
          child: Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(14)),
            child: const Row(children: [
              Icon(Icons.search_rounded, color: Colors.white70, size: 20),
              SizedBox(width: 10),
              Text('Rechercher une question…', style: TextStyle(color: Colors.white70, fontSize: 14)),
            ]),
          ),
        ),
      ]),
    );
  }

  Widget _catCard(BuildContext context, _HelpCat c) {
    return GestureDetector(
      onTap: () => _snack(context, 'Aide : ${c.label}'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: cardDeco(radius: 16),
        child: Row(children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
            child: Icon(c.icon, color: NC.brand, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(c.label, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis)),
        ]),
      ),
    );
  }

  Widget _faqTile(_Faq f) {
    return Theme(
      data: ThemeData.dark().copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        iconColor: NC.brand,
        collapsedIconColor: NC.muted,
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        title: Text(f.q, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 14.5)),
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Text(f.a, style: T.muted),
          ),
        ],
      ),
    );
  }

  Widget _contactCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: cardDeco(radius: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(14)),
            child: const Icon(Icons.headset_mic_outlined, color: NC.brand),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Contacter le support', style: T.title),
              SizedBox(height: 3),
              Text('Disponible 7j/7 de 8h à 22h', style: T.muted),
            ]),
          ),
        ]),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(
            child: _btn(
              icon: Icons.chat_bubble_outline_rounded,
              label: 'Chat',
              filled: true,
              onTap: () => _snack(context, 'Ouverture du chat avec le support'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _btn(
              icon: Icons.call_outlined,
              label: 'Appeler',
              filled: false,
              onTap: () => _snack(context, 'Appel du support : +223 20 00 00 00'),
            ),
          ),
        ]),
      ]),
    );
  }

  Widget _btn({required IconData icon, required String label, required bool filled, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 50,
        decoration: filled
            ? BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(14))
            : BoxDecoration(
                color: NC.surfaceAlt,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: NC.line),
              ),
        alignment: Alignment.center,
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, color: filled ? Colors.white : NC.ink, size: 19),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(color: filled ? Colors.white : NC.ink, fontWeight: FontWeight.w800, fontSize: 15)),
        ]),
      ),
    );
  }
}

class _HelpCat {
  final IconData icon;
  final String label;
  const _HelpCat(this.icon, this.label);
}

class _Faq {
  final String q;
  final String a;
  const _Faq(this.q, this.a);
}
