import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../common/ui.dart';
import '../../../core/theme.dart';

/// Carte compacte d'une livraison, cliquable vers son détail.
class DeliveryCard extends StatelessWidget {
  const DeliveryCard(this.delivery, {super.key});
  final Map<String, dynamic> delivery;

  @override
  Widget build(BuildContext context) {
    final id = delivery['id'] as String;
    final status = (delivery['status'] as String?) ?? '—';
    final eta = delivery['etaMinutes'];
    final dist = delivery['distanceMeters'];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => context.push('/deliveries/$id'),
        child: SectionCard(
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: statusColor(status).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.inventory_2_outlined,
                    color: statusColor(status)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Course ${id.substring(0, 8)}',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (eta != null) '≈ $eta min',
                        if (dist != null)
                          '${(dist as num) ~/ 1000 == 0 ? dist : (dist / 1000).toStringAsFixed(1)} '
                              '${(dist) < 1000 ? 'm' : 'km'}',
                      ].join(' · '),
                      style: const TextStyle(color: AppColors.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              StatusChip(status, color: statusColor(status)),
            ],
          ),
        ),
      ),
    );
  }
}
