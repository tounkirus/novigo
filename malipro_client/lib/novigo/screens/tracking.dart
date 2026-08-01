import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../data/realtime_client.dart';
import '../ui/ui.dart';
import 'chat.dart';

/// Suivi de commande — **deux zones**.
///
///   1. La carte : où en est la course, en plein écran.
///   2. La feuille : quand ça arrive, à quelle étape on en est, qui livre.
///
/// La version précédente empilait dans la feuille une heure d'arrivée, quatre
/// libellés d'étape en corps 10,5 et une carte coursier munie de deux boutons
/// ronds qui n'étaient reliés à rien. Ici la progression est portée par un rail
/// segmenté (toujours lisible, quelle que soit la taille de police) doublé d'une
/// phrase qui dit ce qui se passe réellement, et la seule action proposée est
/// celle qui fonctionne : écrire au coursier.
class TrackingScreen extends StatefulWidget {
  final String storeName;
  final int eta;
  final String orderId;

  /// Statut connu à l'ouverture (commande live) — évite d'afficher « Confirmée »
  /// une seconde avant de sauter à l'étape réelle.
  final String initialStatus;

  const TrackingScreen({
    super.key,
    required this.storeName,
    this.eta = 18,
    this.orderId = '',
    this.initialStatus = '',
  });

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

/// Une étape du parcours, avec ce qu'elle signifie pour le client.
class _Step {
  final String label;
  final String detail;
  final IconData icon;
  const _Step(this.label, this.detail, this.icon);
}

class _TrackingScreenState extends State<TrackingScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  final _rt = RealtimeClient();

  /// Démo (sans commande réelle) : on illustre une course en cours. En LIVE, on
  /// part du début et on n'affiche que ce que le backend a réellement dit — une
  /// commande à peine passée ne doit pas s'afficher « En route » avec un
  /// coursier imaginaire.
  late int _step;

  static const _steps = <_Step>[
    _Step('Confirmée', 'Le commerce a reçu votre commande.', Icons.receipt_long_rounded),
    _Step('En préparation', 'Votre commande est en cours de préparation.', Icons.restaurant_rounded),
    _Step('En route', 'Le coursier a récupéré votre commande.', Icons.delivery_dining_rounded),
    _Step('Livrée', 'Votre commande vous a été remise. Bon appétit !', Icons.check_circle_rounded),
  ];

  bool get _live => widget.orderId.isNotEmpty;
  bool get _delivered => _step >= _steps.length - 1;
  bool get _assigned => _step >= 2;

  @override
  void initState() {
    super.initState();
    _step = _live ? 0 : 2;
    _c = AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();
    if (widget.initialStatus.isNotEmpty) _applyStatus(widget.initialStatus);
    // Suivi temps réel via le Gateway (Socket.IO). Best-effort ; sinon la carte
    // continue de tourner et l'étape reste celle connue à l'ouverture.
    _rt.trackOrder(
      widget.orderId,
      onTracking: (d) => _applyStatus(d['status']?.toString()),
      onUpdated: (d) => _applyStatus(d['status']?.toString()),
    );
  }

