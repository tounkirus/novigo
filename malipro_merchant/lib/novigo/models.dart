import 'package:flutter/material.dart';
import 'theme.dart';

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

/// Statuts d'une commande marchand.
/// 'nouvelle' → 'preparation' → 'prete' → 'terminee'
class MStatus {
  static const nouvelle = 'nouvelle';
  static const preparation = 'preparation';
  static const prete = 'prete';
  static const terminee = 'terminee';

  static String label(String s) {
    switch (s) {
      case nouvelle:
        return 'Nouvelle';
      case preparation:
        return 'En préparation';
      case prete:
        return 'Prête';
      case terminee:
        return 'Terminée';
      default:
        return s;
    }
  }

  static Color color(String s) {
    switch (s) {
      case nouvelle:
        return NC.brand;
      case preparation:
        return NC.warning;
      case prete:
        return NC.success;
      case terminee:
        return NC.faint;
      default:
        return NC.faint;
    }
  }

  static IconData icon(String s) {
    switch (s) {
      case nouvelle:
        return Icons.fiber_new_rounded;
      case preparation:
        return Icons.soup_kitchen_rounded;
      case prete:
        return Icons.check_circle_rounded;
      case terminee:
        return Icons.done_all_rounded;
      default:
        return Icons.circle;
    }
  }
}

/// Commande reçue par le marchand.
class MOrder {
  final String id; // ex 'MP-100297' (référence affichée)
  final String? backendId; // id serveur (mode live) — null en mock
  final String customerName;
  final String customerInitials;
  final String itemsLabel; // ex '2× Yassa poulet, 1× Bissap'
  final int itemCount;
  final int total;
  final String whenLabel; // ex 'il y a 4 min'
  String status; // 'nouvelle' | 'preparation' | 'prete' | 'terminee'
  final List<String> items; // lignes détaillées

  MOrder({
    required this.id,
    this.backendId,
    required this.customerName,
    required this.customerInitials,
    required this.itemsLabel,
    required this.itemCount,
    required this.total,
    required this.whenLabel,
    required this.status,
    required this.items,
  });
}

/// Produit du menu marchand.
class MProduct {
  final String id;
  final String name;
  final String section; // Plats / Entrées / Boissons / Desserts
  final int price;
  bool available;
  final IconData icon;
  final Color tone;

  MProduct({
    required this.id,
    required this.name,
    required this.section,
    required this.price,
    this.available = true,
    required this.icon,
    required this.tone,
  });
}
