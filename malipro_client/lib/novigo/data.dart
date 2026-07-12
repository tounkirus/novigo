import 'package:flutter/material.dart';
import 'models.dart';

String _food(int i) => 'assets/img/food_${(i % 10) + 1}.jpg';
String _storeImg(int i) => 'assets/img/store_${(i % 6) + 1}.jpg';

const categories = <Category>[
  Category('repas', 'Repas', Icons.restaurant, 500),
  Category('supermarche', 'Supermarché', Icons.local_grocery_store, 200),
  Category('pharmacie', 'Pharmacie', Icons.local_pharmacy, 100),
  Category('marche', 'Marché', Icons.storefront, 100),
  Category('colis', 'Colis', Icons.local_shipping, 80),
  Category('boulangerie', 'Boulangerie', Icons.bakery_dining, 150),
];

// Plats maliens / ouest-africains + fast-food, prix FCFA réalistes.
const _dishes = <List<dynamic>>[
  // [nom, description, prix, section]
  ['Tiéboudienne', 'Riz au poisson, légumes mijotés', 2500, 'Plats'],
  ['Yassa poulet', 'Poulet mariné oignons-citron', 2700, 'Plats'],
  ['Mafé bœuf', 'Sauce arachide, riz blanc', 2800, 'Plats'],
  ['Riz gras', 'Riz sauce tomate & viande', 2200, 'Plats'],
  ['Poulet braisé', 'Demi-poulet, attiéké, piment', 3500, 'Plats'],
  ['Attiéké poisson', 'Semoule de manioc, poisson frit', 2600, 'Plats'],
  ['Capitaine braisé', 'Poisson entier, alloco', 4200, 'Plats'],
  ['Alloco', 'Bananes plantain frites', 1000, 'Entrées'],
  ['Fataya', 'Beignets fourrés viande (x4)', 1200, 'Entrées'],
  ['Salade avocat', 'Avocat, tomate, vinaigrette', 1800, 'Entrées'],
  ['Pizza Niarela', 'Mozzarella, poivron, bœuf', 4500, 'Pizzas'],
  ['Burger maison', 'Steak, cheddar, frites', 3200, 'Burgers'],
  ['Shawarma poulet', 'Pain libanais, crudités', 2500, 'Burgers'],
  ['Jus de bissap', 'Hibiscus glacé (50cl)', 800, 'Boissons'],
  ['Jus de gingembre', 'Gingembre frais (50cl)', 900, 'Boissons'],
  ['Dégué', 'Mil, yaourt, vanille', 1000, 'Desserts'],
  ['Thiakry', 'Couscous de mil sucré', 1000, 'Desserts'],
  ['Café Touba', 'Café épicé au djar', 700, 'Boissons'],
];

const _storeNames = <List<dynamic>>[
  // [nom, cuisine, quartier]
  ['Aux Trois Fleuves', 'Restaurant · Café · Pâtisserie', 'Badalabougou'],
  ['Le Balafon', 'Cuisine malienne', 'Sébénikoro'],
  ['Chez Fatou', 'Grillades · Poissons', 'Missira'],
  ['Bamako Grill', 'Grill · Fast-food', 'Hamdallaye'],
  ['Le Djoliba', 'Restaurant africain', 'Quinzambougou'],
  ['Saveurs du Sahel', 'Spécialités locales', 'Djélibougou'],
  ['Tantie Awa', 'Cuisine maison', 'Magnambougou'],
  ['Fast Faso', 'Burgers · Poulet', 'ACI 2000'],
  ['Pizza Niarela', 'Pizzeria', 'Niarela'],
  ['Le Manding', 'Restaurant · Lounge', 'Cité du Niger'],
  ['Terrasse du Fleuve', 'Poissons · Grillades', 'Bozola'],
  ['Kilimanjaro', 'Panafricain', 'Faladié'],
  ['Chez Aminata', 'Tiéboudienne maison', 'Lafiabougou'],
  ['Le Wassoulou', 'Cuisine traditionnelle', 'Daoudabougou'],
  ['Amandine', 'Boulangerie · Pâtisserie', 'Hippodrome'],
  ['Sahel Food', 'Rapide & local', 'Sogoniko'],
  ['La Paillote', 'Grill · Bar', 'Baco Djicoroni'],
  ['Bamako Bites', 'Street food', 'Torokorobougou'],
];