  void _applyStatus(String? status) {
    if (status == null) return;
    int? s;
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'CONFIRMED':
        s = 0;
        break;
      case 'ACCEPTED':
      case 'PREPARING':
      // « Prête » = préparation terminée, mais aucun coursier n'a encore pris la
      // course : afficher « En route » serait faux.
      case 'READY':
        s = 1;
        break;
      case 'ASSIGNED':
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        s = 2;
        break;
      case 'DELIVERED':
      case 'COMPLETED':
        s = 3;
        break;
    }
    if (s != null && mounted && s != _step) setState(() => _step = s!);
  }

  @override
  void dispose() {
    _rt.dispose();
    _c.dispose();
    super.dispose();
  }

  void _openChat() => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const ChatThreadScreen(title: 'Coursier NOVIGO')),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NC.shell,
      body: Stack(children: [
        // ───────── Zone 1 · La carte ─────────
        Positioned.fill(
          child: RepaintBoundary(
            child: AnimatedBuilder(
              animation: _c,
              builder: (_, __) => CustomPaint(painter: _MapPainter(_c.value, courierVisible: _assigned)),
            ),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(Sp.md),
            child: Row(children: [
              NovigoIconButton(
                icon: Icons.arrow_back_rounded,
                tooltip: 'Retour',
                background: NC.paper,
                onPressed: () => Navigator.pop(context),
              ),
              const SizedBox(width: Sp.md),
              Expanded(child: _MapTitle(storeName: widget.storeName)),
            ]),
          ),
        ),

        // ───────── Zone 2 · La feuille ─────────
        Align(alignment: Alignment.bottomCenter, child: _sheet(context)),
      ]),
    );
  }

  /// Feuille inférieure. Sa hauteur est bornée puis rendue défilable : avec une
  /// police système agrandie sur un petit écran, un contenu fixe déborderait.
  Widget _sheet(BuildContext context) {
    final maxHeight = MediaQuery.sizeOf(context).height * 0.62;
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: NC.paper,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [BoxShadow(color: Color(0x66000000), blurRadius: 30, offset: Offset(0, -6))],
      ),
      child: SafeArea(
        top: false,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxHeight),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(Sp.gutter, Sp.md, Sp.gutter, Sp.lg),
            child: NovigoContentWidth(
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(color: NC.line, borderRadius: BorderRadius.circular(R.pill)),
                  ),
                ),
                const SizedBox(height: Sp.lg),
                _EtaHeader(eta: widget.eta, delivered: _delivered, statusLabel: _steps[_step].label),
                const SizedBox(height: Sp.lg),
                NovigoProgressRail(step: _step, total: _steps.length),
                const SizedBox(height: Sp.md + 2),
                NovigoStepCaption(
                  icon: _steps[_step].icon,
                  title: _steps[_step].label,
                  detail: _steps[_step].detail,
                  tone: _delivered ? NC.success : NC.brand,
                ),
                const SizedBox(height: Sp.lg),
                if (_delivered)
                  NovigoButton(
                    label: 'Terminer',
                    icon: Icons.check_rounded,
                    onPressed: () => Navigator.pop(context),
                  )
                else
                  _CourierCard(
                    searching: _live && !_assigned,
                    onMessage: _assigned || !_live ? _openChat : null,
                  ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

/// Nom du commerce posé sur la carte, dans une pastille lisible sur n'importe
/// quel fond.
class _MapTitle extends StatelessWidget {
  final String storeName;
  const _MapTitle({required this.storeName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: Sp.sm),
      decoration: BoxDecoration(
        color: NC.glass,
        borderRadius: BorderRadius.circular(R.pill),
        border: Border.all(color: NC.hairline),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.storefront_rounded, size: 15, color: NC.muted),
        const SizedBox(width: Sp.sm - 2),
        Flexible(
          child: Text(
            storeName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: NC.ink, fontSize: 13.5, fontWeight: FontWeight.w700),
          ),
        ),
      ]),
    );
  }
}

/// Heure d'arrivée + pastille de statut.
class _EtaHeader extends StatelessWidget {
  final int eta;
  final bool delivered;
  final String statusLabel;

  const _EtaHeader({required this.eta, required this.delivered, required this.statusLabel});

  @override
  Widget build(BuildContext context) {
    return Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(delivered ? 'Commande' : 'Arrivée estimée', style: T.overline),
          const SizedBox(height: Sp.xs),
          // Le chiffre change en fondu plutôt qu'en sautant : le regard est
          // souvent posé dessus au moment où le statut bascule.
          AnimatedSwitcher(
            duration: M.base,
            child: Text(
              delivered ? 'Livrée' : '$eta min',
              key: ValueKey(delivered),
              style: TextStyle(
                color: delivered ? NC.success : NC.ink,
                fontWeight: FontWeight.w900,
                fontSize: 30,
                height: 1.1,
                letterSpacing: -0.8,
              ),
            ),
          ),
        ]),
      ),
      const SizedBox(width: Sp.md),
      _StatusChip(statusLabel, delivered: delivered),
    ]);
  }
}

/// Bloc coursier.
///
/// Tant qu'aucun livreur n'a pris la course, on annonce la recherche en cours
/// plutôt qu'un coursier inventé. L'unique action proposée — écrire — est reliée
/// à la messagerie réelle ; le bouton d'appel a été retiré tant que le numéro du
/// livreur n'est pas exposé au client.
class _CourierCard extends StatelessWidget {
  final bool searching;
  final VoidCallback? onMessage;

  const _CourierCard({required this.searching, this.onMessage});

