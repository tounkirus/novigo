import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../state.dart';
import 'active_delivery.dart';

class DeliveriesScreen extends StatelessWidget {
  const DeliveriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListenableBuilder(
        listenable: driver,
        builder: (context, _) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Mes courses', style: T.h1),
            const SizedBox(height: 16),
            if (driver.hasActive) ...[
              _ActiveBanner(req: driver.active!),
              const SizedBox(height: 22),
            ],
            const Text('Historique', style: T.h2),
            const SizedBox(height: 12),
            if (driver.history.isEmpty)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 36),
                decoration: cardDeco(radius: 18),
                alignment: Alignment.center,
                child: const Text('Aucune course pour le moment', style: T.muted),
              )
            else
              ...driver.history.map((d) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _HistoryCard(delivery: d),
                  )),
          ],
        ),
      ),
    );
  }
}

class _ActiveBanner extends StatelessWidget {
  final DeliveryRequest req;
  const _ActiveBanner({required this.req});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const ActiveDeliveryScreen())),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(20)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [
            Icon(Icons.pedal_bike_rounded, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Course en cours', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
            Spacer(),
            _MiniChip('En livraison'),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
              alignment: Alignment.center,
              child: Text(req.storeInitials,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(req.storeName,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                Text('${req.id} · ${fcfa(req.payout)}',
                    style: const TextStyle(color: Colors.white70, fontSize: 13)),
              ]),
            ),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('${req.etaMin} min',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
              const Text('Estimé', style: TextStyle(color: Colors.white70, fontSize: 11)),
            ]),
          ]),
          const SizedBox(height: 14),
          Container(
            height: 46,
            width: double.infinity,
            decoration: BoxDecoration(color: NC.brand, borderRadius: BorderRadius.circular(14)),
            alignment: Alignment.center,
            child: const Text('Ouvrir la course  ›',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
          ),
        ]),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final PastDelivery delivery;
  const _HistoryCard({required this.delivery});

  @override
  Widget build(BuildContext context) {
    final delivered = delivery.status == 'Livrée';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: cardDeco(radius: 16),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
              color: (delivered ? NC.success : NC.error).withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(12)),
          child: Icon(delivered ? Icons.check_rounded : Icons.close_rounded,
              color: delivered ? NC.success : NC.error),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(delivery.storeName, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            Text('${delivery.id} · ${delivery.when}', style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(fcfa(delivery.payout),
              style: const TextStyle(
                  color: NC.ink,
                  fontWeight: FontWeight.w800,
                  fontFeatures: [FontFeature.tabularFigures()])),
          const SizedBox(height: 3),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
                color: (delivered ? NC.success : NC.error).withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(999)),
            child: Text(delivery.status,
                style: TextStyle(
                    color: delivered ? NC.success : NC.error, fontSize: 11, fontWeight: FontWeight.w700)),
          ),
        ]),
      ]),
    );
  }
}

class _MiniChip extends StatelessWidget {
  final String text;
  const _MiniChip(this.text);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
        child: Text(text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
      );
}