List<Store> _build() {
  final stores = <Store>[];
  for (int i = 0; i < _storeNames.length; i++) {
    final n = _storeNames[i];
    // Produits : 7 plats tournants par commerce, prix légèrement variés.
    final products = <Product>[];
    for (int j = 0; j < 8; j++) {
      final d = _dishes[(i * 3 + j) % _dishes.length];
      final base = d[2] as int;
      final price = base + ((i * 50) % 300);
      products.add(Product(
        id: 's${i}_p$j',
        name: d[0] as String,
        desc: d[1] as String,
        price: price,
        image: _food(i * 2 + j),
        section: d[3] as String,
        popular: j < 3,
        discount: (j == 1 && i % 3 == 0) ? 18 : null,
      ));
    }
    final rating = 3.9 + ((i * 7) % 11) / 10.0; // 3.9 .. 4.9
    final reviews = 120 + (i * 137) % 900;
    final eta = 18 + (i * 5) % 28;
    final dist = 1.2 + ((i * 13) % 90) / 10.0;
    final free = i % 3 != 1;
    stores.add(Store(
      id: 'store_$i',
      name: n[0] as String,
      cuisine: n[1] as String,
      image: _storeImg(i),
      rating: double.parse(rating.toStringAsFixed(1)),
      reviews: reviews > 999 ? 999 : reviews,
      etaMin: eta,
      distanceKm: double.parse(dist.toStringAsFixed(1)),
      deliveryFee: free ? 0 : 500,
      verified: i % 4 != 3,
      freeDelivery: free,
      district: n[2] as String,
      products: products,
    ));
  }
  return stores;
}

/// Commerces « Repas » (restaurants — fiches menu photo).
final List<Store> foodStores = _build();

// ───────────────────────── Catégories « marché » (grille de produits) ─────────────────────────
// Produits rendus en tuiles icône (offline, cohérent), regroupés par rayon.

int _mp = 0; // compteur d'ids produits marché

Product _tile(String name, String desc, int price, String section, IconData icon, Color tone,
    {bool popular = false, int? discount}) {
  _mp++;
  return Product(
    id: 'mkt_$_mp',
    name: name,
    desc: desc,
    price: price,
    section: section,
    icon: icon,
    tone: tone,
    popular: popular,
    discount: discount,
  );
}

const _green = Color(0xFF2ECC71);
const _amber = Color(0xFFFFB300);
const _blue = Color(0xFF29B6F6);
const _pink = Color(0xFFEC5C8D);
const _violet = Color(0xFF7C6CF6);
const _brown = Color(0xFFB07C4F);
const _teal = Color(0xFF26C6B0);

