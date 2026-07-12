import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../state.dart';
import 'active_delivery.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListenableBuilder(
        listenable: driver,
        builder: (context, _) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            _header(),
            const SizedBox(height: 16),
            _onlineCard(),
            const SizedBox(height: 16),
            _statsRow(),
            const SizedBox(height: 22),
            if (driver.online) ...[
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Demandes à proximité', style: T.h2),
                Text('${driver.available.length}',
                    style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 15)),
              ]),
              const SizedBox(height: 12),
              if (driver.available.isEmpty)
                _empty(Icons.hourglass_empty_rounded, 'Aucune demande pour le moment',
                    'De nouvelles courses arrivent bientôt. Restez en ligne.')
              else
                ...driver.available.map((r) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _RequestCard(req: r),
                    )),
            ] else
              _empty(Icons.wifi_off_rounded, 'Vous êtes hors ligne',
                  'Passez en ligne pour recevoir des courses à proximité.'),
          ],
        ),
      ),
    );
  }

  Widget _header() => Row(children: [
        Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
          alignment: Alignment.center,
          child: const Text('N', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 21)),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Bonjour', style: TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
            Text('Moussa Keïta', style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 17)),
          ]),
        ),
        Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(color: NC.surface, shape: BoxShape.circle),
          child: const Icon(Icons.notifications_none_rounded, color: NC.ink, size: 22),
        ),
      ]);

  Widget _onlineCard() {
    final on = driver.online;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: on
          ? BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(22))
          : cardDeco(radius: 22),
      child: Row(children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: on ? Colors.white.withValues(alpha: 0.18) : NC.surfaceAlt,
            shape: BoxShape.circle,
          ),
          child: Icon(on ? Icons.pedal_bike_rounded : Icons.power_settings_new_rounded,
              color: on ? Colors.white : NC.faint, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(on ? 'En ligne' : 'Hors ligne',
                style: TextStyle(
                    color: on ? Colors.white : NC.ink, fontWeight: FontWeight.w900, fontSize: 18)),
            const SizedBox(height: 2),
            Text(on ? 'Prêt à livrer' : 'Vous ne recevez pas de courses',
                style: TextStyle(
                    color: on ? Colors.white70 : NC.muted, fontSize: 13, fontWeight: FontWeight.w500)),
          ]),
        ),
        Switch(
          value: on,
          onChanged: (_) => driver.toggleOnline(),
          activeThumbColor: Colors.white,
          activeTrackColor: Colors.white.withValues(alpha: 0.35),
          inactiveThumbColor: NC.faint,
          inactiveTrackColor: NC.surfaceAlt,
        ),
      ]),
    );
  }

  Widget _statsRow() => Row(children: [
        _stat(Icons.payments_rounded, fcfa(driver.todayEarnings), 'Gains', NC.success),
        const SizedBox(width: 10),
        _stat(Icons.check_circle_rounded, '${driver.todayCount}', 'Courses', NC.brand),
        const SizedBox(width: 10),
        _stat(Icons.star_rounded, driver.rating.toStringAsFixed(1), 'Note', NC.gold),
        const SizedBox(width: 10),
        _stat(Icons.schedule_rounded, '${driver.hoursOnline}h', 'En ligne', NC.info),
      ]);

  Widget _stat(IconData icon, String value, String label, Color c) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: cardDeco(radius: 18),
          child: Column(children: [
            Icon(icon, color: c, size: 22),
            const SizedBox(height: 8),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(value,
                  maxLines: 1,
                  style: const TextStyle(
                      color: NC.ink, fontWeight: FontWeight.w900, fontSize: 14, fontFeatures: [FontFeature.tabularFigures()])),
            ),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: NC.faint, fontSize: 11, fontWeight: FontWeight.w600)),
          ]),
        ),
      );

  Widget _empty(IconData icon, String title, String sub) => Container(
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
        decoration: cardDeco(radius: 20),
        child: Column(children: [
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(color: NC.surfaceAlt, shape: BoxShape.circle),
            child: Icon(icon, color: NC.faint, size: 30),
          ),
          const SizedBox(height: 14),
          Text(title, style: T.title, textAlign: TextAlign.center),
          const SizedBox(height: 6),
          Text(sub, style: T.muted, textAlign: TextAlign.center),
        ]),
      );
}

class _RequestCard extends StatelessWidget {
  final DeliveryRequest req;
  const _RequestCard({required this.req});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: cardDeco(radius: 20),
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 46,
            height: 46,
            decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(req.storeInitials,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(req.storeName, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text('${req.itemsCount} article${req.itemsCount > 1 ? 's' : ''} · ${req.etaMin} min',
                  style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(fcfa(req.payout),
                style: const TextStyle(
                    color: NC.success,
                    fontWeight: FontWeight.w900,
                    fontSize: 17,
                    fontFeatures: [FontFeature.tabularFigures()])),
            Text('${req.distanceKm} km', style: const TextStyle(color: NC.faint, fontSize: 12)),
          ]),
        ]),
        const SizedBox(height: 14),
        _leg(Icons.storefront_rounded, NC.gold, 'Retrait', req.storeAddress),
        Padding(
          padding: const EdgeInsets.only(left: 13, top: 2, bottom: 2),
          child: Container(width: 2, height: 14, color: NC.line),
        ),
        _leg(Icons.location_on_rounded, NC.brand, 'Client · ${req.customerName}', req.dropAddress),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: NC.brand,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () {
              driver.accept(req);
              Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ActiveDeliveryScreen()));
            },
            child: const Text('Accepter la course',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
          ),
        ),
      ]),
    );
  }

  Widget _leg(IconData icon, Color c, String label, String value) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(color: c.withValues(alpha: 0.16), shape: BoxShape.circle),
            child: Icon(icon, color: c, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label, style: const TextStyle(color: NC.faint, fontSize: 11.5, fontWeight: FontWeight.w600)),
              Text(value, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ),
        ],
      );
}
