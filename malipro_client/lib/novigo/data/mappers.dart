import '../models.dart';

/// Mappe les DTO backend (Nest /stores, /products) vers les modèles UI existants,
/// pour ne rien changer aux écrans. Images backend absentes => fallback asset local
/// (le catalogue live garde le rendu premium du mock).

/// Repli quand la boutique ne porte pas encore de frais (doit rester aligné sur
/// `DEFAULT_DELIVERY_FEE` du backend, sinon le panier ré-affiche un prix erroné).
const int _kDefaultDeliveryFee = 1000;

int _amount(dynamic money) {
  if (money is Map) return ((money['amount'] as num?) ?? 0).round();
  if (money is num) return money.round();
  return 0;
}

/// Vertical UI (kind) depuis la catégorie backend.
String kindFromCategory(String? category) {
  switch ((category ?? '').toUpperCase()) {
    case 'SUPERMARKET':
      return 'supermarche';
    case 'PHARMACY':
      return 'pharmacie';
    case 'MARKET':
      return 'marche';
    case 'BAKERY':
      return 'boulangerie';
    case 'BUTCHER':
      return 'marche';
    case 'SHOP':
      return 'boutique';
    default:
      return 'repas';
  }
}

String _cuisineLabel(String? category) {
  switch ((category ?? '').toUpperCase()) {
    case 'SUPERMARKET':
      return 'Supermarché';
    case 'PHARMACY':
      return 'Pharmacie';
    case 'MARKET':
      return 'Marché';
    case 'BAKERY':
      return 'Boulangerie · Pâtisserie';
    case 'BUTCHER':
      return 'Boucherie';
    case 'SHOP':
      return 'Boutique';
    default:
      return 'Restaurant';
  }
}

/// Quartier seul, pas l'adresse complète : « 277 Rue 894, Lafiabougou, Bamako »
/// donne « Lafiabougou ». Une adresse entière déborde de toutes les cartes.
String _district(String name, String? address) {
  final raw = address?.trim() ?? '';
  if (raw.isNotEmpty) {
    final parts = raw.split(',').map((p) => p.trim()).where((p) => p.isNotEmpty).toList();
    if (parts.length >= 2) {
      // Dernier segment = ville ; celui d'avant = quartier.
      final last = parts.last.toLowerCase();
      final quarter = (last == 'bamako' && parts.length >= 2) ? parts[parts.length - 2] : parts.last;
      if (quarter.isNotEmpty) return quarter;
    }
    if (parts.length == 1) return parts.first;
  }
  final i = name.indexOf(' - ');
  return i > 0 ? name.substring(i + 3).trim() : 'Bamako';
}

String? _nonEmpty(dynamic v) {
  final s = v?.toString().trim();
  return (s != null && s.isNotEmpty) ? s : null;
}

/// [sections] : `MenuCategory.id -> nom`, fourni par `/stores/:id`. Sans lui on
/// retomberait sur `category`, qui porte la verticale (FOOD/GROCERY) et non la
/// section de menu — tous les plats atterrissaient alors dans un bloc unique.
Product productFromJson(Map j, {required int index, Map<String, String>? sections}) {
  final price = _amount(j['finalPrice'] ?? j['price']);
  final base = _amount(j['price']);
  final discount = (base > price && base > 0) ? (100 - (price * 100 / base)).round() : null;
  final img = _nonEmpty(j['imageUrl']);
  return Product(
    id: j['id'].toString(),
    name: (j['name'] ?? '').toString(),
    desc: (j['description'] ?? '').toString(),
    price: price,
    image: img ?? 'assets/img/food_${(index % 10) + 1}.jpg',
    section: sections?[_nonEmpty(j['menuCategoryId']) ?? ''] ??
        _nonEmpty(j['category']) ??
        'Menu',
    popular: index < 2,
    discount: discount,
  );
}

/// [fallback] : boutique déjà connue (résumé de liste) dont on complète le
/// détail — évite de perdre les champs que `/stores/:id` ne renvoie pas.
Store storeFromJson(Map j, {required int index, Store? fallback}) {
  // Sections du menu (ordre serveur), pour nommer chaque produit.
  final sections = <String, String>{};
  for (final c in (j['categories'] as List?) ?? const []) {
    if (c is Map && c['id'] != null) sections[c['id'].toString()] = (c['name'] ?? '').toString();
  }
  final products = <Product>[];
  final list = (j['products'] as List?) ?? const [];
  for (var k = 0; k < list.length; k++) {
    if (list[k] is Map) {
      products.add(productFromJson(list[k] as Map, index: k, sections: sections));
    }
  }
  final cover = _nonEmpty(j['coverUrl']) ?? _nonEmpty(j['logoUrl']);
  final rawRating = (j['rating'] as num?)?.toDouble() ?? 0;
  final name = (j['name'] ?? '').toString();
  // Frais de livraison : valeur de la boutique côté backend, celle-là même qui
  // sera facturée à la création de la commande. Jamais dérivée de l'index.
  final fee = j['deliveryFee'] != null ? _amount(j['deliveryFee']) : _kDefaultDeliveryFee;
  return Store(
    id: j['id'].toString(),
    name: name,
    cuisine: _cuisineLabel(j['category'] as String?),
    image: cover ?? fallback?.image ?? 'assets/img/store_${(index % 6) + 1}.jpg',
    rating: rawRating > 0 ? rawRating.clamp(0, 5).toDouble() : (fallback?.rating ?? 4.6),
    reviews: (j['reviewCount'] as num?)?.toInt() ??
        fallback?.reviews ??
        (60 + (index * 37) % 400),
    etaMin: fallback?.etaMin ?? 20 + (index % 4) * 5,
    distanceKm: fallback?.distanceKm ?? 1.2 + (index % 5) * 0.6,
    deliveryFee: fee,
    verified: true,
    freeDelivery: fee == 0,
    district: _district(name, _nonEmpty(j['address'])),
    products: products.isNotEmpty ? products : (fallback?.products ?? const []),
    kind: kindFromCategory(j['category'] as String?),
  );
}
