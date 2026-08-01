import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../data/coupons_api.dart';
import '../data/env.dart';
import '../ui/ui.dart';
import '../widgets.dart' show Pill;

/// Ticket de coupon prêt à afficher (démonstration ou live, même rendu).
class _CouponVM {
  final String code, title, conditions, expiry;
  final Color accent;
  final IconData icon;
  const _CouponVM(this.code, this.title, this.conditions, this.expiry, this.accent, this.icon);

  factory _CouponVM.fromLive(CouponDto c, int index) {
    const accents = [NC.brand, NC.success, NC.gold];
    return _CouponVM(
      c.code,
      c.label,
      c.conditions,
      c.expiry,
      c.freeDelivery ? NC.success : accents[index % accents.length],
      c.freeDelivery ? Icons.pedal_bike_rounded : Icons.percent_rounded,
    );
  }
}

const _demoCoupons = <_CouponVM>[
  _CouponVM('MALI10', '-10% sur votre commande', 'Dès 5 000 FCFA · Restaurants & marché',
      'Expire le 31 juil.', NC.brand, Icons.percent_rounded),
  _CouponVM('LIVRAISON0', 'Livraison offerte', 'Toute commande · Bamako intra-muros',
      'Expire le 20 juil.', NC.success, Icons.pedal_bike_rounded),
  _CouponVM('WEEKEND15', '-15% le week-end', 'Samedi & dimanche · Dès 8 000 FCFA',
      'Expire le 28 juil.', NC.gold, Icons.weekend_rounded),
];

/// Coupons — **deux sections** : saisir un code, utiliser ceux que l'on a.
///
/// En mode live, la liste vient du backend finance. Elle ne retombe plus en
/// silence sur le jeu de démonstration quand le compte n'a aucun coupon : un
/// portefeuille vide s'affiche vide. « Utiliser » copie réellement le code, pour
/// qu'il puisse être collé au moment de payer.
class CouponsScreen extends StatefulWidget {
  const CouponsScreen({super.key});

  @override
  State<CouponsScreen> createState() => _CouponsScreenState();
}

class _CouponsScreenState extends State<CouponsScreen> {
  late List<_CouponVM> _active = NovigoEnv.live ? const [] : _demoCoupons;
  bool _loading = false;
  bool _failed = false;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    if (NovigoEnv.live) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final coupons = await couponsApi.fetchActive();
      if (!mounted) return;
      setState(() {
        _active = [for (var i = 0; i < coupons.length; i++) _CouponVM.fromLive(coupons[i], i)];
        _loaded = true;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _failed = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final firstLoad = _loading && !_loaded;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Coupons', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          onRefresh: NovigoEnv.live ? _load : () async {},
          color: NC.brand,
          backgroundColor: NC.surface,
          child: NovigoContentWidth(
            child: ListView(
              padding: EdgeInsets.fromLTRB(gutter, Sp.md, gutter, Sp.xl),
              children: [
                if (_failed) NovigoOfflineBanner(onRetry: _load),

                // ───────── Section 1 · Saisir un code ─────────
                NovigoCard(
                  gradient: NC.premiumGradient,
                  radius: R.xl,
                  padding: const EdgeInsets.all(Sp.lg + 2),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.16),
                            borderRadius: BorderRadius.circular(14)),
                        child: const Icon(Icons.local_offer_rounded, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: Sp.md),
                      const Expanded(
                        child: Text('Vous avez un code promo ?',
                            style: TextStyle(
                                color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                      ),
                    ]),
                    const SizedBox(height: Sp.md + 2),
                    const _PromoField(),
                  ]),
                ),

                // ───────── Section 2 · Mes coupons ─────────
                const SizedBox(height: Sp.section),
                NovigoSectionHeader(
                  overline: 'Portefeuille',
                  title: 'Coupons actifs',
                  subtitle: firstLoad
                      ? null
                      : '${_active.length} coupon${_active.length > 1 ? 's' : ''} utilisable${_active.length > 1 ? 's' : ''}',
                ),
                const SizedBox(height: Sp.md),
                if (firstLoad)
                  for (var i = 0; i < 2; i++) ...[
                    if (i > 0) const SizedBox(height: Sp.md),
                    const NovigoSkeleton(height: 118, radius: R.lg),
                  ]
                else if (_active.isEmpty)
                  const NovigoEmptyState.empty(
                    icon: Icons.local_offer_outlined,
                    title: 'Aucun coupon',
                    message: 'Vos codes promotionnels apparaîtront ici dès qu\'ils vous seront attribués.',
                  )
                else
                  for (var i = 0; i < _active.length; i++) ...[
                    if (i > 0) const SizedBox(height: Sp.md + 2),
                    FadeSlideIn(index: i, child: _CouponTicket(coupon: _active[i])),
                  ],

                // La section « Expirés » n'existe pas côté backend : démo seule.
                if (!NovigoEnv.live) ...[
                  const SizedBox(height: Sp.section),
                  const NovigoSectionHeader(overline: 'Historique', title: 'Expirés'),
                  const SizedBox(height: Sp.md),
                  const _ExpiredTicket(
                      code: 'BIENVENUE20',
                      title: '-20% première commande',
                      expiry: 'Expiré le 30 juin'),
                  const SizedBox(height: Sp.md),
                  const _ExpiredTicket(
                      code: 'RAMADAN', title: 'Livraison offerte', expiry: 'Expiré le 09 avr.'),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Champ « Entrer un code promo ». En live, valide réellement le code.
class _PromoField extends StatefulWidget {
  const _PromoField();

  @override
  State<_PromoField> createState() => _PromoFieldState();
}

class _PromoFieldState extends State<_PromoField> {
  final _ctrl = TextEditingController();
  bool _checking = false;

  @override
  void initState() {
    super.initState();
    _ctrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _apply() async {
    final code = _ctrl.text.trim();
    if (code.isEmpty) return;
    FocusScope.of(context).unfocus();
    if (!NovigoEnv.live) {
      _toast('Code « $code » appliqué');
      return;
    }
    setState(() => _checking = true);
    try {
      final coupon = await couponsApi.validate(code);
      if (!mounted) return;
      _toast(coupon != null
          ? 'Code « ${coupon.code} » valide · ${coupon.label}'
          : 'Code « $code » invalide ou expiré');
    } catch (_) {
      if (mounted) _toast('Vérification impossible, réessayez');
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  void _toast(String msg) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: NC.surfaceAlt,
      behavior: SnackBarBehavior.floating,
    ));

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(
        child: Container(
          decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14)),
          child: TextField(
            controller: _ctrl,
            textCapitalization: TextCapitalization.characters,
            textInputAction: TextInputAction.done,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w700, letterSpacing: 1),
            decoration: const InputDecoration(
              hintText: 'Entrer un code promo',
              hintStyle: TextStyle(
                  color: Colors.white54, fontWeight: FontWeight.w500, letterSpacing: 0),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: Sp.md + 2, vertical: 15),
              prefixIcon:
                  Icon(Icons.confirmation_number_outlined, color: Colors.white70, size: 20),
            ),
            onSubmitted: (_) => _apply(),
          ),
        ),
      ),
      const SizedBox(width: Sp.md - 2),
      NovigoButton.secondary(
        label: 'Appliquer',
        size: NovigoButtonSize.medium,
        expand: false,
        loading: _checking,
        onPressed: _ctrl.text.trim().isEmpty ? null : _apply,
      ),
    ]);
  }
}

