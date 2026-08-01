import 'package:flutter/material.dart';

import '../models.dart' show fcfa;
import '../ui/ui.dart';
import '../widgets.dart' show Img, Pill;

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

const _vehicles = <_Vehicle>[
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

/// Location de véhicules — **deux sections** : la promesse, les véhicules.
///
/// La liste était figée ; le choix « avec / sans chauffeur » est la première
/// question que se pose un client, il filtre donc réellement le catalogue.
class LocationScreen extends StatefulWidget {
  const LocationScreen({super.key});

  @override
  State<LocationScreen> createState() => _LocationScreenState();
}

class _LocationScreenState extends State<LocationScreen> {
  int _filter = 0; // 0 = tous, 1 = avec chauffeur, 2 = sans chauffeur

  List<_Vehicle> get _visible => switch (_filter) {
        1 => [for (final v in _vehicles) if (v.driver) v],
        2 => [for (final v in _vehicles) if (!v.driver) v],
        _ => _vehicles,
      };

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final vehicles = _visible;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Location', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: SafeArea(
        top: false,
        child: NovigoContentWidth(
          child: ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.xs, gutter, Sp.xl),
            children: [
              // ───────── Section 1 · La promesse ─────────
              const NovigoCard(
                gradient: NC.brandGradient,
                radius: 22,
                padding: EdgeInsets.all(Sp.gutter),
                child: Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Louez une voiture à Bamako',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 20,
                              height: 1.15)),
                      SizedBox(height: Sp.sm),
                      Text(
                          'Avec ou sans chauffeur, à la journée. Assurance et carburant plein inclus.',
                          style: TextStyle(color: Colors.white70, fontSize: 13.5, height: 1.3)),
                    ]),
                  ),
                  SizedBox(width: Sp.sm),
                  Icon(Icons.car_rental_rounded, color: Colors.white, size: 54),
                ]),
              ),
              const SizedBox(height: Sp.lg),
              const Row(children: [
                _Perk(Icons.verified_user_outlined, 'Assurance incluse'),
                SizedBox(width: Sp.md - 2),
                _Perk(Icons.support_agent_outlined, 'Assistance 24/7'),
              ]),

              // ───────── Section 2 · Les véhicules ─────────
              const SizedBox(height: Sp.section),
              NovigoSectionHeader(
                overline: 'Catalogue',
                title: 'Véhicules disponibles',
                subtitle: '${vehicles.length} offre${vehicles.length > 1 ? 's' : ''} à la journée',
              ),
              const SizedBox(height: Sp.md),
              NovigoChipRail(
                labels: const ['Tous', 'Avec chauffeur', 'Sans chauffeur'],
                selectedIndex: _filter,
                onSelected: (i) => setState(() => _filter = i),
                padding: EdgeInsets.zero,
              ),
              const SizedBox(height: Sp.md),
              if (vehicles.isEmpty)
                const NovigoEmptyState.empty(
                  icon: Icons.no_transfer_outlined,
                  title: 'Aucun véhicule',
                  message: 'Aucune offre ne correspond à ce filtre pour le moment.',
                )
              else
                for (var i = 0; i < vehicles.length; i++) ...[
                  if (i > 0) const SizedBox(height: Sp.lg),
                  FadeSlideIn(index: i, child: _VehicleCard(vehicle: vehicles[i])),
                ],
            ],
          ),
        ),
      ),
    );
  }
}

class _VehicleCard extends StatelessWidget {
  final _Vehicle vehicle;
  const _VehicleCard({required this.vehicle});

  @override
  Widget build(BuildContext context) {
    final v = vehicle;
    return NovigoCard.flush(
      semanticLabel: '${v.name}, ${v.kind}, ${fcfa(v.pricePerDay)} par jour',
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Stack(children: [
          Img(v.image, height: 160, width: double.infinity, fit: BoxFit.cover),
          Positioned(
            left: Sp.md,
            top: Sp.md,
            child: Pill(
              v.driver ? 'Avec chauffeur' : 'Sans chauffeur',
              color: Colors.white,
              bg: v.driver ? NC.brand : Colors.black.withValues(alpha: 0.55),
              icon: v.driver ? Icons.person_rounded : Icons.vpn_key_outlined,
            ),
          ),
        ]),
        Padding(
          padding: const EdgeInsets.fromLTRB(Sp.md + 2, Sp.md, Sp.md + 2, Sp.md + 2),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(v.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 3),
            Text(v.kind, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: Sp.md),
            // `Wrap` : les trois caractéristiques passent à la ligne au lieu de
            // se tronquer quand la police système est agrandie.
            Wrap(spacing: Sp.lg, runSpacing: Sp.xs, children: [
              _Spec(Icons.event_seat_outlined, '${v.seats} places'),
              _Spec(Icons.settings_outlined, v.transmission),
              _Spec(Icons.local_gas_station_outlined, v.fuel),
            ]),
            const SizedBox(height: Sp.md + 2),
            Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(fcfa(v.pricePerDay), style: T.price),
                  ),
                  const Text('par jour', style: TextStyle(color: NC.faint, fontSize: 11.5)),
                ]),
              ),
              const SizedBox(width: Sp.md),
              NovigoButton(
                label: 'Réserver',
                size: NovigoButtonSize.medium,
                expand: false,
                onPressed: () {
                  ScaffoldMessenger.of(context)
                    ..hideCurrentSnackBar()
                    ..showSnackBar(SnackBar(
                      behavior: SnackBarBehavior.floating,
                      backgroundColor: NC.surfaceAlt,
                      content: Text('Réservation de ${v.name} — bientôt disponible'),
                    ));
                },
              ),
            ]),
          ]),
        ),
      ]),
    );
  }
}

class _Spec extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Spec(this.icon, this.label);

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 15, color: NC.faint),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: NC.muted, fontSize: 12.5)),
      ]);
}

class _Perk extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Perk(this.icon, this.label);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: NovigoCard(
        radius: R.md,
        padding: const EdgeInsets.symmetric(vertical: Sp.md + 2, horizontal: Sp.md),
        child: Row(children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(11)),
            child: Icon(icon, color: NC.brand, size: 20),
          ),
          const SizedBox(width: Sp.md - 2),
          Expanded(
            child: Text(label,
                style: const TextStyle(
                    color: NC.ink, fontWeight: FontWeight.w700, fontSize: 13, height: 1.15)),
          ),
        ]),
      ),
    );
  }
}
