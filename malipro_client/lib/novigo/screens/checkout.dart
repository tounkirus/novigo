import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';

import '../brain_widgets.dart';
import '../cart.dart';
import '../data/brain_api.dart';
import '../data/env.dart';
import '../data/orders_api.dart';
import '../models.dart';
import '../ui/ui.dart';
import 'tracking.dart';

/// Validation de commande — trois sections : où et quand, comment je paie,
/// combien je paie.
class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  int _pay = 0;

  /// Décision du Brain (tarif de livraison + délai + raisons). Null tant qu'elle
  /// n'est pas revenue ; hors ligne, on affiche une estimation locale annoncée
  /// comme telle — l'app ne calcule jamais un tarif à la place du Brain.
  BrainQuote? _quote;
  bool _loadingQuote = false;

  /// Empêche le double envoi : sans retour visuel, un appui qui ne répond pas
  /// dans la seconde est systématiquement répété par l'utilisateur.
  bool _placing = false;

  @override
  void initState() {
    super.initState();
    _askBrain();
  }

  Future<void> _askBrain() async {
    final store = cart.store;
    if (!NovigoEnv.live) {
      setState(() => _quote = BrainQuote.offline(
            deliveryFee: cart.deliveryFee,
            etaMinutes: store?.etaMin ?? 30,
          ));
      return;
    }
    setState(() => _loadingQuote = true);
    try {
      final quote = await fetchBrainQuote(
        orderType: _brainOrderType(store?.kind ?? 'repas'),
        storeId: store?.id,
        zone: store?.district,
        subtotal: cart.subtotal,
        itemsCount: cart.lines.length,
      );
      if (!mounted) return;
      setState(() {
        _quote = quote ??
            BrainQuote.offline(deliveryFee: cart.deliveryFee, etaMinutes: store?.etaMin ?? 30);
        _loadingQuote = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _quote = BrainQuote.offline(deliveryFee: cart.deliveryFee, etaMinutes: store?.etaMin ?? 30);
        _loadingQuote = false;
      });
    }
  }

  /// Type de commande ops correspondant au rayon (le Brain en déduit le métier).
  static String _brainOrderType(String kind) {
    switch (kind) {
      case 'supermarche':
      case 'boulangerie':
        return 'GROCERY';
      case 'marche':
        return 'MARKETPLACE';
      case 'pharmacie':
        return 'PHARMACY';
      default:
        return 'FOOD';
    }
  }

  /// Frais retenus : ceux décidés par le Brain dès qu'il a répondu.
  int get _deliveryFee => _quote?.amount ?? cart.deliveryFee;
  int get _total => cart.subtotal + _deliveryFee;
  int get _eta => _quote?.etaMinutes ?? cart.store?.etaMin ?? 30;

  static const _payments = [
    ['Orange Money', Icons.smartphone, Color(0xFFFF7900)],
    ['Wave', Icons.account_balance_wallet, Color(0xFF1DC8F2)],
    ['Espèces à la livraison', Icons.payments_outlined, NC.success],
  ];

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Commander', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: NovigoContentWidth(
        child: ListView(
          padding: EdgeInsets.fromLTRB(gutter, Sp.lg, gutter, Sp.lg),
          children: [
            // ───── Section 1 · Où et quand ─────
            _infoCard(
              icon: Icons.location_on_outlined,
              title: 'Adresse de livraison',
              child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Domicile · Hamdallaye ACI', style: T.body),
                SizedBox(height: Sp.xs),
                Text('Rue 250, porte 74 · Bamako', style: T.muted),
              ]),
            ),
            const SizedBox(height: Sp.md + 2),
            _infoCard(
              icon: Icons.access_time_rounded,
              title: 'Livraison estimée',
              child: _loadingQuote
                  ? const Padding(
                      padding: EdgeInsets.only(top: Sp.xs),
                      child: NovigoSkeleton(width: 180, height: 14, radius: 6),
                    )
                  : Text('$_eta min · par coursier NOVIGO', style: T.body),
            ),
            if (_quote != null) ...[
              const SizedBox(height: Sp.md + 2),
              BrainDecisionCard(quote: _quote!),
            ],

            // ───── Section 2 · Paiement ─────
            const SizedBox(height: Sp.section),
            const NovigoSectionHeader(overline: 'Règlement', title: 'Comment payez-vous ?'),
            const SizedBox(height: Sp.md + 2),
            for (var i = 0; i < _payments.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: Sp.sm + 2),
                child: _PaymentOption(
                  label: _payments[i][0] as String,
                  icon: _payments[i][1] as IconData,
                  tone: _payments[i][2] as Color,
                  selected: i == _pay,
                  onTap: () => setState(() => _pay = i),
                ),
              ),

            // ───── Section 3 · Total ─────
            const SizedBox(height: Sp.lg),
            _totals(),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(gutter, 0, gutter, Sp.md),
          child: NovigoButton(
            label: 'Confirmer la commande',
            trailingLabel: fcfa(_total),
            loading: _placing,
            onPressed: cart.lines.isEmpty ? null : () => _confirm(context),
          ),
        ),
      ),
    );
  }

  Widget _infoCard({required IconData icon, required String title, required Widget child}) =>
      NovigoCard(
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: NC.brand, size: 20),
          ),
          const SizedBox(width: Sp.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title,
                  style: const TextStyle(
                      color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
              const SizedBox(height: Sp.xs),
              child,
            ]),
          ),
        ]),
      );

  Widget _totals() => NovigoCard(
        child: Column(children: [
          _row('Sous-total', fcfa(cart.subtotal)),
          const SizedBox(height: Sp.sm + 1),
          _row('Livraison', _deliveryFee == 0 ? 'Offerte' : fcfa(_deliveryFee),
              valueColor: _deliveryFee == 0 ? NC.success : null),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: Sp.md),
            child: NovigoDivider(),
          ),
          _row('Total', fcfa(_total), bold: true),
        ]),
      );

  Widget _row(String l, String v, {bool bold = false, Color? valueColor}) =>
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Flexible(
          child: Text(l,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  color: bold ? NC.ink : NC.muted,
                  fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
                  fontSize: bold ? 16 : 14)),
        ),
        const SizedBox(width: Sp.md),
        Text(v,
            style: TextStyle(
                color: valueColor ?? NC.ink,
                fontWeight: FontWeight.w800,
                fontSize: bold ? 18 : 14,
                fontFeatures: const [FontFeature.tabularFigures()])),
      ]);

  Future<void> _confirm(BuildContext context) async {
    if (_placing) return;
    final storeName = cart.store?.name ?? '';
    final eta = _eta; // délai décidé par le Brain (ou estimation hors ligne)
    String orderId = '';
    String reference = '';

    setState(() => _placing = true);
    try {
      // Mode live : place réellement la commande sur le backend via le Gateway.
      if (NovigoEnv.live && cart.lines.isNotEmpty) {
        try {
          // Garde-fou en plus des délais de Dio : une socket ouverte mais muette
          // laisserait sinon le bouton tourner indéfiniment.
          final placed = await placeLiveOrder(cart, payIndex: _pay)
              .timeout(const Duration(seconds: 12));
          orderId = placed.id;
          reference = placed.reference;
        } catch (_) {
          if (!context.mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Backend indisponible — commande enregistrée en mode démo'),
            duration: Duration(seconds: 2),
          ));
        }
      }
      if (!context.mounted) return;
      cart.clear();
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => _OrderPlaced(
              storeName: storeName, eta: eta, orderId: orderId, reference: reference),
        ),
        (r) => r.isFirst,
      );
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }
}

