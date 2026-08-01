import 'package:dio/dio.dart';
import 'env.dart';
import 'session.dart';

/// Page de résultats : les éléments + la pagination renvoyée par le backend.
class PagedResult {
  final List<Map> items;
  final int total;
  final int totalPages;
  const PagedResult({required this.items, required this.total, required this.totalPages});
}

/// Erreur applicative (message déballé de l'enveloppe backend).
class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

/// Client HTTP vers le NOVIGO API Gateway. Déballe l'enveloppe {success,data,meta}
/// et joint le Bearer token courant (session) automatiquement.
class ApiClient {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: NovigoEnv.apiBase,
    connectTimeout: const Duration(seconds: 6),
    receiveTimeout: const Duration(seconds: 8),
    headers: {'Content-Type': 'application/json'},
  ));

  Options _opts({bool auth = true}) => Options(
        headers: (auth && session.token != null)
            ? {'Authorization': 'Bearer ${session.token}'}
            : null,
      );

  Future<dynamic> get(String path, {Map<String, dynamic>? query, bool auth = true}) async {
    return _send(auth, () => _dio.get(path, queryParameters: query, options: _opts(auth: auth)));
  }

  /// Variante paginée : conserve `meta` (total, totalPages), indispensable dès
  /// que la liste dépasse une page — le catalogue en compte des centaines.
  Future<PagedResult> getPage(String path, {Map<String, dynamic>? query, bool auth = true}) async {
    final raw = await _sendRaw(
      auth,
      () => _dio.get(path, queryParameters: query, options: _opts(auth: auth)),
    );
    if (raw is! Map) return const PagedResult(items: [], total: 0, totalPages: 1);
    final data = raw['data'];
    final meta = raw['meta'];
    final items = (data as List?)?.whereType<Map>().toList() ?? const <Map>[];
    return PagedResult(
      items: items,
      total: (meta is Map ? (meta['total'] as num?)?.toInt() : null) ?? items.length,
      totalPages: (meta is Map ? (meta['totalPages'] as num?)?.toInt() : null) ?? 1,
    );
  }

  Future<dynamic> post(String path, {Object? body, bool auth = true}) async {
    return _send(auth, () => _dio.post(path, data: body, options: _opts(auth: auth)));
  }

  /// Exécute la requête et, sur 401 (token expiré), ré-authentifie une fois puis réessaie.
  /// `_opts` relit `session.token` à chaque exécution, donc le retry porte le nouveau token.
  Future<dynamic> _send(bool auth, Future<Response> Function() call) async {
    return _unwrap(await _sendRaw(auth, call));
  }

  /// Même politique de retry, mais renvoie l'enveloppe complète (data + meta).
  Future<dynamic> _sendRaw(bool auth, Future<Response> Function() call) async {
    try {
      final r = await call();
      return _checked(r.data);
    } on DioException catch (e) {
      if (auth && e.response?.statusCode == 401 && session.token != null) {
        await session.reauthenticate();
        final r = await call();
        return _checked(r.data);
      }
      rethrow;
    }
  }

  dynamic _checked(dynamic data) {
    if (data is Map && data['success'] == false) {
      final msg = (data['error'] is Map ? data['error']['message'] : null) ?? 'Erreur API';
      throw ApiException(msg.toString());
    }
    return data;
  }

  dynamic _unwrap(dynamic data) {
    if (data is Map) {
      if (data['success'] == true) return data['data'];
      if (data['success'] == false) {
        final msg = (data['error'] is Map ? data['error']['message'] : null) ?? 'Erreur API';
        throw ApiException(msg.toString());
      }
    }
    return data;
  }
}

/// Singleton (même pattern que cart/favorites).
final api = ApiClient();
