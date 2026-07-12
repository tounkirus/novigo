import '../../../core/api/api_client.dart';

/// Un artisan tel que vu par le client (vitrine).
class Artisan {
  final String id;
  final String profession;
  final String? bio;
  final double rating;
  final String? serviceArea;
  final String? name;
  final String? photoUrl;
  final int serviceCount;
  Artisan({
    required this.id,
    required this.profession,
    this.bio,
    this.rating = 0,
    this.serviceArea,
    this.name,
    this.photoUrl,
    this.serviceCount = 0,
  });
  factory Artisan.fromJson(Map<String, dynamic> j) => Artisan(
        id: j['id'] as String,
        profession: (j['profession'] ?? '').toString(),
        bio: j['bio'] as String?,
        rating: ((j['rating'] as num?) ?? 0).toDouble(),
        serviceArea: j['serviceArea'] as String?,
        name: j['name'] as String?,
        photoUrl: j['photoUrl'] as String?,
        serviceCount: ((j['serviceCount'] as num?) ?? 0).toInt(),
      );

  /// Libellé d'affichage : nom si présent, sinon le métier.
  String get displayName =>
      (name != null && name!.trim().isNotEmpty) ? name! : profession;
}

/// Un service proposé par un artisan.
class ArtisanService {
  final String id;
  final String title;
  final String? description;
  final Map<String, dynamic> price;
  final int? durationMinutes;
  final String? imageUrl;
  ArtisanService({
    required this.id,
    required this.title,
    this.description,
    required this.price,
    this.durationMinutes,
    this.imageUrl,
  });
  factory ArtisanService.fromJson(Map<String, dynamic> j) => ArtisanService(
        id: j['id'] as String,
        title: j['title'] as String,
        description: j['description'] as String?,
        price: (j['price'] as Map).cast<String, dynamic>(),
        durationMinutes: (j['durationMinutes'] as num?)?.toInt(),
        imageUrl: j['imageUrl'] as String?,
      );
}

/// Détail d'un artisan + ses services.
class ArtisanDetail {
  final Artisan artisan;
  final List<ArtisanService> services;
  ArtisanDetail(this.artisan, this.services);
  factory ArtisanDetail.fromJson(Map<String, dynamic> j) => ArtisanDetail(
        Artisan.fromJson(j),
        ((j['services'] as List?) ?? const [])
            .cast<Map<String, dynamic>>()
            .map(ArtisanService.fromJson)
            .toList(),
      );
}

/// Une demande de devis envoyée par le client.
class Quotation {
  final String id;
  final String? artisanName;
  final String? artisanProfession;
  final String description;
  final Map<String, dynamic> amount;
  final String status;
  Quotation({
    required this.id,
    this.artisanName,
    this.artisanProfession,
    required this.description,
    required this.amount,
    required this.status,
  });
  factory Quotation.fromJson(Map<String, dynamic> j) => Quotation(
        id: j['id'] as String,
        artisanName: j['artisanName'] as String?,
        artisanProfession: j['artisanProfession'] as String?,
        description: (j['description'] ?? '').toString(),
        amount: (j['amount'] as Map).cast<String, dynamic>(),
        status: (j['status'] ?? '').toString(),
      );
}

class ServicesRepository {
  ServicesRepository(this._api);
  final ApiClient _api;

  Future<List<Artisan>> listArtisans({int page = 1, String? search}) async {
    final env = await _api.getEnvelope('/artisans', query: {
      'page': page,
      'limit': 30,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return (env['data'] as List)
        .cast<Map<String, dynamic>>()
        .map(Artisan.fromJson)
        .toList();
  }

  Future<ArtisanDetail> artisanDetail(String id) async {
    final data = await _api.get('/artisans/$id') as Map<String, dynamic>;
    return ArtisanDetail.fromJson(data);
  }

  Future<void> requestQuotation(
      String artisanId, String description, int? budget) async {
    await _api.post('/artisans/$artisanId/quotations', body: {
      'description': description,
      if (budget != null && budget > 0) 'budget': budget,
    });
  }

  /// Le client accepte ou refuse le devis proposé (status: ACCEPTED | REJECTED).
  Future<void> respondQuotation(String id, String status) async {
    await _api.patch('/customers/me/quotations/$id', body: {'status': status});
  }

  Future<List<Quotation>> myQuotations() async {
    final env = await _api.getEnvelope('/customers/me/quotations',
        query: {'page': 1, 'limit': 50});
    return (env['data'] as List)
        .cast<Map<String, dynamic>>()
        .map(Quotation.fromJson)
        .toList();
  }
}
