import 'package:flutter/material.dart';
import '../theme.dart';
import '../widgets.dart';

/// Location de véhicules — avec ou sans chauffeur (parcours mobilité).
class LocationScreen extends StatelessWidget {
  const LocationScreen({super.key});

  static const _vehicles = [
    _Vehicle(
      name: 'Toyota Corolla',
      kind: 'Berline · avec chauffeur',
      image: 'assets/img/store_1.jpg',
      pricePerDay: 35000,
      seats: 5,
      driver: true,
      transmission: 'Auto',
      fuel: 'Essence',
    ),
    _Vehicle(
      name: 'Hyundai Tucson',
      kind: 'SUV · sans chauffeur',
      image: 'assets/img/store_2.jpg',
      pricePerDay: 45000,
      seats: 5,
      driver: false,
      transmission: 'Auto',
      fuel: 'Diesel',
    ),
    _Vehicle(
      name: 'Toyota Land Cruiser',
      kind: '4x4 · avec chauffeur',
      image: 'assets/img/store_3.jpg',
      pricePerDay: 90000,
      seats: 7,
      driver: true,
      transmission: 'Auto',
      fuel: 'Diesel',
    ),
    _Vehicle(
      name: 'Kia Picanto',
      kind: 'Citadine · sans chauffeur',
      image: 'assets/img/store_4.jpg',
      pricePerDay: 22000,
      seats: 4,
      driver: false,
      transmission: 'Manuelle',
      fuel: 'Essence',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Location', style: T.title), leading: const BackButton(color: NC.ink)),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 24), children: [
        // Hero
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(22)),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Text('Louez une voiture à Bamako',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20, height: 1.15)),
                SizedBox(height: 8),
                Text('Avec ou sans chauffeur, à la journée. Assurance et carburant plein inclus.',
                    style: TextStyle(color: Colors.white70, fontSize: 13.5, height: 1.3)),
              ]),
            ),
            const Icon(Icons.car_rental_rounded, color: Colors.white, size: 54),
          ]),
        ),
        const SizedBox(height: 18),
        Row(children: const [
          _Perk(Icons.verified_user_outlined, 'Assurance incluse'),
          SizedBox(width: 10),
          _Perk(Icons.support_agent_outlined, 'Assistance 24/7'),
        ]),
        const SizedBox(height: 20),
        Row(children: [
          const Text('Véhicules disponibles', style: T.h2),
          const Spacer(),
          Text('${_vehicles.length} offres', style: T.muted),
        ]),
        const SizedBox(height: 12),
        for (int i = 0; i < _vehicles.length; i++) ...[
          _VehicleCard(vehicle: _vehicles[i]),
          if (i < _vehicles.length - 1) const SizedBox(height: 16),
        ],
      ]),
    );
  }
}

class _Vehicle {
  final String name, kind, image, transmission, fuel;
  final int pricePerDay, seats;
  final bool driver;
  const _Vehicle({
    required this.name,
    required this.kind,
    required this.image,
    required this.pricePerDay,
    required this.seats,
    required this.driver,
    required this.transmission,
    required this.fuel,
  });
}

class _VehicleCard extends StatelessWidget {
  final _Vehicle vehicle;
  const _VehicleCard({required this.vehicle});

  String _fcfa(int v) {
    final s = v.toString();
    final b = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) b.write(' ');
      b.write(s[i]);
    }
    return b.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: cardDeco(radius: R.xl),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Stack(children: [
          Img(vehicle.image, height: 160, width: double.infinity, fit: BoxFit.cover),
          Positioned(
            left: 12,
            top: 12,
            child: Pill(
              vehicle.driver ? 'Avec chauffeur' : 'Sans chauffeur',
              color: Colors.white,
              bg: vehicle.driver ? NC.brand : Colors.black.withValues(alpha: 0.55),
              icon: vehicle.driver ? Icons.person_rounded : Icons.vpn_key_outlined,
            ),
          ),
        ]),
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(vehicle.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 3),
            Text(vehicle.kind, style: T.muted),
            const SizedBox(height: 12),
            Row(children: [
              _spec(Icons.event_seat_outlined, '${vehicle.seats} places'),
              const SizedBox(width: 16),
              _spec(Icons.settings_outlined, vehicle.transmission),
              const SizedBox(width: 16),
              _spec(Icons.local_gas_station_outlined, vehicle.fuel),
            ]),
            const SizedBox(height: 14),
            Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${_fcfa(vehicle.pricePerDay)} FCFA', style: T.price),
                const Text('par jour', style: TextStyle(color: NC.faint, fontSize: 11.5)),
              ]),
              const Spacer(),
              GestureDetector(
                onTap: () => ScaffoldMessenger.of(context)
                  ..hideCurrentSnackBar()
                  ..showSnackBar(SnackBar(
                      behavior: SnackBarBehavior.floating,
                      backgroundColor: NC.surfaceAlt,
                      content: Text('Réservation de ${vehicle.name} — bientôt disponible',
                          style: const TextStyle(color: NC.ink)),
                      duration: const Duration(seconds: 2))),
                child: Container(
                  height: 46,
                  padding: const EdgeInsets.symmetric(horizontal: 22),
                  decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(14)),
                  alignment: Alignment.center,
                  child: const Text('Réserver',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                ),
              ),
            ]),
          ]),
        ),
      ]),
    );
  }

  Widget _spec(IconData i, String t) => Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(i, size: 15, color: NC.faint),
        const SizedBox(width: 4),
        Flexible(child: Text(t, style: const TextStyle(color: NC.muted, fontSize: 12.5), overflow: TextOverflow.ellipsis)),
      ]);
}

class _Perk extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Perk(this.icon, this.label);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: cardDeco(radius: R.md),
        child: Row(children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(11)),
            child: Icon(icon, color: NC.brand, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label,
                style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 13, height: 1.15)),
          ),
        ]),
      ),
    );
  }
}
