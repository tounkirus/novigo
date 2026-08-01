import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../ui/ui.dart';
import 'chat.dart';

/// Rubrique d'aide.
enum _Topic { commandes, paiement, compte, livraison }

extension _TopicLabel on _Topic {
  String get label => switch (this) {
        _Topic.commandes => 'Commandes',
        _Topic.paiement => 'Paiement',
        _Topic.compte => 'Compte',
        _Topic.livraison => 'Livraison',
      };
}

class _Faq {
  final String question;
  final String answer;
  final _Topic topic;
  const _Faq(this.question, this.answer, this.topic);
}

const _faqs = <_Faq>[
  _Faq(
    'Comment suivre ma commande ?',
    'Rendez-vous dans l\'onglet « Commandes », ouvrez la commande en cours puis appuyez sur '
        '« Suivre la commande » pour voir la progression en temps réel.',
    _Topic.commandes,
  ),
  _Faq(
    'Puis-je annuler une commande ?',
    'Une commande peut être annulée gratuitement tant qu\'elle n\'a pas été acceptée par le '
        'commerçant. Passé ce délai, contactez le support pour étudier votre demande.',
    _Topic.commandes,
  ),
  _Faq(
    'Que faire si un article manque ?',
    'Signalez-le depuis le détail de la commande dans les 24 h. Notre équipe procède au '
        'remboursement de l\'article manquant sur votre solde NOVIGO Pay.',
    _Topic.commandes,
  ),
  _Faq(
    'Quels moyens de paiement acceptez-vous ?',
    'NOVIGO accepte NOVIGO Pay, Orange Money, Wave, les cartes bancaires ainsi que le paiement '
        'en espèces à la livraison.',
    _Topic.paiement,
  ),
  _Faq(
    'Comment recharger mon compte NOVIGO Pay ?',
    'Depuis l\'onglet Wallet, appuyez sur « Recharger », choisissez le montant puis votre moyen '
        'de paiement mobile. Le solde est crédité immédiatement.',
    _Topic.paiement,
  ),
  _Faq(
    'Comment changer mon numéro de téléphone ?',
    'Le numéro sert d\'identifiant de connexion. Contactez le support depuis cet écran : nous '
        'vérifions votre identité avant de le remplacer.',
    _Topic.compte,
  ),
  _Faq(
    'Combien de temps prend la livraison ?',
    'Le délai estimé s\'affiche sur chaque commerce avant la commande. En moyenne, une livraison '
        'à Bamako prend entre 20 et 40 minutes selon la distance et l\'affluence.',
    _Topic.livraison,
  ),
  _Faq(
    'Comment sont calculés les frais de livraison ?',
    'Les frais dépendent du commerce et de la distance ; ils sont annoncés avant la validation '
        'de la commande et n\'évoluent plus ensuite.',
    _Topic.livraison,
  ),
];

const _supportPhone = '+223 20 00 00 00';