/// Ticket de coupon actif (bord cranté via encoches latérales).
class _CouponTicket extends StatelessWidget {
  final _CouponVM coupon;
  const _CouponTicket({required this.coupon});

  Future<void> _use(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: coupon.code));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('Code « ${coupon.code} » copié — collez-le au moment de payer'),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) {
    final c = coupon;
    return NovigoCard(
      padding: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      semanticLabel: '${c.title}, code ${c.code}, ${c.conditions}, ${c.expiry}',
      child: IntrinsicHeight(
        child: Row(children: [
          Container(
            width: 74,
            decoration: BoxDecoration(color: c.accent.withValues(alpha: 0.16)),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(c.icon, color: c.accent, size: 26),
              const SizedBox(height: Sp.xs + 2),
              Text(c.code.length > 8 ? '${c.code.substring(0, 7)}…' : c.code,
                  style: TextStyle(color: c.accent, fontWeight: FontWeight.w800, fontSize: 10.5)),
            ]),
          ),
          const _Notches(),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(Sp.md + 2),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(
                    child: Text(c.title, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                  const SizedBox(width: Sp.sm),
                  Flexible(
                    child: Pill(c.code, color: c.accent, bg: c.accent.withValues(alpha: 0.16)),
                  ),
                ]),
                const SizedBox(height: Sp.xs + 2),
                Text(c.conditions, style: T.muted, maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: Sp.md),
                Row(children: [
                  const Icon(Icons.schedule_rounded, size: 14, color: NC.faint),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(c.expiry,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(width: Sp.sm),
                  NovigoButton(
                    label: 'Utiliser',
                    size: NovigoButtonSize.small,
                    expand: false,
                    onPressed: () => _use(context),
                  ),
                ]),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}

/// Petites encoches verticales pour l'effet ticket déchirable.
class _Notches extends StatelessWidget {
  const _Notches();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 12,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(
          7,
          (_) => Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(color: NC.shell, shape: BoxShape.circle),
          ),
        ),
      ),
    );
  }
}

/// Ticket expiré (grisé, non cliquable).
class _ExpiredTicket extends StatelessWidget {
  final String code, title, expiry;
  const _ExpiredTicket({required this.code, required this.title, required this.expiry});

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: 0.5,
      child: NovigoCard(
        radius: R.md,
        padding: const EdgeInsets.all(Sp.md + 2),
        child: Row(children: [
          Container(
            width: 42,
            height: 42,
            decoration:
                BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.local_offer_outlined, color: NC.faint, size: 20),
          ),
          const SizedBox(width: Sp.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
              Text('$code · $expiry', style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ),
          const SizedBox(width: Sp.sm),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: Sp.xs + 2),
            decoration:
                BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(R.pill)),
            child: const Text('Expiré',
                style: TextStyle(color: NC.faint, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ]),
      ),
    );
  }
}
