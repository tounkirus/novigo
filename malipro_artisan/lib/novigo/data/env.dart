/// Configuration runtime NOVIGO de l'application artisan.
///
/// Par défaut : hors ligne (l'application garde son fonctionnement d'origine).
/// Mode live vers le Gateway :
///   flutter run --dart-define=NOVIGO_LIVE=true \
///     --dart-define=NOVIGO_API=http://10.0.2.2:8088/api/v1
///
/// 10.0.2.2 = hôte de la machine vu depuis l'émulateur Android → Gateway :8088.
class NovigoEnv {
  static const bool live = bool.fromEnvironment('NOVIGO_LIVE', defaultValue: false);

  static const String apiBase =
      String.fromEnvironment('NOVIGO_API', defaultValue: 'http://10.0.2.2:8088/api/v1');

  // Identifiants démo (login = téléphone + mot de passe). Artisan seedé : Oumar, plombier.
  static const String demoPhone =
      String.fromEnvironment('NOVIGO_PHONE', defaultValue: '+22379000000');
  static const String demoPassword =
      String.fromEnvironment('NOVIGO_PASSWORD', defaultValue: 'admin123');

  /// Ouvre directement l'écran des annonces vocales au démarrage (démonstration).
  /// Sans ce drapeau, l'application démarre exactement comme avant.
  static const bool voiceHome = bool.fromEnvironment('NOVIGO_VOICE_HOME', defaultValue: false);

  /// Origine (sans /api/v1) pour la connexion Socket.IO du Gateway.
  static String get wsOrigin {
    final i = apiBase.indexOf('/api/');
    return i > 0 ? apiBase.substring(0, i) : apiBase;
  }
}