  @override
  Widget build(BuildContext context) {
    if (searching) {
      return NovigoCard(
        padding: const EdgeInsets.all(Sp.md),
        radius: R.md,
        child: Row(children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(color: NC.brandSoft, shape: BoxShape.circle),
            child: const Icon(Icons.search_rounded, color: NC.brand),
          ),
          const SizedBox(width: Sp.md),
          const Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Recherche d\'un coursier', style: T.title),
              SizedBox(height: 2),
              Text('Le NOVIGO Brain choisit le mieux placé.', style: T.muted),
            ]),
          ),
        ]),
      );
    }
    return NovigoCard(
      padding: const EdgeInsets.all(Sp.md),
      radius: R.md,
      child: Row(children: [
        Container(
          width: 48,
          height: 48,
          decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
          alignment: Alignment.center,
          child: const Icon(Icons.delivery_dining_rounded, color: Colors.white, size: 24),
        ),
        const SizedBox(width: Sp.md),
        const Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Coursier NOVIGO', style: T.title),
            SizedBox(height: 2),
            Text('Course prise en charge', style: T.muted),
          ]),
        ),
        if (onMessage != null)
          NovigoIconButton(
            icon: Icons.chat_bubble_outline_rounded,
            tooltip: 'Écrire au coursier',
            background: NC.brandSoft,
            foreground: NC.brand,
            onPressed: onMessage,
          ),
      ]),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String text;
  final bool delivered;
  const _StatusChip(this.text, {this.delivered = false});

  @override
  Widget build(BuildContext context) => AnimatedContainer(
        duration: M.base,
        padding: const EdgeInsets.symmetric(horizontal: Sp.md, vertical: Sp.sm - 2),
        decoration: BoxDecoration(
          color: delivered ? NC.successSoft : NC.brandSoft,
          borderRadius: BorderRadius.circular(R.pill),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: delivered ? NC.success : NC.brand,
            fontWeight: FontWeight.w800,
            fontSize: 13,
          ),
        ),
      );
}

/// Carte stylisée (quartiers + routes + itinéraire) — évoque un GPS sans
/// embarquer de dépendance cartographique ni consommer de quota réseau.
class _MapPainter extends CustomPainter {
  final double t; // 0..1 progression du coursier sur l'itinéraire
  final bool courierVisible;

  _MapPainter(this.t, {this.courierVisible = true});

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = const Color(0xFF12141C));

    // Blocs / quartiers
    final block = Paint()..color = const Color(0xFF1A1E28);
    final rnd = math.Random(7);
    for (int i = 0; i < 26; i++) {
      final x = rnd.nextDouble() * size.width;
      final y = rnd.nextDouble() * size.height;
      final w = 40 + rnd.nextDouble() * 90;
      final h = 40 + rnd.nextDouble() * 90;
      canvas.drawRRect(
          RRect.fromRectAndRadius(Rect.fromLTWH(x, y, w, h), const Radius.circular(8)), block);
    }

    // Routes
    final road = Paint()
      ..color = const Color(0xFF262B36)
      ..strokeWidth = 10
      ..style = PaintingStyle.stroke;
    for (double y = 80; y < size.height; y += 130) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y + 30), road);
    }
    for (double x = 60; x < size.width; x += 150) {
      canvas.drawLine(Offset(x, 0), Offset(x + 20, size.height), road);
    }

    // Itinéraire du commerce vers le domicile
    final start = Offset(size.width * 0.20, size.height * 0.28);
    final end = Offset(size.width * 0.78, size.height * 0.56);
    final ctrl = Offset(size.width * 0.35, size.height * 0.64);
    final path = Path()
      ..moveTo(start.dx, start.dy)
      ..quadraticBezierTo(ctrl.dx, ctrl.dy, end.dx, end.dy);
    canvas.drawPath(
        path,
        Paint()
          ..color = NC.brand
          ..strokeWidth = 6
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round);

    _pin(canvas, start, NC.success, Icons.storefront_rounded);
    _pin(canvas, end, NC.brand, Icons.home_rounded);

    // Le coursier n'apparaît qu'une fois la course attribuée : un point qui
    // avance alors que personne n'a pris la commande est un mensonge visuel.
    if (!courierVisible) return;
    final metric = path.computeMetrics().first;
    final pos = metric.getTangentForOffset(metric.length * t)!.position;
    canvas.drawCircle(pos, 18, Paint()..color = NC.brand.withValues(alpha: 0.25));
    canvas.drawCircle(pos, 11, Paint()..color = NC.brand);
    canvas.drawCircle(
        pos,
        11,
        Paint()
          ..color = Colors.white
          ..strokeWidth = 3
          ..style = PaintingStyle.stroke);
  }

  void _pin(Canvas canvas, Offset c, Color color, IconData icon) {
    canvas.drawCircle(c, 16, Paint()..color = color);
    canvas.drawCircle(
        c,
        16,
        Paint()
          ..color = Colors.white
          ..strokeWidth = 3
          ..style = PaintingStyle.stroke);
    final tp = TextPainter(textDirection: TextDirection.ltr)
      ..text = TextSpan(
          text: String.fromCharCode(icon.codePoint),
          style: TextStyle(
              fontSize: 16,
              fontFamily: icon.fontFamily,
              package: icon.fontPackage,
              color: Colors.white))
      ..layout();
    tp.paint(canvas, c - Offset(tp.width / 2, tp.height / 2));
  }

  @override
  bool shouldRepaint(_MapPainter old) => old.t != t || old.courierVisible != courierVisible;
}
