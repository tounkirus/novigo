import 'package:flutter/foundation.dart';

/// État des favoris (commerces aimés). Persistance en mémoire pour la démo.
class FavoritesModel extends ChangeNotifier {
  final Set<String> _ids = {'store_0', 'store_4'}; // quelques favoris par défaut

  bool contains(String id) => _ids.contains(id);
  int get count => _ids.length;
  Set<String> get ids => _ids;

  void toggle(String id) {
    if (_ids.contains(id)) {
      _ids.remove(id);
    } else {
      _ids.add(id);
    }
    notifyListeners();
  }
}

final favorites = FavoritesModel();
