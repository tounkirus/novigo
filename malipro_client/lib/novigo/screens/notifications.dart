import 'package:flutter/material.dart';

import '../data/env.dart';
import '../data/notifications_api.dart';
import '../ui/ui.dart';

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
  if (t.startsWith('WALLET') ||
      t.startsWith('PAYMENT') ||
      t.contains('TRANSFER') ||
      t.contains('RECHARGE')) {
    return _NotifType.wallet;
  }
  return _NotifType.system;
}

/// Notifications — **deux sections** : ce qui vient d'arriver, et le reste.
///
/// En mode live, tout provient du Gateway. Le jeu de démonstration ne sert plus
/// que hors ligne : auparavant, une boîte réellement vide affichait quand même
/// six fausses notifications, ce qui laissait croire à une activité inexistante.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();

  static const List<_Notif> _demoToday = [
    _Notif(_NotifType.order, 'Votre commande est en route',
        'MLP-2026-000026 · le coursier arrive dans 8 min', 'il y a 5 min', unread: true),
    _Notif(_NotifType.wallet, 'Recharge wallet réussie',
        '+10 000 FCFA ajoutés à votre NOVIGO Pay', 'il y a 42 min', unread: true),
    _Notif(_NotifType.promo, '-15% ce week-end chez Chez Fatou',
        'Profitez-en avant dimanche soir, code FATOU15', 'il y a 2 h'),
  ];

  static const List<_Notif> _demoWeek = [
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
  late List<_Notif> _today = NovigoEnv.live ? const [] : NotificationsScreen._demoToday;
  late List<_Notif> _week = NovigoEnv.live ? const [] : NotificationsScreen._demoWeek;

  bool _loading = false;
  bool _failed = false;

  /// Vrai une fois que le backend a répondu — y compris pour dire « rien ».
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
      setState(() {
        _today = today;
        _week = week;
        _loaded = true;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      // Le réseau a lâché : on le signale et on propose de réessayer, au lieu de
      // remplacer silencieusement le contenu réel par de la démonstration.
      setState(() {
        _loading = false;
        _failed = true;
      });
    }
  }

  Future<void> _markAllRead() async {
    if (NovigoEnv.live && _loaded) {
      try {
        await notificationsApi.markAllRead();
        await _load();
        return;
      } catch (_) {
        // Repli local : au moins l'écran redevient cohérent.
      }
    }
    setState(() {
      _today = _today.map((n) => _Notif(n.type, n.title, n.subtitle, n.time)).toList();
      _week = _week.map((n) => _Notif(n.type, n.title, n.subtitle, n.time)).toList();
    });
  }

  bool get _hasUnread =>
      _today.any((n) => n.unread) || _week.any((n) => n.unread);

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final firstLoad = _loading && !_loaded;
    final empty = !firstLoad && _today.isEmpty && _week.isEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications', style: T.h2),
        actions: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: Sp.lg + 2),
              child: Center(
                child: SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: NC.brand)),
              ),
            )
          else if (_hasUnread)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Tout lire',
                  style: TextStyle(color: NC.brand, fontWeight: FontWeight.w700)),
            ),
        ],
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
                if (firstLoad)
                  const _NotifSkeleton()
                else if (empty)
                  // Une liste vide n'est pas une erreur : le ton reste neutre et
                  // aucune action de récupération n'est proposée.
                  const Padding(
                    padding: EdgeInsets.only(top: Sp.xxl),
                    child: NovigoEmptyState.empty(
                      icon: Icons.notifications_none_rounded,
                      title: 'Aucune notification',
                      message:
                          'Vos commandes, promotions et mouvements NOVIGO Pay s\'afficheront ici.',
                    ),
                  )
                else ...[
                  if (_today.isNotEmpty) ...[
                    const Text('AUJOURD\'HUI', style: T.overline),
                    const SizedBox(height: Sp.md),
                    _NotifGroup(items: _today),
                  ],
                  if (_week.isNotEmpty) ...[
                    SizedBox(height: _today.isEmpty ? 0 : Sp.section),
                    Text(_today.isEmpty ? 'RÉCENTES' : 'CETTE SEMAINE', style: T.overline),
                    const SizedBox(height: Sp.md),
                    _NotifGroup(items: _week),
                  ],
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Un groupe de notifications dans une seule carte, séparées par un filet.
class _NotifGroup extends StatelessWidget {
  final List<_Notif> items;
  const _NotifGroup({required this.items});

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      padding: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: Column(children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) const NovigoDivider(indent: 66),
          FadeSlideIn(index: i, child: _NotifRow(notif: items[i])),
        ],
      ]),
    );
  }
}

class _NotifRow extends StatelessWidget {
  final _Notif notif;
  const _NotifRow({required this.notif});

  static (IconData, Color) _visual(_NotifType t) {
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

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _visual(notif.type);
    return Semantics(
      label: '${notif.unread ? 'Non lue. ' : ''}${notif.title}. ${notif.subtitle}. ${notif.time}',
      child: Container(
        // Un fond très légèrement teinté distingue les non-lues sans avoir à
        // comparer deux graisses de police côte à côte.
        color: notif.unread ? NC.brand.withValues(alpha: 0.05) : null,
        padding: const EdgeInsets.all(Sp.lg - 2),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
                color: color.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: Sp.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(
                  child: Text(notif.title,
                      style: TextStyle(
                          color: NC.ink,
                          fontSize: 14.5,
                          height: 1.25,
                          fontWeight: notif.unread ? FontWeight.w800 : FontWeight.w600)),
                ),
                if (notif.unread) ...[
                  const SizedBox(width: Sp.sm),
                  Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.only(top: 5),
                    decoration: const BoxDecoration(color: NC.brand, shape: BoxShape.circle),
                  ),
                ],
              ]),
              const SizedBox(height: 3),
              Text(notif.subtitle, style: T.muted),
              if (notif.time.isNotEmpty) ...[
                const SizedBox(height: Sp.sm - 2),
                Text(notif.time,
                    style: const TextStyle(color: NC.faint, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ]),
          ),
        ]),
      ),
    );
  }
}

/// Squelette : même gabarit que les vraies lignes.
class _NotifSkeleton extends StatelessWidget {
  const _NotifSkeleton();

  @override
  Widget build(BuildContext context) {
    return NovigoCard(
      padding: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: Column(children: [
        for (var i = 0; i < 4; i++) ...[
          if (i > 0) const NovigoDivider(indent: 66),
          const Padding(
            padding: EdgeInsets.all(Sp.lg - 2),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              NovigoSkeleton(width: 40, height: 40, radius: 12),
              SizedBox(width: Sp.md),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  NovigoSkeleton(height: 13, radius: 6),
                  SizedBox(height: Sp.sm),
                  NovigoSkeleton(width: 180, height: 11, radius: 6),
                  SizedBox(height: Sp.sm),
                  NovigoSkeleton(width: 70, height: 10, radius: 5),
                ]),
              ),
            ]),
          ),
        ],
      ]),
    );
  }
}
