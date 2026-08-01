import 'package:flutter/material.dart';
import '../theme.dart';
import '../widgets.dart';
import '../data/env.dart';
import '../data/coupons_api.dart';

/// Ticket de coupon prêt à afficher (mock ou live, même rendu).
class _CouponVM {
  final String code, title, conditions, expiry;
  final Color accent;
  final IconData icon;
  const _CouponVM(this.code, this.title, this.conditions, this.expiry, this.accent, this.icon);

  /// Construit un ticket depuis un coupon live, avec accent/icône dérivés.
  factory _CouponVM.fromLive(CouponDto c, int index) {
    final accents = [NC.brand, NC.success, NC.gold];
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

/// Écran « Coupons & codes promo » — saisie d'un code + tickets actifs / expirés.
/// En mode live, liste les coupons réels du backend finance (repli mock si échec/vide).
class CouponsScreen extends StatefulWidget {
  const CouponsScreen({super.key});

  @override
  State<CouponsScreen> createState() => _CouponsScreenState();

  static const List<_CouponVM> _mockActive = [
    _CouponVM('MALI10', '-10% sur votre commande', 'Dès 5 000 FCFA · Restaurants & marché',
        'Expire le 31 juil.', NC.brand, Icons.percent_rounded),
    _CouponVM('LIVRAISON0', 'Livraison offerte', 'Toute commande · Bamako intra-muros',
        'Expire le 20 juil.', NC.success, Icons.pedal_bike_rounded),
    _CouponVM('WEEKEND15', '-15% le week-end', 'Samedi & dimanche · Dès 8 000 FCFA',
        'Expire le 28 juil.', NC.gold, Icons.weekend_rounded),
  ];
}

class _CouponsScreenState extends State<CouponsScreen> {
  List<_CouponVM> _active = CouponsScreen._mockActive;
  bool _live = false;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (NovigoEnv.live) _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final coupons = await couponsApi.fetchActive();
      if (!mounted) return;
      if (coupons.isNotEmpty) {
        setState(() {
          _live = true;
          _active = [
            for (int i = 0; i < coupons.length; i++) _CouponVM.fromLive(coupons[i], i)
          ];
        });
      }
    } catch (_) {
      // repli silencieux : coupons mock premium
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Coupons', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Bandeau saisie code promo
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(24)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.local_offer_rounded, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text('Vous avez un code promo ?',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ]),
            const SizedBox(height: 14),
            const _PromoField(live: NovigoEnv.live),
          ]),
        ),
        const SizedBox(height: 24),
        Row(children: [
          const Text('Coupons actifs', style: T.h2),
          if (_loading) ...[
            const SizedBox(width: 10),
            const SizedBox(
                width: 15, height: 15, child: CircularProgressIndicator(strokeWidth: 2, color: NC.brand)),
          ],
        ]),
        const SizedBox(height: 12),
        for (final c in _active)
          _CouponTicket(
            code: c.code,
            title: c.title,
            conditions: c.conditions,
            expiry: c.expiry,
            accent: c.accent,
            icon: c.icon,
          ),
        // La section « Expirés » n'existe pas côté backend : réservée au mock.
        if (!_live) ...[
          const SizedBox(height: 24),
          const Text('Expirés', style: T.h2),
          const SizedBox(height: 12),
          const _ExpiredTicket(code: 'BIENVENUE20', title: '-20% première commande', expiry: 'Expiré le 30 juin'),
          const _ExpiredTicket(code: 'RAMADAN', title: 'Livraison offerte', expiry: 'Expiré le 09 avr.'),
        ],
        const SizedBox(height: 8),
      ]),
    );
  }
}

/// Champ « Entrer un code promo » + bouton Appliquer.
/// En live, valide réellement le code via le backend finance.
class _PromoField extends StatefulWidget {
  final bool live;
  const _PromoField({this.live = false});

  @override
  State<_PromoField> createState() => _PromoFieldState();
}

class _PromoFieldState extends State<_PromoField> {
  final _ctrl = TextEditingController();
  bool _checking = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _apply() async {
    final code = _ctrl.text.trim();
    FocusScope.of(context).unfocus();
    if (code.isEmpty) {
      _toast('Entrez un code promo');
      return;
    }
    if (!widget.live) {
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

  void _toast(String msg) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
      );

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(
        child: Container(
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(14)),
          child: TextField(
            controller: _ctrl,
            textCapitalization: TextCapitalization.characters,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, letterSpacing: 1),
            decoration: const InputDecoration(
              hintText: 'Entrer un code promo',
              hintStyle: TextStyle(color: Colors.white54, fontWeight: FontWeight.w500, letterSpacing: 0),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 15),
              prefixIcon: Icon(Icons.confirmation_number_outlined, color: Colors.white70, size: 20),
            ),
          ),
        ),
      ),
      const SizedBox(width: 10),
      GestureDetector(
        onTap: _checking ? null : _apply,
        child: Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          alignment: Alignment.center,
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
          child: _checking
              ? const SizedBox(
                  width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: NC.brandDark))
              : const Text('Appliquer',
                  style: TextStyle(color: NC.brandDark, fontWeight: FontWeight.w800, fontSize: 14.5)),
        ),
      ),
    ]);
  }
}

/// Ticket de coupon actif (bord cranté via encoches latérales).
class _CouponTicket extends StatelessWidget {
  final String code, title, conditions, expiry;
  final Color accent;
  final IconData icon;
  const _CouponTicket({
    required this.code,
    required this.title,
    required this.conditions,
    required this.expiry,
    required this.accent,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: cardDeco(radius: R.lg),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(children: [
          // Souche gauche colorée
          Container(
            width: 74,
            decoration: BoxDecoration(color: accent.withValues(alpha: 0.16)),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(icon, color: accent, size: 26),
              const SizedBox(height: 6),
              Text(code.length > 8 ? '${code.substring(0, 7)}…' : code,
                  style: TextStyle(color: accent, fontWeight: FontWeight.w800, fontSize: 10.5)),
            ]),
          ),
          // Encoche crantée
          const _Notches(),
          // Corps
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(title, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
                  Pill(code, color: accent, bg: accent.withValues(alpha: 0.16)),
                ]),
                const SizedBox(height: 6),
                Text(conditions, style: T.muted, maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 12),
                Row(children: [
                  const Icon(Icons.schedule_rounded, size: 14, color: NC.faint),
                  const SizedBox(width: 4),
                  Text(expiry, style: const TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Coupon « $code » sélectionné'), duration: const Duration(seconds: 2)),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(R.pill)),
                      child: const Text('Utiliser', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
                    ),
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
      child: Column(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: List.generate(
        7,
        (_) => Container(
          width: 6,
          height: 6,
          decoration: const BoxDecoration(color: NC.shell, shape: BoxShape.circle),
        ),
      )),
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
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: cardDeco(radius: R.md),
        child: Row(children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.local_offer_outlined, color: NC.faint, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
              Text('$code · $expiry', style: T.muted),
            ]),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(R.pill)),
            child: const Text('Expiré', style: TextStyle(color: NC.faint, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ]),
      ),
    );
  }
}
