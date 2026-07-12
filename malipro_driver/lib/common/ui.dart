import 'package:flutter/material.dart';
import '../core/theme.dart';

class SectionCard extends StatelessWidget {
  const SectionCard({super.key, required this.child, this.padding});
  final Widget child;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.line),
      ),
      child: child,
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip(this.label, {super.key, this.color = AppColors.brand});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

/// Couleur associée à un statut de livraison/commande.
Color statusColor(String status) {
  switch (status) {
    case 'PENDING':
    case 'AVAILABLE':
      return AppColors.gold;
    case 'ACCEPTED':
    case 'ASSIGNED':
      return Colors.blue.shade700;
    case 'IN_TRANSIT':
    case 'PICKED_UP':
      return AppColors.brand;
    case 'DELIVERED':
    case 'COMPLETED':
      return Colors.green.shade700;
    case 'CANCELLED':
    case 'REJECTED':
      return Colors.red.shade700;
    default:
      return AppColors.muted;
  }
}

Future<void> showError(BuildContext context, String message) async {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message), backgroundColor: Colors.red.shade700),
  );
}

Future<void> showInfo(BuildContext context, String message) async {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message), backgroundColor: AppColors.brandDark),
  );
}