final _supermarcheProducts = <Product>[
  _tile('Bananes', 'Régime · ~1 kg', 1200, 'Fruits & Légumes', Icons.eco, _green, popular: true),
  _tile('Tomates fraîches', 'Barquette 500 g', 750, 'Fruits & Légumes', Icons.local_florist, _green),
  _tile('Oignons', 'Filet 1 kg', 900, 'Fruits & Légumes', Icons.grass, _amber),
  _tile('Pommes de terre', 'Sac 2 kg', 1800, 'Fruits & Légumes', Icons.spa, _brown),
  _tile('Eau minérale', 'Pack 6 × 1,5 L', 2500, 'Boissons', Icons.water_drop, _blue, popular: true),
  _tile('Jus d\'orange', 'Brique 1 L', 1400, 'Boissons', Icons.local_drink, _amber),
  _tile('Coca-Cola', 'Pack 6 × 33 cl', 3000, 'Boissons', Icons.local_bar, _pink, discount: 15),
  _tile('Lait en poudre', 'Boîte 900 g', 4200, 'Épicerie', Icons.breakfast_dining, _blue),
  _tile('Riz parfumé', 'Sac 5 kg', 6500, 'Épicerie', Icons.rice_bowl, _amber, popular: true),
  _tile('Huile végétale', 'Bidon 2 L', 3800, 'Épicerie', Icons.oil_barrel, _green),
  _tile('Sucre', 'Paquet 1 kg', 800, 'Épicerie', Icons.grain, _violet),
  _tile('Pâtes', 'Spaghetti 500 g', 650, 'Épicerie', Icons.ramen_dining, _amber),
  _tile('Œufs frais', 'Plateau × 30', 3200, 'Frais', Icons.egg, _amber),
  _tile('Poulet fermier', 'Entier ~1,2 kg', 4500, 'Frais', Icons.set_meal, _pink),
  _tile('Yaourt nature', 'Pack × 4', 1600, 'Frais', Icons.icecream, _blue),
  _tile('Savon de Marseille', 'Lot × 3', 1500, 'Hygiène & Maison', Icons.soap, _teal),
  _tile('Papier hygiénique', 'Pack × 8', 2400, 'Hygiène & Maison', Icons.cleaning_services, _violet),
  _tile('Détergent lessive', 'Baril 3 kg', 5200, 'Hygiène & Maison', Icons.local_laundry_service, _blue),
];

final _pharmacieProducts = <Product>[
  _tile('Paracétamol 500 mg', 'Boîte × 16 comprimés', 1200, 'Douleur & Fièvre', Icons.medication, _blue, popular: true),
  _tile('Ibuprofène 400 mg', 'Boîte × 20', 1800, 'Douleur & Fièvre', Icons.medication_liquid, _pink),
  _tile('Aspirine', 'Boîte × 20', 1500, 'Douleur & Fièvre', Icons.healing, _green),
  _tile('Sirop antitussif', 'Flacon 125 ml', 2600, 'Rhume & Toux', Icons.local_drink, _amber),
  _tile('Pastilles gorge', 'Étui × 24', 1400, 'Rhume & Toux', Icons.air, _teal, popular: true),
  _tile('Sérum physiologique', 'Boîte × 10 dosettes', 1900, 'Rhume & Toux', Icons.water_drop, _blue),
  _tile('Sels de réhydratation', 'Boîte × 10 sachets', 1600, 'Digestion', Icons.science, _violet),
  _tile('Charbon végétal', 'Boîte × 30 gélules', 2200, 'Digestion', Icons.medication, _brown),
  _tile('Gel hydroalcoolique', 'Flacon 100 ml', 1500, 'Hygiène & Soins', Icons.sanitizer, _teal, popular: true),
  _tile('Pansements assortis', 'Boîte × 20', 1300, 'Hygiène & Soins', Icons.healing, _pink),
  _tile('Thermomètre digital', 'Écran LCD', 4500, 'Hygiène & Soins', Icons.device_thermostat, _blue),
  _tile('Vitamine C', 'Tube × 20 effervescents', 2800, 'Vitamines', Icons.wb_sunny, _amber),
  _tile('Multivitamines', 'Boîte × 30 gélules', 5200, 'Vitamines', Icons.spa, _green),
  _tile('Lait bébé 1er âge', 'Boîte 400 g', 6800, 'Bébé & Maman', Icons.child_care, _blue),
  _tile('Couches T3', 'Paquet × 40', 5500, 'Bébé & Maman', Icons.baby_changing_station, _pink, discount: 10),
];

