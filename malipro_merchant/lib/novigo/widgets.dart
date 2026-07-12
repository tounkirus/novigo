import 'package:flutter/material.dart';
import 'theme.dart';
import 'models.dart';

/// Pastille arrondie (badge). tone = couleur d'accent.
class Pill extends StatelessWidget {
  final String text;
  final Color color;
  final Color? bg;
  final IconData? icon;
  const Pill(this.text, {super.key, this.color = NC.ink, this.bg, this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg ?? Colors.black.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 13, color: color), const SizedBox(width: 4)],
        Text(text, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: color)),
      ]),
    );
  }
}

/// Chip de statut coloré pour une commande.
class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final c = MStatus.color(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(MStatus.icon(status), size: 13, color: c),
        const SizedBox(width: 4),
        Text(MStatus.label(status), style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: c)),
      ]),
    );
  }
}

/// Avatar rond à initiales.
class Avatar extends StatelessWidget {
  final String initials;
  final double size;
  final Gradient gradient;
  const Avatar(this.initials, {super.key, this.size = 46, this.gradient = NC.brandGradient});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(gradient: gradient, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Text(initials,
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: size * 0.36)),
    );
  }
}

/// Bouton d'action plein largeur, dégradé marque.
class BrandButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;
  final double height;
  final Gradient? gradient;
  const BrandButton(this.label, {super.key, required this.onTap, this.icon, this.height = 52, this.gradient});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: height,
        width: double.infinity,
        decoration: BoxDecoration(gradient: gradient ?? NC.brandGradient, borderRadius: BorderRadius.circular(16)),
        alignment: Alignment.center,
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          if (icon != null) ...[Icon(icon, color: Colors.white, size: 19), const SizedBox(width: 8)],
          Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
        ]),
      ),
    );
  }
}

/// Libellé + couleur du bouton d'action contextuel selon le statut.
class OrderAction {
  final String label;
  final IconData icon;
  final String? nextStatus;
  const OrderAction(this.label, this.icon, this.nextStatus);

  static OrderAction? forStatus(String status) {
    switch (status) {
      case MStatus.nouvelle:
        return const OrderAction('Accepter', Icons.check_rounded, MStatus.preparation);
      case MStatus.preparation:
        return const OrderAction('Marquer prête', Icons.restaurant_rounded, MStatus.prete);
      case MStatus.prete:
        return const OrderAction('Remettre au livreur', Icons.delivery_dining_rounded, MStatus.terminee);
      default:
        return null;
    }
  }
}
