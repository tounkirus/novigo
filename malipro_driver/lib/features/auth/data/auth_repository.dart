import '../../../core/api/api_client.dart';

class AuthRepository {
  AuthRepository(this._api);
  final ApiClient _api;

  /// Déclenche l'envoi de l'OTP d'inscription livreur (/auth/register).
  Future<void> requestOtp(String phone) async {
    await _api.post('/auth/register', body: {'phone': phone, 'role': 'DRIVER'});
  }

  /// Vérifie l'OTP et renvoie les tokens (+ user). /auth/verify-otp.
  Future<Map<String, dynamic>> verifyOtp(String phone, String code) async {
    final data = await _api.post('/auth/verify-otp', body: {'phone': phone, 'code': code});
    return data as Map<String, dynamic>;
  }

  /// Connexion par mot de passe (comptes provisionnés).
  Future<Map<String, dynamic>> loginWithPassword(String phone, String password) async {
    final data = await _api.post('/auth/login', body: {'phone': phone, 'password': password});
    return data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> me() async {
    return await _api.get('/users/me') as Map<String, dynamic>;
  }
}

final class AuthResult {
  final String accessToken;
  final String refreshToken;
  final Map<String, dynamic>? user;
  AuthResult(this.accessToken, this.refreshToken, this.user);
  factory AuthResult.from(Map<String, dynamic> d) => AuthResult(
        d['accessToken'] as String,
        d['refreshToken'] as String,
        d['user'] as Map<String, dynamic>?,
      );
}
