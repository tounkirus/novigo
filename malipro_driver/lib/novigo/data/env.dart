/// Configuration runtime de l'app livreur NOVIGO.
///
/// Par défaut : MOCK offline (démo zéro-infra). Passer en LIVE via --dart-define :
///   flutter run --dart-define=NOVIGO_LIVE=true \
///     --dart-define=NOVIGO_API=http://10.0.2.2:8088/api/v1
///
/// 10.0.2.2 = hôte de la machine vu depuis l'émulateur Android → Gateway :8088.
class NovigoEnv {
  static const bool live = bool.fromEnvironment('NOVIGO_LIVE', defaultValue: false);

  static const String apiBase =
      String.fromEnvironment('NOVIGO_API', defaultValue: 'http://10.0.2.2:8088/api/v1');

  // Identifiants démo (login = téléphone + mot de passe). Livreur seedé.
  static const String demoPhone =
      String.fromEnvironment('NOVIGO_PHONE', defaultValue: '+22375000001');
  static const String demoPassword =
      String.fromEnvironment('NOVIGO_PASSWORD', defaultValue: 'admin123');

  /// Origine (sans /api/v1) pour la connexion WebSocket Socket.IO du Gateway.
  static String get wsOrigin {
    final i = apiBase.indexOf('/api/');
    return i > 0 ? apiBase.substring(0, i) : apiBase;
  }
}
