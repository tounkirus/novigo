import 'package:flutter/material.dart';
import '../theme.dart';
import '../widgets.dart';

/// Course VTC / Moto — parcours mobilité dédié (taxi ou moto taxi).
class RideScreen extends StatefulWidget {
  final String mode; // 'taxi' ou 'moto'
  const RideScreen({super.key, this.mode = 'taxi'});

  @override
  State<RideScreen> createState() => _RideScreenState();
}

class _RideScreenState extends State<RideScreen> {
  bool get _moto => widget.mode == 'moto';

  String _destination = '';
  int _cat = 0;

  List<_RideCat> get _cats => _moto
      ? const [
          _RideCat('Standard', 'Rapide et malin', Icons.two_wheeler, 800, 1400, 3),
          _RideCat('Express', 'Priorité, sans détour', Icons.bolt_rounded, 1200, 2000, 2),
        ]
      : const [
          _RideCat('Éco', 'Le meilleur prix', Icons.local_taxi_rounded, 1500, 2200, 5),
          _RideCat('Confort', 'Berline climatisée', Icons.airline_seat_recline_normal_rounded, 2400, 3200, 6),
          _RideCat('XL', 'Jusqu\'à 6 places', Icons.airport_shuttle_rounded, 3000, 4200, 8),
        ];

  List<_Driver> get _drivers => _moto
      ? const [
          _Driver('Ibrahim K.', 4.9, 'ML 5521 MB', 2),
          _Driver('Moussa S.', 4.8, 'ML 3390 MC', 4),
          _Driver('Adama T.', 4.7, 'ML 7712 MD', 5),
        ]
      : const [
          _Driver('Seydou D.', 4.9, 'ML 4187 BK', 3),
          _Driver('Aïssata C.', 4.8, 'ML 2264 BK', 5),
          _Driver('Boubacar M.', 4.7, 'ML 9053 BK', 7),
        ];

  @override
  Widget build(BuildContext context) {
    final cat = _cats[_cat];
    return Scaffold(
      appBar: AppBar(
        title: Text(_moto ? 'Moto Taxi' : 'Taxi', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 120), children: [
        _map(),
        const SizedBox(height: 16),
        _tripCard(),
        const SizedBox(height: 20),
        const Text('Choisir une catégorie', style: T.h2),
        const SizedBox(height: 12),
        for (int i = 0; i < _cats.length; i++) ...[
          _catRow(i),
          if (i < _cats.length - 1) const SizedBox(height: 10),
        ],
        const SizedBox(height: 22),
        Row(children: [
          const Text('Chauffeurs proches', style: T.h2),
          const Spacer(),
          Row(children: [
            Container(width: 8, height: 8, decoration: const BoxDecoration(color: NC.success, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            const Text('En ligne', style: T.muted),
          ]),
        ]),
        const SizedBox(height: 12),
        for (int i = 0; i < _drivers.length; i++) ...[
          _driverRow(_drivers[i], cat),
          if (i < _drivers.length - 1) const SizedBox(height: 10),
        ],
      ]),
      bottomNavigationBar: _bottomBar(cat),
    );
  }

  // ── Carte façon plan ──────────────────────────────────────────────
  Widget _map() {
    return Container(
      height: 190,
      clipBehavior: Clip.antiAlias,
      decoration: cardDeco(radius: R.xl),
      child: Stack(children: [
        Positioned.fill(child: CustomPaint(painter: _MapPainter())),
        const Positioned(
          left: 46,
          top: 58,
          child: _Pin(color: NC.success, icon: Icons.trip_origin, label: 'Départ'),
        ),
        Positioned(
          right: 42,
          bottom: 44,
          child: _Pin(color: NC.brand, icon: _moto ? Icons.two_wheeler : Icons.place_rounded, label: 'Arrivée'),
        ),
        Positioned(
          right: 12,
          top: 12,
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.my_location_rounded, color: NC.brand, size: 18),
          ),
        ),
        Positioned(
          left: 12,
          bottom: 12,
          child: Pill(_moto ? 'Moto à 2 min' : 'Voiture à 3 min', color: Colors.white, icon: Icons.access_time_rounded),
        ),
      ]),
    );
  }

