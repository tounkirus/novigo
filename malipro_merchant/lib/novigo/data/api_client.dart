import 'package:dio/dio.dart';
import 'env.dart';
import 'session.dart';

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

  Future<dynamic> post(String path, {Object? body, bool auth = true}) async {
    return _send(auth, () => _dio.post(path, data: body, options: _opts(auth: auth)));
  }

  /// Exécute la requête et, sur 401 (token expiré), ré-authentifie une fois puis réessaie.
  /// `_opts` relit `session.token` à chaque exécution, donc le retry porte le nouveau token.
  Future<dynamic> _send(bool auth, Future<Response> Function() call) async {
    try {
      final r = await call();
      return _unwrap(r.data);
    } on DioException catch (e) {
      if (auth && e.response?.statusCode == 401 && session.token != null) {
        await session.reauthenticate();
        final r = await call();
        return _unwrap(r.data);
      }
      rethrow;
    }
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

/// Singleton (même pattern que `merchant`).
final api = ApiClient();
