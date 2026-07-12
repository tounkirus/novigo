import 'api_client.dart';
import 'env.dart';

/// Session d'authentification (JWT du Gateway). En mémoire pour la démo.
/// Login = téléphone + mot de passe (contrat Nest /auth/login).
class Session {
  String? token;
  String? userId;
  String? phone;

  bool get authenticated => token != null;

  // Derniers identifiants utilisés (pour ré-authentifier sur expiration du token).
  String _lastPhone = NovigoEnv.demoPhone;
  String _lastPassword = NovigoEnv.demoPassword;

  /// Garantit un token : connecte le marchand démo si nécessaire (mode live).
  Future<void> ensureAuth() async {
    if (token != null) return;
    await login(NovigoEnv.demoPhone, NovigoEnv.demoPassword);
  }

  /// Ré-authentification transparente après un 401 (token expiré) : rejoue le
  /// dernier login réussi pour obtenir un nouveau token, sans déconnecter l'utilisateur.
  Future<void> reauthenticate() async {
    token = null;
    await login(_lastPhone, _lastPassword);
  }

  Future<void> login(String phone, String password) async {
    final data = await api.post('/auth/login',
        body: {'phone': phone, 'password': password}, auth: false);
    token = (data is Map ? data['accessToken'] : null)?.toString();
    userId = (data is Map && data['user'] is Map ? data['user']['id'] : null)?.toString();
    this.phone = phone;
    _lastPhone = phone;
    _lastPassword = password;
  }

  void logout() {
    token = null;
    userId = null;
    phone = null;
  }
}

final session = Session();