final _marcheProducts = <Product>[
  _tile('Tomates du jardin', 'Tas · ~1 kg', 600, 'Légumes', Icons.local_florist, _pink, popular: true),
  _tile('Gombo frais', 'Tas · 500 g', 500, 'Légumes', Icons.grass, _green),
  _tile('Piment fort', 'Sachet 200 g', 400, 'Légumes', Icons.local_fire_department, _pink),
  _tile('Aubergine locale', 'Tas · ~1 kg', 700, 'Légumes', Icons.eco, _violet),
  _tile('Mangue Kent', 'Pièce', 300, 'Fruits', Icons.spa, _amber, popular: true),
  _tile('Papaye', 'Pièce ~1 kg', 800, 'Fruits', Icons.emoji_food_beverage, _amber),
  _tile('Orange', 'Filet × 10', 1500, 'Fruits', Icons.circle, _amber),
  _tile('Poisson capitaine', 'Frais · ~1 kg', 3500, 'Viandes & Poissons', Icons.set_meal, _blue, popular: true),
  _tile('Viande de bœuf', 'Morceau · 1 kg', 3200, 'Viandes & Poissons', Icons.kebab_dining, _pink),
  _tile('Poulet local', 'Vivant · pièce', 4000, 'Viandes & Poissons', Icons.egg_alt, _amber),
  _tile('Riz local Gambiaka', 'Mesure · 1 kg', 550, 'Céréales & Épices', Icons.rice_bowl, _amber),
  _tile('Mil', 'Mesure · 1 kg', 500, 'Céréales & Épices', Icons.grain, _brown),
  _tile('Gingembre', 'Racine · 250 g', 600, 'Céréales & Épices', Icons.spa, _green),
  _tile('Soumbala', 'Boule traditionnelle', 500, 'Céréales & Épices', Icons.blur_circular, _brown),
];

final _boulangerieProducts = <Product>[
  _tile('Baguette tradition', 'Croustillante', 250, 'Pains', Icons.bakery_dining, _amber, popular: true),
  _tile('Pain complet', 'Farine complète', 500, 'Pains', Icons.breakfast_dining, _brown),
  _tile('Pain de mie', 'Sachet tranché', 900, 'Pains', Icons.crop_square, _amber),
  _tile('Croissant au beurre', 'Pur beurre', 400, 'Viennoiseries', Icons.cookie, _amber, popular: true),
  _tile('Pain au chocolat', 'Fourré chocolat', 450, 'Viennoiseries', Icons.cookie_outlined, _brown),
  _tile('Pain aux raisins', 'Crème pâtissière', 500, 'Viennoiseries', Icons.donut_small, _violet),
  _tile('Éclair au chocolat', 'Pâtisserie', 700, 'Pâtisseries', Icons.cake, _brown, discount: 12),
  _tile('Tarte aux pommes', 'Part individuelle', 800, 'Pâtisseries', Icons.pie_chart, _pink),
  _tile('Gâteau au yaourt', 'Moelleux', 600, 'Pâtisseries', Icons.cake_outlined, _amber),
  _tile('Fataya viande', 'Chausson × 2', 500, 'Snacks salés', Icons.lunch_dining, _pink, popular: true),
  _tile('Sandwich thon', 'Baguette garnie', 1200, 'Snacks salés', Icons.dinner_dining, _teal),
  _tile('Jus de bissap', 'Bouteille 50 cl', 500, 'Boissons', Icons.local_drink, _pink),
];

Store _market({
  required String id,
  required String name,
  required String cuisine,
  required String district,
  required int imgIndex,
  required double rating,
  required int reviews,
  required int eta,
  required double distanceKm,
  required bool free,
  required String kind,
  required List<Product> products,
}) =>
    Store(
      id: id,
      name: name,
      cuisine: cuisine,
      image: _storeImg(imgIndex),
      rating: rating,
      reviews: reviews,
      etaMin: eta,
      distanceKm: distanceKm,
      deliveryFee: free ? 0 : 500,
      verified: true,
      freeDelivery: free,
      district: district,
      products: products,
      kind: kind,
    );

