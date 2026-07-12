import '../models.dart';

/// Mappe les DTO backend (Nest /stores, /products) vers les modèles UI existants,
/// pour ne rien changer aux écrans. Images backend absentes => fallback asset local
/// (le catalogue live garde le rendu premium du mock).

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
    default:
      return 'Restaurant';
  }
}

String _district(String name, String? address) {
  if (address != null && address.trim().isNotEmpty) return address.trim();
  final i = name.indexOf(' - ');
  return i > 0 ? name.substring(i + 3).trim() : 'Bamako';
}

String? _nonEmpty(dynamic v) {
  final s = v?.toString().trim();
  return (s != null && s.isNotEmpty) ? s : null;
}

Product productFromJson(Map j, {required int index}) {
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
    section: (_nonEmpty(j['category']) ?? 'Menu'),
    popular: index < 2,
    discount: discount,
  );
}

Store storeFromJson(Map j, {required int index}) {
  final products = <Product>[];
  final list = (j['products'] as List?) ?? const [];
  for (var k = 0; k < list.length; k++) {
    if (list[k] is Map) products.add(productFromJson(list[k] as Map, index: k));
  }
  final cover = _nonEmpty(j['coverUrl']) ?? _nonEmpty(j['logoUrl']);
  final rawRating = (j['rating'] as num?)?.toDouble() ?? 0;
  final name = (j['name'] ?? '').toString();
  return Store(
    id: j['id'].toString(),
    name: name,
    cuisine: _cuisineLabel(j['category'] as String?),
    image: cover ?? 'assets/img/store_${(index % 6) + 1}.jpg',
    rating: rawRating > 0 ? rawRating.clamp(0, 5).toDouble() : 4.6,
    reviews: (j['reviewCount'] as num?)?.toInt() ?? (60 + (index * 37) % 400),
    etaMin: 20 + (index % 4) * 5,
    distanceKm: 1.2 + (index % 5) * 0.6,
    deliveryFee: index.isEven ? 0 : 500,
    verified: true,
    freeDelivery: index.isEven,
    district: _district(name, _nonEmpty(j['address'])),
    products: products,
    kind: kindFromCategory(j['category'] as String?),
  );
}
