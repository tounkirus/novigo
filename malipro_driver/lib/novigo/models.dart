import 'package:flutter/material.dart';

/// Format monétaire FCFA avec séparateur d'espace (ex. 2 700 FCFA).
String fcfa(int v) {
  final s = v.toString();
  final b = StringBuffer();
  for (int i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(' ');
    b.write(s[i]);
  }
  return '${b.toString()} FCFA';
}

/// Une demande de course (commande à prendre en charge par le livreur).
class DeliveryRequest {
  final String id;
  final String storeName;
  final String storeInitials;
  final String storeAddress; // point de retrait
  final String dropAddress; // livraison client
  final double distanceKm;
  final int payout; // rémunération livreur en FCFA
  final int itemsCount;
  final int etaMin;
  final String customerName;
  final String? reference; // référence commande (MLP-…) quand elle est connue
  // Décision du NOVIGO Brain pour CE livreur : score de compatibilité sur 100
  // (0 = non calculé) et raisons lisibles. L'app affiche, elle ne recalcule pas.
  final int brainScore;
  final List<String> brainReasons;
  final bool recommended;
  const DeliveryRequest({
    required this.id,
    required this.storeName,
    required this.storeInitials,
    required this.storeAddress,
    required this.dropAddress,
    required this.distanceKm,
    required this.payout,
    required this.itemsCount,
    required this.etaMin,
    required this.customerName,
    this.reference,
    this.brainScore = 0,
    this.brainReasons = const [],
    this.recommended = false,
  });
}

/// Une course déjà livrée (historique).
class PastDelivery {
  final String id;
  final String storeName;
  final String when;
  final int payout;
  final String status; // 'Livrée', 'Annulée'
  const PastDelivery({
    required this.id,
    required this.storeName,
    required this.when,
    required this.payout,
    this.status = 'Livrée',
  });
}

/// Une ligne du journal des gains (crédit course / débit retrait).
class EarningTx {
  final String label;
  final String when;
  final int amount; // FCFA (positif = crédit)
  final bool isPayout; // true = gain course, false = retrait
  const EarningTx({
    required this.label,
    required this.when,
    required this.amount,
    required this.isPayout,
  });

  IconData get icon => isPayout ? Icons.pedal_bike_rounded : Icons.south_west_rounded;
}