final Map<String, List<Store>> _marketStores = {
  'supermarche': [
    _market(id: 'sm_0', name: 'Fourou Market', cuisine: 'Supermarché · Épicerie fine', district: 'Hamdallaye ACI', imgIndex: 1, rating: 4.6, reviews: 640, eta: 25, distanceKm: 2.1, free: true, kind: 'supermarche', products: _supermarcheProducts),
    _market(id: 'sm_1', name: 'Azalaï Supermarché', cuisine: 'Grande surface', district: 'ACI 2000', imgIndex: 3, rating: 4.4, reviews: 512, eta: 30, distanceKm: 3.4, free: false, kind: 'supermarche', products: _supermarcheProducts),
    _market(id: 'sm_2', name: 'Bakoro Market', cuisine: 'Supérette de quartier', district: 'Badalabougou', imgIndex: 5, rating: 4.7, reviews: 388, eta: 20, distanceKm: 1.3, free: true, kind: 'supermarche', products: _supermarcheProducts),
  ],
  'pharmacie': [
    _market(id: 'ph_0', name: 'Pharmacie du Point G', cuisine: 'Pharmacie · Parapharmacie', district: 'Point G', imgIndex: 2, rating: 4.8, reviews: 720, eta: 22, distanceKm: 2.6, free: true, kind: 'pharmacie', products: _pharmacieProducts),
    _market(id: 'ph_1', name: 'Pharmacie Fraternité', cuisine: 'Pharmacie de garde', district: 'Hamdallaye', imgIndex: 4, rating: 4.6, reviews: 455, eta: 18, distanceKm: 1.1, free: true, kind: 'pharmacie', products: _pharmacieProducts),
    _market(id: 'ph_2', name: 'Pharmacie de la Paix', cuisine: 'Pharmacie · Matériel médical', district: 'Baco Djicoroni', imgIndex: 0, rating: 4.5, reviews: 301, eta: 28, distanceKm: 4.0, free: false, kind: 'pharmacie', products: _pharmacieProducts),
  ],
  'marche': [
    _market(id: 'mc_0', name: 'Marché de Medina Coura', cuisine: 'Marché frais · Primeur', district: 'Medina Coura', imgIndex: 3, rating: 4.5, reviews: 610, eta: 35, distanceKm: 3.8, free: false, kind: 'marche', products: _marcheProducts),
    _market(id: 'mc_1', name: 'Grand Marché Rose', cuisine: 'Marché central', district: 'Centre-ville', imgIndex: 5, rating: 4.3, reviews: 540, eta: 40, distanceKm: 5.2, free: false, kind: 'marche', products: _marcheProducts),
    _market(id: 'mc_2', name: 'Marché Dabanani', cuisine: 'Vivres & épices', district: 'Dabanani', imgIndex: 1, rating: 4.4, reviews: 402, eta: 32, distanceKm: 4.5, free: true, kind: 'marche', products: _marcheProducts),
  ],
  'boulangerie': [
    _market(id: 'bl_0', name: 'Amandine', cuisine: 'Boulangerie · Pâtisserie', district: 'Hippodrome', imgIndex: 4, rating: 4.7, reviews: 820, eta: 18, distanceKm: 1.6, free: true, kind: 'boulangerie', products: _boulangerieProducts),
    _market(id: 'bl_1', name: 'Le Fournil de Bamako', cuisine: 'Pains & viennoiseries', district: 'Quinzambougou', imgIndex: 2, rating: 4.6, reviews: 470, eta: 20, distanceKm: 2.2, free: true, kind: 'boulangerie', products: _boulangerieProducts),
    _market(id: 'bl_2', name: 'Sucré Salé', cuisine: 'Pâtisserie fine', district: 'ACI 2000', imgIndex: 0, rating: 4.8, reviews: 356, eta: 24, distanceKm: 3.0, free: false, kind: 'boulangerie', products: _boulangerieProducts),
  ],
};

/// Tous les commerces (repas + marché) — utilisé par la recherche et le lookup favoris.
final List<Store> allStores = [
  ...foodStores,
  for (final list in _marketStores.values) ...list,
];

List<Store> storesForCategory(String catId) {
  if (catId == 'repas') return foodStores;
  return _marketStores[catId] ?? foodStores;
}
