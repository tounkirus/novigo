import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme.dart';
import '../data/realtime_client.dart';

class TrackingScreen extends StatefulWidget {
  final String storeName;
  final int eta;
  final String orderId;
  final String initialStatus; // statut connu à l'ouverture (commande live)
  const TrackingScreen(
      {super.key, required this.storeName, this.eta = 18, this.orderId = '', this.initialStatus = ''});
  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  final _rt = RealtimeClient();
  int _step = 2; // "En route" par défaut (démo) ; écrasé par le statut initial / temps réel
  final _steps = const ['Confirmée', 'En préparation', 'En route', 'Livrée'];

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();
    // Positionne l'étape sur le statut réel connu à l'ouverture (si fourni).
    if (widget.initialStatus.isNotEmpty) _applyStatus(widget.initialStatus);
    // Suivi temps réel via le Gateway (Socket.IO). Best-effort ; sinon animation seule.
    _rt.trackOrder(
      widget.orderId,
      onTracking: (d) => _applyStatus(d['status']?.toString()),
      onUpdated: (d) => _applyStatus(d['status']?.toString()),
    );
  }

  /// Libellé du badge de statut, dérivé de l'étape courante.
  String get _statusLabel => _steps[_step];
  bool get _delivered => _step >= _steps.length - 1;

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
        s = 1;
        break;
      case 'READY':
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
    if (s != null && mounted) setState(() => _step = s!);
  }

  @override
  void dispose() {
    _rt.dispose();
    _c.dispose();
    super.dispose();
  }

  int get _activeStep => _step;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NC.shell,
      body: Stack(children: [
        // Carte animée plein écran
        Positioned.fill(
          child: AnimatedBuilder(
            animation: _c,
            builder: (_, __) => CustomPaint(painter: _MapPainter(_c.value)),
          ),
        ),
        // Bouton retour
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(color: NC.paper, shape: BoxShape.circle, boxShadow: [
                  BoxShadow(color: Color(0x55000000), blurRadius: 12, offset: Offset(0, 4)),
                ]),
                child: const Icon(Icons.arrow_back, color: NC.ink),
              ),
            ),
          ),
        ),
        // Carte coursier (bottom sheet fixe)
        Align(alignment: Alignment.bottomCenter, child: _sheet(context)),
      ]),
    );
  }

  Widget _sheet(BuildContext context) => Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          color: NC.paper,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [BoxShadow(color: Color(0x66000000), blurRadius: 30, offset: Offset(0, -6))],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Center(child: Container(width: 44, height: 5, decoration: BoxDecoration(color: NC.line, borderRadius: BorderRadius.circular(999)))),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Arrivée estimée', style: TextStyle(color: NC.faint, fontSize: 13)),
                    Text('${widget.eta} min', style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 30)),
                  ]),
                ),
                _StatusChip(_statusLabel, delivered: _delivered),
              ]),
              const SizedBox(height: 16),
              _progress(),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: cardDeco(radius: 16, color: NC.surface),
                child: Row(children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: const Text('MK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Moussa K.', style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 15)),
                      Row(children: [
                        Icon(Icons.star_rounded, color: NC.gold, size: 15),
                        SizedBox(width: 3),
                        Text('4.9 · Coursier NOVIGO', style: TextStyle(color: NC.muted, fontSize: 13)),
                      ]),
                    ]),
                  ),
                  _round(Icons.call, NC.success),
                  const SizedBox(width: 10),
                  _round(Icons.chat_bubble_outline_rounded, NC.brand),
                ]),
              ),
            ]),
          ),
        ),
      );

  Widget _progress() => Row(children: List.generate(_steps.length, (i) {
        final done = i <= _activeStep;
        return Expanded(
          child: Column(children: [
            Row(children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(color: done ? NC.brand : NC.surfaceAlt, shape: BoxShape.circle),
                child: done ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
              ),
              if (i < _steps.length - 1)
                Expanded(child: Container(height: 3, color: i < _activeStep ? NC.brand : NC.surfaceAlt)),
            ]),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(_steps[i],
                  style: TextStyle(color: done ? NC.ink : NC.faint, fontSize: 10.5, fontWeight: FontWeight.w600)),
            ),
          ]),
        );
      }));

  Widget _round(IconData i, Color c) => Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(color: c.withValues(alpha: 0.16), shape: BoxShape.circle),
        child: Icon(i, color: c, size: 20),
      );
}

class _StatusChip extends StatelessWidget {
  final String text;
  final bool delivered;
  const _StatusChip(this.text, {this.delivered = false});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
            color: delivered ? NC.successSoft : NC.brandSoft, borderRadius: BorderRadius.circular(999)),
        child: Text(text,
            style: TextStyle(
                color: delivered ? NC.success : NC.brand, fontWeight: FontWeight.w800, fontSize: 13)),
      );
}

/// Carte stylisée (routes + itinéraire + marqueurs) — évoque un GPS sans dépendance.
class _MapPainter extends CustomPainter {
  final double t; // 0..1 progression coursier
  _MapPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()..color = const Color(0xFF12141C);
    canvas.drawRect(Offset.zero & size, bg);

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

    // Itinéraire (courbe) du commerce vers le domicile
    final start = Offset(size.width * 0.20, size.height * 0.30);
    final end = Offset(size.width * 0.78, size.height * 0.62);
    final ctrl = Offset(size.width * 0.35, size.height * 0.70);
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

    // Position du coursier le long de la courbe
    final metric = path.computeMetrics().first;
    final pos = metric.getTangentForOffset(metric.length * t)!.position;

    // Marqueur commerce (départ)
    _pin(canvas, start, const Color(0xFF2ECC71), Icons.storefront);
    // Marqueur domicile (arrivée)
    _pin(canvas, end, NC.brand, Icons.home_rounded);

    // Coursier
    canvas.drawCircle(pos, 18, Paint()..color = NC.brand.withValues(alpha: 0.25));
    canvas.drawCircle(pos, 11, Paint()..color = NC.brand);
    canvas.drawCircle(pos, 11, Paint()
      ..color = Colors.white
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke);
  }

  void _pin(Canvas canvas, Offset c, Color color, IconData icon) {
    canvas.drawCircle(c, 16, Paint()..color = color);
    canvas.drawCircle(c, 16, Paint()
      ..color = Colors.white
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke);
    final tp = TextPainter(textDirection: TextDirection.ltr)
      ..text = TextSpan(
          text: String.fromCharCode(icon.codePoint),
          style: TextStyle(fontSize: 16, fontFamily: icon.fontFamily, package: icon.fontPackage, color: Colors.white))
      ..layout();
    tp.paint(canvas, c - Offset(tp.width / 2, tp.height / 2));
  }

  @override
  bool shouldRepaint(_MapPainter old) => old.t != t;
}
