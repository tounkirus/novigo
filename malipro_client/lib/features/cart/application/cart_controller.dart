import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../catalog/data/catalog_repository.dart';

/// Une ligne de panier = un produit + une combinaison d'options choisie.
/// Deux fois le même produit avec des options différentes = deux lignes.
class CartLine {
  final Product product;
  final int quantity;
  final List<String> choiceIds; // options sélectionnées
  final int unitPrice; // prix promo + suppléments d'options
  final String? optionsLabel; // ex. "Taille: L, Sauce: Piment"
  const CartLine(this.product, this.quantity,
      {this.choiceIds = const [], required this.unitPrice, this.optionsLabel});

  int get lineTotal => unitPrice * quantity;

  /// Clé d'unicité : produit + combinaison d'options triée.
  String get key {
    final sorted = [...choiceIds]..sort();
    return '${product.id}|${sorted.join(",")}';
  }

  CartLine withQuantity(int q) => CartLine(product, q,
      choiceIds: choiceIds, unitPrice: unitPrice, optionsLabel: optionsLabel);
}

class CartController extends StateNotifier<List<CartLine>> {
  CartController() : super(const []);

  /// Ajout simple (produit sans options) : au prix promo de base.
  void add(Product p) => addConfigured(p, const [], p.baseAmount, null);

  /// Ajout avec options : prix et libellé déjà résolus par l'appelant.
  void addConfigured(Product p, List<String> choiceIds, int unitPrice, String? optionsLabel) {
    final line = CartLine(p, 1, choiceIds: choiceIds, unitPrice: unitPrice, optionsLabel: optionsLabel);
    final idx = state.indexWhere((l) => l.key == line.key);
    if (idx == -1) {
      state = [...state, line];
    } else {
      state = [...state]..[idx] = state[idx].withQuantity(state[idx].quantity + 1);
    }
  }

  void decrementKey(String key) {
    final idx = state.indexWhere((l) => l.key == key);
    if (idx == -1) return;
    final l = state[idx];
    if (l.quantity <= 1) {
      state = [...state]..removeAt(idx);
    } else {
      state = [...state]..[idx] = l.withQuantity(l.quantity - 1);
    }
  }

  void incrementKey(String key) {
    final idx = state.indexWhere((l) => l.key == key);
    if (idx == -1) return;
    state = [...state]..[idx] = state[idx].withQuantity(state[idx].quantity + 1);
  }

  void clear() => state = const [];

  int get total => state.fold(0, (sum, l) => sum + l.lineTotal);
  int get count => state.fold(0, (sum, l) => sum + l.quantity);
}

final cartControllerProvider =
    StateNotifierProvider<CartController, List<CartLine>>((ref) => CartController());

final cartTotalProvider = Provider<int>((ref) {
  final lines = ref.watch(cartControllerProvider);
  return lines.fold(0, (sum, l) => sum + l.lineTotal);
});
