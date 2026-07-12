import '../../../core/api/api_client.dart';

class OptionChoice {
  final String id;
  final String name;
  final int priceDelta;
  OptionChoice({required this.id, required this.name, this.priceDelta = 0});
  factory OptionChoice.fromJson(Map<String, dynamic> j) => OptionChoice(
        id: j['id'] as String,
        name: j['name'] as String,
        priceDelta: (j['priceDelta'] as num?)?.toInt() ?? 0,
      );
}

class OptionGroup {
  final String id;
  final String name;
  final int minSelect;
  final int maxSelect;
  final List<OptionChoice> choices;
  OptionGroup({
    required this.id,
    required this.name,
    this.minSelect = 0,
    this.maxSelect = 1,
    this.choices = const [],
  });
  bool get required => minSelect > 0;
  bool get multiple => maxSelect > 1;
  factory OptionGroup.fromJson(Map<String, dynamic> j) => OptionGroup(
        id: j['id'] as String,
        name: j['name'] as String,
        minSelect: (j['minSelect'] as num?)?.toInt() ?? 0,
        maxSelect: (j['maxSelect'] as num?)?.toInt() ?? 1,
        choices: ((j['choices'] as List?) ?? const [])
            .cast<Map<String, dynamic>>()
            .map(OptionChoice.fromJson)
            .toList(),
      );
}

class Product {
  final String id;
  final String name;
  final String? description;
  final String? category;
  final String? menuCategoryId;
  final Map<String, dynamic> price;
  final Map<String, dynamic> finalPrice;
  final int? promoPercent;
  final String? imageUrl;
  final List<String> images;
  final bool inStock;
  final String stockState; // AVAILABLE | LIMITED | OUT_OF_STOCK
  final List<OptionGroup> optionGroups;
  Product({
    required this.id,
    required this.name,
    this.description,
    this.category,
    this.menuCategoryId,
    required this.price,
    Map<String, dynamic>? finalPrice,
    this.promoPercent,
    this.imageUrl,
    this.images = const [],
    this.inStock = true,
    this.stockState = 'AVAILABLE',
    this.optionGroups = const [],
  }) : finalPrice = finalPrice ?? price;

  bool get hasPromo => (promoPercent ?? 0) > 0;
  bool get isOut => stockState == 'OUT_OF_STOCK';
  bool get hasOptions => optionGroups.isNotEmpty;
  int get baseAmount => (finalPrice['amount'] as num).toInt();

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] as String,
        name: j['name'] as String,
        description: j['description'] as String?,
        category: j['category'] as String?,
        menuCategoryId: j['menuCategoryId'] as String?,
        price: (j['price'] as Map).cast<String, dynamic>(),
        finalPrice: (j['finalPrice'] as Map?)?.cast<String, dynamic>(),
        promoPercent: (j['promoPercent'] as num?)?.toInt(),
        imageUrl: j['imageUrl'] as String?,
        images: ((j['images'] as List?) ?? const []).map((e) => e.toString()).toList(),
        inStock: j['inStock'] as bool? ?? true,
        stockState: (j['stockState'] ?? 'AVAILABLE').toString(),
        optionGroups: ((j['optionGroups'] as List?) ?? const [])
            .cast<Map<String, dynamic>>()
            .map(OptionGroup.fromJson)
            .toList(),
      );
}

class CatalogRepository {
  CatalogRepository(this._api);
  final ApiClient _api;

  Future<List<Product>> list({int page = 1, String? search, String? category}) async {
    final env = await _api.getEnvelope('/products', query: {
      'page': page,
      'limit': 50,
      if (search != null && search.isNotEmpty) 'search': search,
      if (category != null && category.isNotEmpty) 'category': category,
    });
    final data = (env['data'] as List).cast<Map<String, dynamic>>();
    return data.map(Product.fromJson).toList();
  }
}
