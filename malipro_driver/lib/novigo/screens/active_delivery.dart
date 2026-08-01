import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../state.dart';

class ActiveDeliveryScreen extends StatefulWidget {
  const ActiveDeliveryScreen({super.key});
  @override
  State<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends State<ActiveDeliveryScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  static const _steps = ['Aller au commerce', 'Récupérer', 'En route', 'Livré'];
  static const _titles = [
    'Rendez-vous au commerce',
    'Récupérez la commande',
    'En route vers le client',
    'Remettez la commande',
  ];
  static const _actions = [
    'Je suis au commerce',
    'J\'ai récupéré la commande',
    'Démarrer la livraison',
    'Livraison terminée',
  ];

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  void _onAction() {
    if (driver.step < 3) {
      driver.advanceStep();
      return;
    }
    // Dernière étape : clôture + écran succès
    final amount = driver.completeActive();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => _SuccessScreen(amount: amount)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NC.shell,
      body: ListenableBuilder(
        listenable: driver,
        builder: (context, _) {
          final req = driver.active;
          if (req == null) {
            return const Center(child: CircularProgressIndicator(color: NC.brand));
          }
          return Stack(children: [
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _c,
                builder: (_, __) => CustomPaint(painter: _MapPainter(_c.value)),
              ),
            ),
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
            Align(alignment: Alignment.bottomCenter, child: _sheet(req)),
          ]);
        },
      ),
    );
  }

  Widget _sheet(DeliveryRequest req) {
    final step = driver.step;
    final atStore = step <= 1; // les étapes 0-1 concernent le commerce
    return Container(
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
            Center(
                child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(color: NC.line, borderRadius: BorderRadius.circular(999)))),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Étape en cours', style: TextStyle(color: NC.faint, fontSize: 13)),
                  Text(_titles[step],
                      style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 21)),
                ]),
              ),
              _StatusChip(fcfa(req.payout)),
            ]),
            const SizedBox(height: 16),
            _progress(step),
            const SizedBox(height: 18),
            // Carte destination courante (commerce ou client)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: cardDeco(radius: 16, color: NC.surface),
              child: Row(children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                      color: (atStore ? NC.gold : NC.brand).withValues(alpha: 0.16), shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: Icon(atStore ? Icons.storefront_rounded : Icons.location_on_rounded,
                      color: atStore ? NC.gold : NC.brand),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(atStore ? req.storeName : req.customerName,
                        style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 15),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    Text(atStore ? req.storeAddress : req.dropAddress,
                        style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ]),
                ),
                _round(Icons.call, NC.success),
                const SizedBox(width: 10),
                _round(Icons.chat_bubble_outline_rounded, NC.brand),
              ]),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: step == 3 ? NC.success : NC.brand,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: _onAction,
                child: Text(_actions[step],
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _progress(int active) => Row(children: List.generate(_steps.length, (i) {
        final done = i <= active;
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
                Expanded(child: Container(height: 3, color: i < active ? NC.brand : NC.surfaceAlt)),
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
  const _StatusChip(this.text);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(999)),
        child: Text(text, style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 13)),
      );
}

/// Écran de succès affiché après clôture de la course.
class _SuccessScreen extends StatelessWidget {
  final int amount;
  const _SuccessScreen({required this.amount});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NC.shell,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            const Spacer(),
            Container(
              width: 108,
              height: 108,
              decoration: BoxDecoration(color: NC.successSoft, shape: BoxShape.circle),
              child: const Icon(Icons.check_rounded, color: NC.success, size: 62),
            ),
            const SizedBox(height: 24),
            const Text('Livraison terminée', style: T.h1, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text('Merci ${driver.firstName}, la course a bien été livrée.',
                style: T.muted, textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 28),
              decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(22)),
              child: Column(children: [
                const Text('Gains de la course', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 6),
                Text('+${fcfa(amount)}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 34,
                        fontFeatures: [FontFeature.tabularFigures()])),
              ]),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: NC.brand,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Retour à l\'accueil',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
          ]),
        ),
      ),
    );
  }
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
