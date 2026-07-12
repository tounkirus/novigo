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

class Category {
  final String id;
  final String label;
  final IconData icon;
  final int count; // nb commerces
  const Category(this.id, this.label, this.icon, this.count);
}

class Product {
  final String id;
  final String name;
  final String desc;
  final int price;
  final String image; // asset path ('' si tuile-icône)
  final String section;
  final bool popular;
  final int? discount; // pourcentage
  final IconData? icon; // rendu en tuile (rayons marché/pharmacie) au lieu d'une photo
  final Color? tone; // couleur d'accent de la tuile
  const Product({
    required this.id,
    required this.name,
    required this.desc,
    required this.price,
    this.image = '',
    required this.section,
    this.popular = false,
    this.discount,
    this.icon,
    this.tone,
  });

  bool get isTile => icon != null;
}

class Store {
  final String id;
  final String name;
  final String cuisine;
  final String image;
  final double rating;
  final int reviews;
  final int etaMin;
  final double distanceKm;
  final int deliveryFee; // 0 = gratuit
  final bool verified;
  final bool freeDelivery;
  final String district;
  final List<Product> products;
  final String kind; // 'repas' (fiches resto) ou 'supermarche'/'pharmacie'/'marche'/'boulangerie' (grille)
  const Store({
    required this.id,
    required this.name,
    required this.cuisine,
    required this.image,
    required this.rating,
    required this.reviews,
    required this.etaMin,
    required this.distanceKm,
    required this.deliveryFee,
    required this.verified,
    required this.freeDelivery,
    required this.district,
    required this.products,
    this.kind = 'repas',
  });

  String get initials {
    final parts = name.split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}

class CartLine {
  final Product product;
  final Store store;
  int qty;
  CartLine(this.product, this.store, this.qty);
  int get total => product.price * qty;
}
