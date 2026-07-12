import 'package:dio/dio.dart';
import '../config.dart';
import '../storage/token_storage.dart';

class ApiException implements Exception {
  final int status;
  final String code;
  final String message;
  ApiException(this.status, this.code, this.message);
  @override
  String toString() => message;
}

/// Client HTTP : ajoute le Bearer, rafraîchit sur 401, déballe l'enveloppe
/// { success, data, meta } du contrat MALIPRO.
class ApiClient {
  ApiClient(this._tokens) {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
    ));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final t = await _tokens.read();
        if (t != null) options.headers['Authorization'] = 'Bearer ${t.accessToken}';
        handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401 && !_retried(e.requestOptions)) {
          final refreshed = await _refresh();
          if (refreshed) {
            final opts = e.requestOptions..extra['retried'] = true;
            final t = await _tokens.read();
            opts.headers['Authorization'] = 'Bearer ${t!.accessToken}';
            try {
              final clone = await _dio.fetch(opts);
              return handler.resolve(clone);
            } catch (_) {}
          }
          await _tokens.clear();
        }
        handler.next(e);
      },
    ));
  }

  late final Dio _dio;
  final TokenStorage _tokens;

  bool _retried(RequestOptions o) => o.extra['retried'] == true;

  Future<bool> _refresh() async {
    final t = await _tokens.read();
    if (t == null) return false;
    try {
      final res = await Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl)).post(
        '/auth/refresh-token',
        data: {'refreshToken': t.refreshToken},
        options: Options(headers: {'Authorization': 'Bearer ${t.refreshToken}'}),
      );
      final data = res.data['data'] as Map<String, dynamic>;
      await _tokens.write(Tokens(data['accessToken'] as String, data['refreshToken'] as String));
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    return _unwrap(() => _dio.get(path, queryParameters: query));
  }

  Future<dynamic> post(String path, {Object? body}) async {
    return _unwrap(() => _dio.post(path, data: body));
  }

  Future<dynamic> patch(String path, {Object? body}) async {
    return _unwrap(() => _dio.patch(path, data: body));
  }

  Future<void> delete(String path) async {
    try {
      await _dio.delete(path);
    } on DioException catch (e) {
      throw _map(e);
    }
  }

  /// Renvoie l'enveloppe complète (pour les listes paginées : { data, meta }).
  Future<Map<String, dynamic>> getEnvelope(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get(path, queryParameters: query);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _map(e);
    }
  }

  Future<dynamic> _unwrap(Future<Response> Function() run) async {
    try {
      final res = await run();
      final body = res.data;
      if (body is Map<String, dynamic>) return body['data'];
      return body;
    } on DioException catch (e) {
      throw _map(e);
    }
  }

  ApiException _map(DioException e) {
    final status = e.response?.statusCode ?? 0;
    final err = (e.response?.data is Map) ? e.response?.data['error'] : null;
    return ApiException(
      status,
      (err?['code'] as String?) ?? 'ERROR',
      (err?['message'] as String?) ?? 'Une erreur est survenue.',
    );
  }
}