  // ── Départ / Destination ──────────────────────────────────────────
  Widget _tripCard() {
    return Container(
      decoration: cardDeco(radius: R.lg),
      padding: const EdgeInsets.all(4),
      child: Column(children: [
        const ListTile(
          leading: Icon(Icons.trip_origin, color: NC.success),
          title: Text('Départ', style: TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
          subtitle: Text('Ma position · Hamdallaye ACI',
              style: TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 15)),
        ),
        const Divider(color: NC.line, height: 1, indent: 56),
        ListTile(
          leading: const Icon(Icons.place, color: NC.brand),
          title: const Text('Destination', style: TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
          subtitle: Text(_destination.isEmpty ? 'Où allez-vous ?' : _destination,
              style: TextStyle(
                  color: _destination.isEmpty ? NC.muted : NC.ink, fontWeight: FontWeight.w700, fontSize: 15)),
          trailing: const Icon(Icons.chevron_right_rounded, color: NC.faint),
          onTap: _pickDestination,
        ),
      ]),
    );
  }

  void _pickDestination() {
    const options = [
      ('Aéroport Modibo Keïta – Sénou', '16 km'),
      ('Grand Marché · Rue Baba Diarra', '5,2 km'),
      ('ACI 2000 · Tour BCEAO', '3,8 km'),
      ('Badalabougou · Faculté', '6,4 km'),
      ('Kalaban Coura · Rond-point', '8,1 km'),
    ];
    showModalBottomSheet(
      context: context,
      backgroundColor: NC.paper,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SizedBox(height: 10),
          Container(width: 42, height: 4, decoration: BoxDecoration(color: NC.line, borderRadius: BorderRadius.circular(R.pill))),
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 6),
            child: Align(alignment: Alignment.centerLeft, child: Text('Choisir une destination', style: T.h2)),
          ),
          for (final o in options)
            ListTile(
              leading: const Icon(Icons.place_outlined, color: NC.brand),
              title: Text(o.$1, style: T.body),
              subtitle: Text(o.$2, style: T.muted),
              onTap: () {
                setState(() => _destination = o.$1);
                Navigator.of(ctx).pop();
              },
            ),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  // ── Ligne catégorie ───────────────────────────────────────────────
  Widget _catRow(int i) {
    final c = _cats[i];
    final on = i == _cat;
    return GestureDetector(
      onTap: () => setState(() => _cat = i),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: on ? NC.brandSoft : NC.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: on ? NC.brand : NC.line, width: on ? 1.4 : 1),
        ),
        child: Row(children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
                color: on ? NC.brand : NC.surfaceAlt, borderRadius: BorderRadius.circular(14)),
            child: Icon(c.icon, color: on ? Colors.white : NC.ink, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.name, style: T.title),
              const SizedBox(height: 2),
              Text('${c.desc} · ${c.eta} min', style: T.muted),
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('${_num(c.priceLow)}–${_num(c.priceHigh)}',
                style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 15)),
            const Text('FCFA', style: TextStyle(color: NC.faint, fontSize: 11)),
          ]),
        ]),
      ),
    );
  }

  // ── Ligne chauffeur ───────────────────────────────────────────────
  Widget _driverRow(_Driver d, _RideCat cat) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: cardDeco(radius: R.md),
      child: Row(children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(14)),
          child: Icon(_moto ? Icons.two_wheeler : Icons.person_rounded, color: NC.muted, size: 24),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(d.name, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 3),
            Row(children: [
              const Icon(Icons.star_rounded, size: 15, color: NC.gold),
              const SizedBox(width: 3),
              Text(d.rating.toStringAsFixed(1),
                  style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 12.5)),
              const SizedBox(width: 8),
              Text('·  ${d.plate}', style: T.muted),
            ]),
          ]),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(color: NC.successSoft, borderRadius: BorderRadius.circular(R.pill)),
          child: Text('${d.min} min',
              style: const TextStyle(color: NC.success, fontWeight: FontWeight.w800, fontSize: 12.5)),
        ),
      ]),
    );
  }

  // ── Barre inférieure ──────────────────────────────────────────────
  Widget _bottomBar(_RideCat cat) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: const BoxDecoration(
        color: NC.paper,
        border: Border(top: BorderSide(color: NC.line)),
      ),
      child: SafeArea(
        top: false,
        child: Row(children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${cat.name} · ${cat.eta} min', style: T.muted),
            const SizedBox(height: 2),
            Text('${_num(cat.priceLow)}–${_num(cat.priceHigh)} FCFA', style: T.price),
          ]),
          const SizedBox(width: 14),
          Expanded(
            child: GestureDetector(
              onTap: () => ScaffoldMessenger.of(context)
                ..hideCurrentSnackBar()
                ..showSnackBar(const SnackBar(
                    behavior: SnackBarBehavior.floating,
                    backgroundColor: NC.surfaceAlt,
                    content: Text('Recherche d\'un chauffeur…', style: TextStyle(color: NC.ink)),
                    duration: Duration(seconds: 2))),
              child: Container(
                height: 56,
                decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
                alignment: Alignment.center,
                child: const Text('Commander',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  String _num(int v) {
    final s = v.toString();
    final b = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) b.write(' ');
      b.write(s[i]);
    }
    return b.toString();
  }
}

class _RideCat {
  final String name, desc;
  final IconData icon;
  final int priceLow, priceHigh, eta;
  const _RideCat(this.name, this.desc, this.icon, this.priceLow, this.priceHigh, this.eta);
}

class _Driver {
  final String name, plate;
  final double rating;
  final int min;
  const _Driver(this.name, this.rating, this.plate, this.min);
}

class _Pin extends StatelessWidget {
  final Color color;
  final IconData icon;
  final String label;
  const _Pin({required this.color, required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(R.pill)),
        child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
      ),
      const SizedBox(height: 4),
      Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: const [BoxShadow(color: Color(0x66000000), blurRadius: 10, offset: Offset(0, 4))],
        ),
        child: Icon(icon, color: Colors.white, size: 16),
      ),
    ]);
  }
}

/// Fond de carte stylisé (rues + parcours), sans dépendance externe.
class _MapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()..color = const Color(0xFF161A22);
    canvas.drawRect(Offset.zero & size, bg);

    final street = Paint()
      ..color = const Color(0xFF232A36)
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;
    // Grille de rues
    for (double x = -20; x < size.width + 40; x += 54) {
      canvas.drawLine(Offset(x, 0), Offset(x + 26, size.height), street);
    }
    final thin = Paint()
      ..color = const Color(0xFF1F2530)
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    for (double y = 16; y < size.height; y += 44) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y - 12), thin);
    }

    // Parcours (départ → arrivée)
    final path = Path()
      ..moveTo(60, 74)
      ..cubicTo(size.width * 0.35, size.height * 0.30, size.width * 0.55, size.height * 0.85,
          size.width - 54, size.height - 52);
    final route = Paint()
      ..color = NC.brand
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(path, route);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
