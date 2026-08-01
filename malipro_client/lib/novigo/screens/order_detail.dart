import 'package:flutter/material.dart';

import '../data/env.dart';
import '../data/orders_api.dart';
import '../models.dart';
import '../ui/ui.dart';
import 'support.dart';
import 'tracking.dart';

/// Détail d'une commande — **trois sections**.
///
///   1. Où en est ma commande (commerce, référence, statut, progression).
///   2. Le détail (articles et totaux, dans une seule carte).
///   3. La livraison (adresse et paiement réellement enregistrés).
///
/// La version précédente empilait sept blocs, affichait le jeu de démonstration
/// pendant le chargement de la vraie commande, annonçait « NOVIGO Pay » même
/// pour une commande réglée en espèces, et proposait deux boutons qui ne
/// faisaient qu'ouvrir un message éphémère. Ici, chaque information affichée
/// vient de la commande, et l'unique action proposée fonctionne.
class OrderDetailScreen extends StatefulWidget {
  final String reference;
  final String storeName;
  final String status;

  /// Identifiant backend, présent dès que la carte vient d'une commande réelle.
  final String? orderId;

  const OrderDetailScreen({
    super.key,
    required this.reference,
    this.storeName = '',
    this.status = 'En cours',
    this.orderId,
  });

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

/// Étape du parcours d'une commande.
class _Step {
  final String label;
  final String detail;
  final IconData icon;
  const _Step(this.label, this.detail, this.icon);
}

const _steps = <_Step>[
  _Step('Confirmée', 'Le commerce a reçu votre commande.', Icons.receipt_long_rounded),
  _Step('En préparation', 'Votre commande est en cours de préparation.', Icons.restaurant_rounded),
  _Step('En route', 'Le coursier a récupéré votre commande.', Icons.delivery_dining_rounded),
  _Step('Livrée', 'Votre commande vous a été remise.', Icons.check_circle_rounded),
];

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  OrderDetailDto? _live;
  bool _loading = false;
  bool _failed = false;

  /// Vrai lorsque l'écran attend une commande réelle du backend.
  bool get _isLive => NovigoEnv.live && (widget.orderId?.isNotEmpty ?? false);

