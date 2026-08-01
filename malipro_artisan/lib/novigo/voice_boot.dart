import 'dart:async';

import 'package:flutter/foundation.dart';

import 'data/env.dart';
import 'data/realtime_client.dart';
import 'data/session.dart';
import 'data/voice_api.dart';
import 'voice_service.dart';

/// Démarrage des annonces vocales dans l'application artisan.
///
/// Volontairement indépendant de l'authentification historique de l'app : le
/// module vocal ouvre sa propre session NOVIGO (compte artisan) et écoute le
/// Gateway. Hors mode live, il ne fait rien du tout — le comportement d'origine
/// de l'application est strictement inchangé.
Future<void> startVoiceDispatch() async {
  if (!NovigoEnv.live) return;
  try {
    await session.ensureAuth();
  } catch (e) {
    debugPrint('[Artisan] session NOVIGO indisponible: $e');
    return;
  }
  // Le moteur vocal n'est jamais sur le chemin critique : il se prépare à côté.
  unawaited(voice.init().then((_) => voice.loadSettings()));
  novigoRealtime.connect(
    onVoice: (d) => voice.announce(VoiceAnnouncement.fromJson(d)),
  );
}
