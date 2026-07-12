import '../../../core/api/api_client.dart';
import '../../catalog/data/catalog_repository.dart';

/// Une boutique (vitrine commerçant) vue par le client.
class Store {
  final String id;
  final String name;
  final String? category;
  final String? logoUrl;
  final String? coverUrl;
  final double rating;
  final bool isOpen;
  final int? productCount;
  Store({
    required this.id,
    required this.name,
    this.category,
    this.logoUrl,
    this.coverUrl,
    this.rating = 0,
    this.isOpen = true,
    this.productCount,
  });
  factory Store.fromJson(Map<String, dynamic> j) => Store(
        id: j['id'] as String,
        name: (j['name'] ?? '').toString(),
        category: j['category'] as String?,
        logoUrl: j['logoUrl'] as String?,
        coverUrl: j['coverUrl'] as String?,
        rating: ((j['rating'] as num?) ?? 0).toDouble(),
        isOpen: j['isOpen'] as bool? ?? true,
        productCount: (j['productCount'] as num?)?.toInt(),
      );
}

/// Détail d'une boutique + ses produits.
class StoreDetail {
  final Store store;
  final List<Product> products;
  StoreDetail(this.store, this.products);
  factory StoreDetail.fromJson(Map<String, dynamic> j) => StoreDetail(
        Store.fromJson(j),
        ((j['products'] as List?) ?? const [])
            .cast<Map<String, dynamic>>()
            .map(Product.fromJson)
            .toList(),
      );
}

class StoresRepository {
  StoresRepository(this._api);
  final ApiClient _api;

  Future<List<Store>> list({int page = 1, String? search}) async {
    final env = await _api.getEnvelope('/stores', query: {
      'page': page,
      'limit': 30,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return (env['data'] as List)
        .cast<Map<String, dynamic>>()
        .map(Store.fromJson)
        .toList();
  }

  Future<StoreDetail> detail(String id) async {
    final data = await _api.get('/stores/$id') as Map<String, dynamic>;
    return StoreDetail.fromJson(data);
  }
}