  String get reference => _live?.reference ?? widget.reference;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!_isLive) return;
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final detail = await fetchLiveOrder(widget.orderId!);
      if (!mounted) return;
      setState(() {
        _live = detail;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      // On le dit plutôt que de faire passer le jeu de démonstration pour la
      // vraie commande : l'utilisateur peut réessayer.
      setState(() {
        _loading = false;
        _failed = true;
      });
    }
  }

  // Articles de démonstration — utilisés uniquement hors mode live.
  static const List<_Line> _demoLines = [
    _Line('Poulet Yassa', 2, 3500),
    _Line('Riz au gras', 1, 2500),
    _Line('Jus de bissap', 3, 500),
  ];

  List<_Line> get _lines => _live == null
      ? _demoLines
      : _live!.items.map((i) => _Line(i.name, i.quantity, i.unitPrice)).toList();

  int get _subtotal => _live?.subtotal ?? _lines.fold(0, (s, l) => s + l.total);
  int get _delivery => _live?.deliveryFee ?? 500;
  int get _total => _live?.total ?? (_subtotal + _delivery);
  String? get _address => _live?.address ?? (_isLive ? null : 'Rue 250, porte 74 · Hamdallaye ACI');
  String? get _payment => _live?.paymentLabel ?? (_isLive ? null : 'Espèces à la livraison');

  /// Statut brut du backend quand il est connu, sinon le libellé reçu à l'ouverture.
  String get _statusCode => _live?.status ?? widget.status;
  String get _statusLabel => _live == null ? widget.status : _labelFor(_live!.status);

  bool get _cancelled {
    final s = _statusCode.toUpperCase();
    return s == 'CANCELLED' || s == 'REFUNDED' || s.startsWith('ANNUL');
  }

  static String _labelFor(String code) {
    switch (code.toUpperCase()) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmée';
      case 'PREPARING':
        return 'En préparation';
      case 'READY':
        return 'Prête';
      case 'ASSIGNED':
        return 'Coursier assigné';
      case 'IN_TRANSIT':
        return 'En route';
      case 'DELIVERED':
        return 'Livrée';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'Annulée';
      default:
        return code;
    }
  }

  /// Étape courante, dérivée du statut backend s'il est connu, sinon du libellé
  /// français affiché par la liste des commandes.
  int get _step {
    switch (_statusCode.toUpperCase()) {
      case 'PENDING':
      case 'CONFIRMED':
        return 0;
      case 'ACCEPTED':
      case 'PREPARING':
      case 'READY':
        return 1;
      case 'ASSIGNED':
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 2;
      case 'DELIVERED':
      case 'COMPLETED':
        return 3;
    }
    final s = _statusCode.toLowerCase();
    if (s.contains('livr') && s.contains('é')) return 3;
    if (s.contains('route') || s.contains('assign')) return 2;
    if (s.contains('prépar') || s.contains('prête')) return 1;
    return 0;
  }

  bool get _delivered => _step >= _steps.length - 1;

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final firstLoad = _loading && _live == null;

    return Scaffold(
      appBar: AppBar(title: const Text('Détail de la commande', style: T.h2)),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          onRefresh: _isLive ? _load : () async {},
          color: NC.brand,
          backgroundColor: NC.surface,
          child: NovigoContentWidth(
            child: ListView(
              padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xl),
              children: [
                if (_failed) NovigoOfflineBanner(onRetry: _load),

                // ───────── Section 1 · Où en est ma commande ─────────
                _JourneyCard(
                  storeName: widget.storeName,
                  reference: reference,
                  statusLabel: _statusLabel,
                  step: _step,
                  cancelled: _cancelled,
                  delivered: _delivered,
                ),

                // ───────── Section 2 · Le détail ─────────
                const SizedBox(height: Sp.section),
                const NovigoSectionHeader(overline: 'Commande', title: 'Le détail'),
                const SizedBox(height: Sp.md),
                if (firstLoad)
                  const _DetailSkeleton()
                else
                  NovigoCard(
                    child: Column(children: [
                      for (var i = 0; i < _lines.length; i++) ...[
                        if (i > 0) const Padding(
                          padding: EdgeInsets.symmetric(vertical: Sp.md),
                          child: NovigoDivider(),
                        ),
                        _LineRow(line: _lines[i]),
                      ],
                      if (_lines.isEmpty)
                        const Text('Aucun article enregistré sur cette commande.', style: T.muted),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: Sp.lg),
                        child: NovigoDivider(),
                      ),
                      _TotalRow(label: 'Sous-total', value: fcfa(_subtotal)),
                      const SizedBox(height: Sp.sm + 2),
                      _TotalRow(
                        label: 'Livraison',
                        value: _delivery == 0 ? 'Offerte' : fcfa(_delivery),
                        tone: _delivery == 0 ? NC.success : null,
                      ),
                      const SizedBox(height: Sp.md),
                      _TotalRow(label: 'Total', value: fcfa(_total), strong: true),
                    ]),
                  ),

                // ───────── Section 3 · La livraison ─────────
                if (_address != null || _payment != null) ...[
                  const SizedBox(height: Sp.section),
                  const NovigoSectionHeader(overline: 'Livraison', title: 'Adresse et paiement'),
                  const SizedBox(height: Sp.md),
                  NovigoTileGroup(children: [
                    if (_address != null)
                      NovigoTile(
                        icon: Icons.home_rounded,
                        label: 'Adresse de livraison',
                        subtitle: _address,
                      ),
                    if (_payment != null)
                      NovigoTile(
                        icon: Icons.account_balance_wallet_outlined,
                        label: 'Paiement',
                        subtitle: _payment,
                      ),
                  ]),
                ],

                // ───────── Action principale, une seule ─────────
                const SizedBox(height: Sp.xl),
                if (_delivered || _cancelled)
                  NovigoButton.secondary(
                    label: 'Besoin d\'aide ?',
                    icon: Icons.support_agent_rounded,
                    onPressed: () => Navigator.of(context)
                        .push(MaterialPageRoute(builder: (_) => const SupportScreen())),
                  )
                else
                  NovigoButton(
                    label: 'Suivre la commande',
                    icon: Icons.navigation_rounded,
                    onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => TrackingScreen(
                        storeName: widget.storeName.isEmpty ? 'Votre commande' : widget.storeName,
                        orderId: widget.orderId ?? '',
                        initialStatus: _live?.status ?? '',
                      ),
                    )),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Section 1 : l'essentiel de la commande et sa progression, dans une seule carte.
class _JourneyCard extends StatelessWidget {
  final String storeName;
  final String reference;
  final String statusLabel;
  final int step;
  final bool cancelled;
  final bool delivered;

