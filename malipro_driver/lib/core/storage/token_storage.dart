import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class Tokens {
  final String accessToken;
  final String refreshToken;
  const Tokens(this.accessToken, this.refreshToken);

  Map<String, dynamic> toJson() =>
      {'accessToken': accessToken, 'refreshToken': refreshToken};
  factory Tokens.fromJson(Map<String, dynamic> j) =>
      Tokens(j['accessToken'] as String, j['refreshToken'] as String);
}

class TokenStorage {
  static const _key = 'novigo.driver.tokens';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Tokens?> read() async {
    final raw = await _storage.read(key: _key);
    if (raw == null) return null;
    return Tokens.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> write(Tokens tokens) =>
      _storage.write(key: _key, value: jsonEncode(tokens.toJson()));

  Future<void> clear() => _storage.delete(key: _key);
}
