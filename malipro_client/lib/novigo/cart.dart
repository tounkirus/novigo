import 'package:flutter/foundation.dart';
import 'models.dart';

/// Panier global réactif (démo, en mémoire).
class CartModel extends ChangeNotifier {
  final List<CartLine> lines = [];

  int get count => lines.fold(0, (s, l) => s + l.qty);
  int get subtotal => lines.fold(0, (s, l) => s + l.total);
  int get deliveryFee => lines.isEmpty ? 0 : (lines.first.store.deliveryFee);
  int get total => subtotal + deliveryFee;
  Store? get store => lines.isEmpty ? null : lines.first.store;

  int qtyOf(Product p) =>
      lines.where((l) => l.product.id == p.id).fold(0, (s, l) => s + l.qty);

  void add(Product p, Store s) {
    final existing = lines.where((l) => l.product.id == p.id);
    if (existing.isNotEmpty) {
      existing.first.qty++;
    } else {
      lines.add(CartLine(p, s, 1));
    }
    notifyListeners();
  }

  void remove(Product p) {
    final existing = lines.where((l) => l.product.id == p.id);
    if (existing.isEmpty) return;
    final line = existing.first;
    line.qty--;
    if (line.qty <= 0) lines.remove(line);
    notifyListeners();
  }

  void clear() {
    lines.clear();
    notifyListeners();
  }
}

final cart = CartModel();