class _PaymentOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color tone;
  final bool selected;
  final VoidCallback onTap;

  const _PaymentOption({
    required this.label,
    required this.icon,
    required this.tone,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: NovigoCard(
        onTap: onTap,
        radius: R.md,
        padding: const EdgeInsets.all(Sp.md + 2),
        border: Border.all(color: selected ? NC.brand : NC.line, width: selected ? 2 : 1),
        child: Row(children: [
          Icon(icon, color: tone),
          const SizedBox(width: Sp.md),
          Expanded(child: Text(label, style: T.body)),
          Icon(selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: selected ? NC.brand : NC.faint),
        ]),
      ),
    );
  }
}

/// Confirmation de commande.
class _OrderPlaced extends StatelessWidget {
  final String storeName;
  final int eta;
  final String orderId;
  final String reference;

  const _OrderPlaced({
    required this.storeName,
    required this.eta,
    this.orderId = '',
    this.reference = '',
  });

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(gutter + 4),
          child: Column(children: [
            const Spacer(),
            _SuccessMark(),
            const SizedBox(height: Sp.xl - 4),
            const Text('Commande confirmée !', style: T.h1, textAlign: TextAlign.center),
            const SizedBox(height: Sp.sm + 2),
            Text(
              reference.isNotEmpty
                  ? 'Commande $reference\n$storeName prépare votre commande.\nLivraison estimée dans $eta min.'
                  : '$storeName prépare votre commande.\nLivraison estimée dans $eta min.',
              style: T.muted,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Sp.xl),
            NovigoCard(
              radius: 18,
              child: Row(children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration:
                      BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.pedal_bike, color: NC.brand),
                ),
                const SizedBox(width: Sp.md),
                const Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Coursier en route', style: T.body),
                    Text('Vous serez notifié à chaque étape', style: T.muted),
                  ]),
                ),
              ]),
            ),
            const Spacer(),
            NovigoButton(
              label: 'Suivre ma commande',
              icon: Icons.navigation_rounded,
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) =>
                      TrackingScreen(storeName: storeName, eta: eta, orderId: orderId))),
            ),
            const SizedBox(height: Sp.sm),
            TextButton(
              onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
              child: const Text('Retour à l’accueil',
                  style: TextStyle(color: NC.muted, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
      ),
    );
  }
}

/// Coche de succès qui se pose en fondu — un instant de confirmation, pas une
/// animation qui retient l'utilisateur.
class _SuccessMark extends StatefulWidget {
  @override
  State<_SuccessMark> createState() => _SuccessMarkState();
}

class _SuccessMarkState extends State<_SuccessMark> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: M.base)..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: CurvedAnimation(parent: _c, curve: M.spring),
      child: Container(
        width: 96,
        height: 96,
        decoration: BoxDecoration(color: NC.successSoft, shape: BoxShape.circle),
        child: const Icon(Icons.check_rounded, color: NC.success, size: 52),
      ),
    );
  }
}
