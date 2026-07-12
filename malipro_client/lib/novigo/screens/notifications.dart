import 'package:flutter/material.dart';
import '../theme.dart';
import '../data/env.dart';
import '../data/notifications_api.dart';

/// Type de notification → détermine l'icône et la couleur d'accent.
enum _NotifType { order, promo, wallet, system }

class _Notif {
  final _NotifType type;
  final String title;
  final String subtitle;
  final String time; // horodatage relatif
  final bool unread;
  const _Notif(this.type, this.title, this.subtitle, this.time, {this.unread = false});

  /// Convertit une notification live (type backend brut) en modèle d'affichage.
  factory _Notif.fromLive(NotifItem n) =>
      _Notif(_mapType(n.type), n.title, n.body, relativeTime(n.createdAt), unread: n.unread);
}

/// Mappe le type backend (ORDER_*, PROMO_*, WALLET_*/PAYMENT_*, …) vers l'enum visuel.
_NotifType _mapType(String backendType) {
  final t = backendType.toUpperCase();
  if (t.startsWith('ORDER') || t.contains('DELIVER')) return _NotifType.order;
  if (t.startsWith('PROMO') || t.contains('COUPON') || t.contains('OFFER')) return _NotifType.promo;
  if (t.startsWith('WALLET') || t.startsWith('PAYMENT') || t.contains('TRANSFER') || t.contains('RECHARGE')) {
    return _NotifType.wallet;
  }
  return _NotifType.system;
}

/// Écran des notifications — groupées par période, style premium NOVIGO.
/// En mode live, récupère les notifications réelles du Gateway (repli mock si échec).
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();

  static const List<_Notif> _today = [
    _Notif(_NotifType.order, 'Votre commande est en route',
        'MLP-2026-000026 · le coursier arrive dans 8 min', 'il y a 5 min', unread: true),
    _Notif(_NotifType.wallet, 'Recharge wallet réussie',
        '+10 000 FCFA ajoutés à votre NOVIGO Pay', 'il y a 42 min', unread: true),
    _Notif(_NotifType.promo, '-15% ce week-end chez Chez Fatou',
        'Profitez-en avant dimanche soir, code FATOU15', 'il y a 2 h'),
  ];

  static const List<_Notif> _week = [
    _Notif(_NotifType.order, 'Commande livrée',
        'MLP-2026-000021 · Aux Trois Fleuves · notez votre coursier', 'Hier · 20:14'),
    _Notif(_NotifType.system, 'Nouvel appareil connecté',
        'Connexion depuis Bamako, Hamdallaye ACI 2000', 'Hier · 09:02'),
    _Notif(_NotifType.promo, 'Livraison offerte tout le mois',
        'Sur vos courses au Grand Marché dès 5 000 FCFA', 'Lun · 11:30'),
    _Notif(_NotifType.wallet, 'Transfert reçu',
        '+7 500 FCFA de Aïssata K. sur votre wallet', 'Dim · 18:47'),
  ];

}

class _NotificationsScreenState extends State<NotificationsScreen> {
  // Groupes affichés : mock par défaut, remplacés par le live si disponible.
  List<_Notif> _today = NotificationsScreen._today;
  List<_Notif> _week = NotificationsScreen._week;
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
      final items = await notificationsApi.fetch();
      if (!mounted) return;
      final today = <_Notif>[];
      final week = <_Notif>[];
      final now = DateTime.now();
      for (final n in items) {
        final v = _Notif.fromLive(n);
        final sameDay = n.createdAt != null &&
            n.createdAt!.year == now.year &&
            n.createdAt!.month == now.month &&
            n.createdAt!.day == now.day;
        (sameDay ? today : week).add(v);
      }
      // Ne bascule en live que si le backend a réellement renvoyé des données.
      if (items.isNotEmpty) {
        setState(() {
          _live = true;
          _today = today;
          _week = week;
        });
      }
    } catch (_) {
      // repli silencieux : on garde le contenu mock premium
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAllRead() async {
    if (_live) {
      try {
        await notificationsApi.markAllRead();
        await _load();
        return;
      } catch (_) {/* repli local */}
    }
    setState(() {
      _today = _today.map((n) => _Notif(n.type, n.title, n.subtitle, n.time)).toList();
      _week = _week.map((n) => _Notif(n.type, n.title, n.subtitle, n.time)).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final bool empty = _today.isEmpty && _week.isEmpty;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications', style: T.h2),
        actions: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 18),
              child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: NC.brand)),
            )
          else
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Tout lire',
                  style: TextStyle(color: NC.brand, fontWeight: FontWeight.w700)),
            ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: empty
            ? _empty()
            : RefreshIndicator(
                onRefresh: _live ? _load : () async {},
                child: ListView(padding: const EdgeInsets.all(16), children: [
                  if (_today.isNotEmpty) ...[
                    _sectionLabel('Aujourd’hui'),
                    const SizedBox(height: 10),
                    _group(_today),
                    const SizedBox(height: 22),
                  ],
                  if (_week.isNotEmpty) ...[
                    _sectionLabel(_today.isEmpty ? 'Récentes' : 'Cette semaine'),
                    const SizedBox(height: 10),
                    _group(_week),
                  ],
                  const SizedBox(height: 8),
                ]),
              ),
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(
        text.toUpperCase(),
        style: const TextStyle(
            color: NC.faint, fontWeight: FontWeight.w800, fontSize: 12.5, letterSpacing: 0.6),
      );

  Widget _group(List<_Notif> items) => Container(
        decoration: cardDeco(radius: 18),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            for (int i = 0; i < items.length; i++) ...[
              if (i > 0) const Divider(height: 1, thickness: 1, color: NC.line, indent: 66),
              _row(items[i]),
            ],
          ],
        ),
      );

  Widget _row(_Notif n) {
    final (icon, color) = _visual(n.type);
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
              color: color.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text(n.title,
                    style: TextStyle(
                        color: NC.ink,
                        fontSize: 14.5,
                        fontWeight: n.unread ? FontWeight.w800 : FontWeight.w600)),
              ),
              if (n.unread) ...[
                const SizedBox(width: 8),
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 5),
                  decoration: const BoxDecoration(color: NC.brand, shape: BoxShape.circle),
                ),
              ],
            ]),
            const SizedBox(height: 3),
            Text(n.subtitle, style: T.muted),
            const SizedBox(height: 6),
            Text(n.time,
                style: const TextStyle(color: NC.faint, fontSize: 12, fontWeight: FontWeight.w600)),
          ]),
        ),
      ]),
    );
  }

  (IconData, Color) _visual(_NotifType t) {
    switch (t) {
      case _NotifType.order:
        return (Icons.local_shipping_outlined, NC.info);
      case _NotifType.promo:
        return (Icons.local_offer_outlined, NC.brand);
      case _NotifType.wallet:
        return (Icons.account_balance_wallet_outlined, NC.success);
      case _NotifType.system:
        return (Icons.shield_outlined, NC.gold);
    }
  }

  /// État vide (secours) — aucune notification.
  Widget _empty() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(28)),
              child: const Icon(Icons.notifications_none_rounded, size: 44, color: NC.faint),
            ),
            const SizedBox(height: 20),
            const Text('Aucune notification', style: T.h2, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            const Text(
              'Vos commandes, promos et mouvements wallet\ns’afficheront ici.',
              style: T.muted,
              textAlign: TextAlign.center,
            ),
          ]),
        ),
      );
}