  const _JourneyCard({
    required this.storeName,
    required this.reference,
    required this.statusLabel,
    required this.step,
    required this.cancelled,
    required this.delivered,
  });

  @override
  Widget build(BuildContext context) {
    final tone = cancelled ? NC.error : (delivered ? NC.success : NC.brand);
    return NovigoCard(
      padding: EdgeInsets.zero,
      radius: R.xl,
      clipBehavior: Clip.antiAlias,
      child: Column(children: [
        Container(
          padding: const EdgeInsets.all(Sp.lg + 2),
          decoration: const BoxDecoration(gradient: NC.premiumGradient),
          child: Row(children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.local_shipping_outlined, color: Colors.white),
            ),
            const SizedBox(width: Sp.md + 2),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(
                  storeName.isEmpty ? 'Votre commande' : storeName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 17),
                ),
                const SizedBox(height: 3),
                Text(reference,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white70, fontSize: 13)),
              ]),
            ),
            const SizedBox(width: Sp.sm),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: Sp.sm - 2),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(R.pill),
              ),
              child: Text(statusLabel,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12.5)),
            ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(Sp.lg),
          child: cancelled
              // Une commande annulée n'a pas de progression : afficher un rail à
              // moitié rempli laisserait croire qu'elle suit son cours.
              ? const Row(children: [
                  Icon(Icons.cancel_outlined, size: 19, color: NC.error),
                  SizedBox(width: Sp.sm + 2),
                  Expanded(
                    child: Text('Cette commande a été annulée.', style: T.muted),
                  ),
                ])
              : Column(children: [
                  NovigoProgressRail(step: step, total: _steps.length, tone: tone),
                  const SizedBox(height: Sp.md + 2),
                  NovigoStepCaption(
                    icon: _steps[step].icon,
                    title: _steps[step].label,
                    detail: _steps[step].detail,
                    tone: tone,
                  ),
                ]),
        ),
      ]),
    );
  }
}

/// Une ligne d'article : quantité, libellé, montant.
class _LineRow extends StatelessWidget {
  final _Line line;
  const _LineRow({required this.line});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(9)),
        alignment: Alignment.center,
        child: Text('${line.qty}',
            style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 13)),
      ),
      const SizedBox(width: Sp.md),
      Expanded(child: Text(line.name, style: T.body)),
      const SizedBox(width: Sp.sm),
      // Un montant ne se tronque pas : à l'étroit, il se réduit légèrement
      // plutôt que de perdre ses derniers chiffres.
      Flexible(
        child: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerRight,
          child: Text(fcfa(line.total), style: T.price),
        ),
      ),
    ]);
  }
}

class _TotalRow extends StatelessWidget {
  final String label;
  final String value;
  final bool strong;
  final Color? tone;

  const _TotalRow({required this.label, required this.value, this.strong = false, this.tone});

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      // Le libellé cède la place au montant : c'est le chiffre que l'on vient
      // lire, et lui seul doit rester intact quelle que soit la taille de police.
      Expanded(child: Text(label, style: strong ? T.title : T.muted)),
      const SizedBox(width: Sp.md),
      Flexible(
        child: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerRight,
          child: Text(
            value,
            style: strong
                ? const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 17)
                : TextStyle(color: tone ?? NC.ink, fontWeight: FontWeight.w700),
          ),
        ),
      ),
    ]);
  }
}

/// Squelette du bloc « détail » : même gabarit que la carte réelle, pour que le
/// contenu ne fasse pas sauter la page en arrivant.
class _DetailSkeleton extends StatelessWidget {
  const _DetailSkeleton();

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      child: Column(children: [
        for (var i = 0; i < 3; i++) ...[
          if (i > 0) const SizedBox(height: Sp.lg),
          const Row(children: [
            NovigoSkeleton(width: 30, height: 30, radius: 9),
            SizedBox(width: Sp.md),
            Expanded(child: NovigoSkeleton(height: 13, radius: 6)),
            SizedBox(width: Sp.xl),
            NovigoSkeleton(width: 60, height: 13, radius: 6),
          ]),
        ],
        const Padding(padding: EdgeInsets.symmetric(vertical: Sp.lg), child: NovigoDivider()),
        const Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          NovigoSkeleton(width: 70, height: 13, radius: 6),
          NovigoSkeleton(width: 80, height: 15, radius: 6),
        ]),
      ]),
    );
  }
}

class _Line {
  final String name;
  final int qty;
  final int price;
  const _Line(this.name, this.qty, this.price);
  int get total => qty * price;
}
