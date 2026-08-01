import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'api_client.dart';
import 'env.dart';

/// Session d'authentification (JWT du Gateway).
/// Le token vit en mémoire (il expire), mais le numéro connecté est conservé au
/// coffre : au redémarrage à froid l'utilisateur retrouve sa session au lieu de
/// repasser par l'écran OTP.
class Session {
  static const _kPhoneKey = 'novigo.client.phone';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  String? token;
  String? userId;
  String? phone;

  /// Vrai dès qu'un numéro a été validé (indépendant du token, donc valable
  /// aussi en mode mock où aucun appel réseau n'est fait).
  bool signedIn = false;

  bool get authenticated => token != null;

  /// Restaure la session au démarrage. Best-effort : toute erreur ramène
  /// simplement à l'écran de connexion.
  Future<void> restore() async {
    try {
      final saved = await _storage.read(key: _kPhoneKey);
      if (saved == null || saved.isEmpty) return;
      phone = saved;
      _lastPhone = saved;
      signedIn = true;
      if (NovigoEnv.live) {
        try {
          await login(saved, NovigoEnv.demoPassword);
        } catch (_) {
          // Token indisponible (backend éteint) : la session UI reste ouverte.
        }
      }
    } catch (_) {
      // Coffre illisible : on repart sur l'écran de connexion.
    }
  }

  /// Mémorise le numéro validé pour les prochains lancements.
  Future<void> remember(String phone) async {
    signedIn = true;
    this.phone = phone;
    try {
      await _storage.write(key: _kPhoneKey, value: phone);
    } catch (_) {}
  }

  /// Déconnexion explicite : purge le coffre en plus de la mémoire.
  Future<void> signOut() async {
    logout();
    signedIn = false;
    try {
      await _storage.delete(key: _kPhoneKey);
    } catch (_) {}
  }

  // Dernières identifiants utilisés (pour ré-authentifier sur expiration du token).
  String _lastPhone = NovigoEnv.demoPhone;
  String _lastPassword = NovigoEnv.demoPassword;

  /// Garantit un token : connecte le client démo si nécessaire (mode live).
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