/// Aide & support — **trois sections** : chercher, parcourir, contacter.
///
/// La recherche et les quatre rubriques ouvraient un message éphémère sans rien
/// filtrer. Elles filtrent désormais réellement la foire aux questions, et le
/// bouton « Chat » ouvre la messagerie du support au lieu d'annoncer qu'il
/// l'ouvre.
class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _query = TextEditingController();
  String _term = '';
  _Topic? _topic;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  List<_Faq> get _visible {
    final q = _term.trim().toLowerCase();
    return [
      for (final f in _faqs)
        if ((_topic == null || f.topic == _topic) &&
            (q.isEmpty ||
                f.question.toLowerCase().contains(q) ||
                f.answer.toLowerCase().contains(q)))
          f,
    ];
  }

  void _openChat() => Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => const ChatThreadScreen(title: 'Support NOVIGO')));

  Future<void> _showPhone() async {
    await showNovigoSheet<void>(
      context,
      builder: (sheetContext) => NovigoBottomSheet(
        title: 'Appeler le support',
        subtitle: 'Tous les jours de 8 h à 22 h.',
        footer: NovigoButton.secondary(
          label: 'Copier le numéro',
          icon: Icons.copy_rounded,
          onPressed: () async {
            await Clipboard.setData(const ClipboardData(text: _supportPhone));
            if (!sheetContext.mounted) return;
            Navigator.pop(sheetContext);
            if (!mounted) return;
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(const SnackBar(
                content: Text('Numéro copié'),
                backgroundColor: NC.surfaceAlt,
                behavior: SnackBarBehavior.floating,
              ));
          },
        ),
        child: const Text(_supportPhone,
            style: TextStyle(
                color: NC.ink, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final faqs = _visible;

    return Scaffold(
      appBar: AppBar(title: const Text('Aide & support', style: T.h2)),
      body: SafeArea(
        top: false,
        child: NovigoContentWidth(
          child: ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xxl),
            children: [
              // ───────── Section 1 · Chercher ─────────
              NovigoCard(
                gradient: NC.premiumGradient,
                radius: 22,
                padding: const EdgeInsets.all(Sp.gutter),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Comment pouvons-nous aider ?',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 22,
                          height: 1.15)),
                  const SizedBox(height: Sp.xs + 2),
                  const Text('Trouvez une réponse ou contactez notre équipe.',
                      style: TextStyle(color: Colors.white70, fontSize: 13.5)),
                  const SizedBox(height: Sp.lg),
                  NovigoSearchBar.field(
                    hint: 'Rechercher une question…',
                    controller: _query,
                    autofocus: false,
                    onChanged: (v) => setState(() => _term = v),
                  ),
                ]),
              ),

              // ───────── Section 2 · Parcourir ─────────
              const SizedBox(height: Sp.section),
              const NovigoSectionHeader(overline: 'Aide', title: 'Questions fréquentes'),
              const SizedBox(height: Sp.md),
              NovigoChipRail(
                labels: ['Tout', for (final t in _Topic.values) t.label],
                selectedIndex: _topic == null ? 0 : _Topic.values.indexOf(_topic!) + 1,
                onSelected: (i) =>
                    setState(() => _topic = i == 0 ? null : _Topic.values[i - 1]),
                padding: EdgeInsets.zero,
              ),
              const SizedBox(height: Sp.md),
              if (faqs.isEmpty)
                NovigoEmptyState.empty(
                  icon: Icons.help_outline_rounded,
                  title: 'Aucune réponse trouvée',
                  message: 'Reformulez votre question, ou écrivez directement au support.',
                  actionLabel: 'Écrire au support',
                  onAction: _openChat,
                )
              else
                NovigoCard(
                  padding: EdgeInsets.zero,
                  clipBehavior: Clip.antiAlias,
                  child: Column(children: [
                    for (var i = 0; i < faqs.length; i++) ...[
                      if (i > 0) const NovigoDivider(),
                      _FaqTile(faq: faqs[i]),
                    ],
                  ]),
                ),

              // ───────── Section 3 · Contacter ─────────
              const SizedBox(height: Sp.section),
              NovigoCard(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration:
                          BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(14)),
                      child: const Icon(Icons.headset_mic_outlined, color: NC.brand),
                    ),
                    const SizedBox(width: Sp.md + 2),
                    const Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Contacter le support', style: T.title),
                        SizedBox(height: 3),
                        Text('Disponible 7j/7 de 8 h à 22 h', style: T.muted),
                      ]),
                    ),
                  ]),
                  const SizedBox(height: Sp.lg),
                  Row(children: [
                    Expanded(
                      child: NovigoButton(
                        label: 'Chat',
                        icon: Icons.chat_bubble_outline_rounded,
                        size: NovigoButtonSize.medium,
                        onPressed: _openChat,
                      ),
                    ),
                    const SizedBox(width: Sp.md),
                    Expanded(
                      child: NovigoButton.secondary(
                        label: 'Téléphone',
                        icon: Icons.call_outlined,
                        size: NovigoButtonSize.medium,
                        onPressed: _showPhone,
                      ),
                    ),
                  ]),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FaqTile extends StatelessWidget {
  final _Faq faq;
  const _FaqTile({required this.faq});

  @override
  Widget build(BuildContext context) {
    return Material(
      // `ExpansionTile` peint son fond et son onde tactile sur le `Material` le
      // plus proche : sans celui-ci, la carte colorée les masque — Flutter le
      // signale par une assertion en mode debug.
      type: MaterialType.transparency,
      child: Theme(
        // `ExpansionTile` trace ses propres filets ; ils feraient doublon avec le
        // séparateur du groupe.
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          iconColor: NC.brand,
          collapsedIconColor: NC.muted,
          tilePadding: const EdgeInsets.symmetric(horizontal: Sp.lg),
          childrenPadding: const EdgeInsets.fromLTRB(Sp.lg, 0, Sp.lg, Sp.lg),
          title: Text(faq.question,
              style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 14.5)),
          children: [
            Align(alignment: Alignment.centerLeft, child: Text(faq.answer, style: T.muted)),
          ],
        ),
      ),
    );
  }
}
