import 'package:local_auth/local_auth.dart';

/// Déverrouillage biométrique (empreinte / visage) au démarrage.
/// [À compléter] : brancher sur un flux de "quick unlock" après une 1re connexion OTP.
class BiometricService {
  final LocalAuthentication _auth = LocalAuthentication();

  Future<bool> isAvailable() async {
    try {
      return await _auth.canCheckBiometrics || await _auth.isDeviceSupported();
    } catch (_) {
      return false;
    }
  }

  Future<bool> authenticate() async {
    try {
      return await _auth.authenticate(
        localizedReason: 'Confirmez votre identité',
        options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
      );
    } catch (_) {
      return false;
    }
  }
}
