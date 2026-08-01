import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

import 'data/env.dart';
import 'data/voice_api.dart';

/// LECTURE VOCALE DES MISSIONS (Voice Dispatch, côté appareil).
///
/// Le serveur envoie une phrase déjà composée ; ce service la prononce avec les
/// réglages du prestataire, la répète si demandé, puis accuse réception. Chaque
/// échec est remonté au serveur avec son motif (moteur absent, coupure…), pour
/// qu'une annonce « envoyée » ne soit jamais confondue avec une annonce entendue.
class VoiceService extends ChangeNotifier {
  final FlutterTts _tts = FlutterTts();
  bool _ready = false;
  bool _speaking = false;

  /// Dernière annonce prononcée (affichée dans l'écran de réglages).
  String? lastSpoken;
  DateTime? lastSpokenAt;

  /// Dernier problème rencontré, en clair, pour l'écran de réglages.
  String? lastError;

  /// Réglages courants — servent aussi de repli si le serveur est injoignable.
  VoiceSettings settings = const VoiceSettings();

  /// Nombre d'annonces reçues du serveur (diagnostic affiché dans les réglages :
  /// distingue « rien reçu » de « reçu mais pas prononcé »).
  int received = 0;

  /// Annonces déjà prononcées : le serveur pousse la même annonce en réponse HTTP
  /// ET en temps réel ; elle ne doit être entendue qu'une fois.
  final Set<String> _dejaLues = <String>{};

  bool get speaking => _speaking;
  bool get available => _ready;

  /// Prépare le moteur du téléphone. Sans moteur TTS installé, on reste
  /// silencieux mais l'application continue de fonctionner normalement.
  Future<void> init() async {
    try {
      // Le moteur peut mettre plusieurs secondes à se lier au démarrage. On ne
      // le déclare PAS absent pour autant : l'indisponibilité réelle se constate
      // à la première lecture, pas sur une simple lenteur d'initialisation.
      await _tts.awaitSpeakCompletion(true).timeout(const Duration(seconds: 8));
    } catch (e) {
      debugPrint('[Voice] initialisation lente: $e');
    }
    _ready = true;
    notifyListeners();
  }

  /// Charge les réglages du serveur (repli : réglages locaux courants).
  Future<void> loadSettings() async {
    if (!NovigoEnv.live) return;
    try {
      final s = await voiceApi.fetchSettings();
      if (s != null) {
        settings = s;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[Voice] réglages indisponibles: $e');
    }
  }

  /// Enregistre les réglages côté serveur (et localement quoi qu'il arrive).
  Future<void> saveSettings(VoiceSettings s) async {
    settings = s;
    notifyListeners();
    if (!NovigoEnv.live) return;
    try {
      final saved = await voiceApi.updateSettings(s);
      if (saved != null) {
        settings = saved;
        notifyListeners();
      }
    } catch (e) {
      lastError = 'Réglages non enregistrés (hors ligne)';
      debugPrint('[Voice] sauvegarde échec: $e');
      notifyListeners();
    }
  }

  /// Code de langue du moteur. Android/iOS n'embarquent pas de voix bambara :
  /// on tente `bm-ML`, et à défaut on lit le texte avec la voix française
  /// plutôt que de rester muet (le repli est tracé, pas caché).
  Future<String?> _resolveLocale(String language) async {
    List<String> dispo = const [];
    try {
      final langues = await _tts.getLanguages;
      dispo = ((langues as List?) ?? const []).map((l) => l.toString().toLowerCase()).toList();
    } catch (_) {
      /* liste inconnue : on tentera la langue demandée telle quelle */
    }
    if (language == 'bm') {
      if (dispo.any((l) => l.startsWith('bm'))) return 'bm-ML';
      lastError = 'Voix bambara absente de l’appareil : lecture avec la voix française';
    }
    // Une voix française non installée fait échouer la lecture en silence : dans ce
    // cas on laisse le moteur utiliser SA langue par défaut plutôt que de rester muet.
    if (dispo.isNotEmpty && !dispo.any((l) => l.startsWith('fr'))) {
      lastError = 'Voix française absente de l’appareil : lecture avec la voix par défaut';
      return null;
    }
    return 'fr-FR';
  }

  /// Prononce une annonce reçue du serveur, puis accuse réception.
  Future<void> announce(VoiceAnnouncement a) async {
    received++;
    notifyListeners();
    if (!settings.enabled) return;
    if (a.text.trim().isEmpty) return;
    if (a.id != null && !_dejaLues.add(a.id!)) return; // déjà prononcée
    if (_dejaLues.length > 50) _dejaLues.remove(_dejaLues.first);

    if (!_ready) {
      await _ack(a, played: false, error: 'TTS_UNAVAILABLE');
      return;
    }

    _speaking = true;
    notifyListeners();
    try {
      final locale = await _resolveLocale(a.language);
      if (locale != null) await _tts.setLanguage(locale);
      // Le moteur attend un débit 0–1 ; la vitesse utilisateur (0,5–2) est ramenée
      // sur cette plage autour du réglage neutre (0,5 = vitesse normale).
      await _tts.setSpeechRate((a.speed * 0.5).clamp(0.1, 1.0));
      await _tts.setVolume(a.volume.clamp(0.0, 1.0));
      await _tts.setPitch(a.voice == 'MALE' ? 0.85 : 1.15);

      final repetitions = a.repeatCount.clamp(1, 3);
      var confirme = true;
      for (var i = 0; i < repetitions; i++) {
        // `awaitSpeakCompletion` attend la fin de la lecture : si le moteur ne
        // rappelle jamais (sortie audio absente, moteur planté), l'app resterait
        // bloquée sur « Lecture en cours ». On borne donc l'attente à une durée
        // proportionnelle au texte, et on le signale honnêtement au serveur.
        final budget = Duration(seconds: (3 + a.text.split(' ').length ~/ 2).clamp(5, 20));
        try {
          await _tts.speak(a.text).timeout(budget);
        } on TimeoutException {
          confirme = false;
          break;
        }
        if (i < repetitions - 1) await Future<void>.delayed(const Duration(milliseconds: 600));
      }
      lastSpoken = a.text;
      lastSpokenAt = DateTime.now();
      if (confirme) {
        await _ack(a, played: true);
      } else {
        // Lecture lancée mais jamais confirmée : on ne prétend pas qu'elle a été entendue.
        lastError = 'Lecture non confirmée par le moteur vocal (pas de retour audio)';
        await _ack(a, played: false, error: 'SPEAK_TIMEOUT');
      }
    } catch (e) {
      // Échec réel du moteur (absent, planté) : c'est ICI qu'on le sait.
      _ready = false;
      lastError = 'Lecture impossible : $e';
      await _ack(a, played: false, error: 'TTS_UNAVAILABLE');
      debugPrint('[Voice] lecture échec: $e');
    } finally {
      _speaking = false;
      notifyListeners();
    }
  }

  /// Annonce de test demandée depuis l'écran de réglages.
  Future<void> speakTest() async {
    if (NovigoEnv.live) {
      try {
        final a = await voiceApi.test();
        if (a != null) {
          await announce(a);
          return;
        }
      } catch (e) {
        debugPrint('[Voice] test serveur indisponible: $e');
      }
    }
    // Hors ligne : phrase de test locale, explicitement locale.
    await announce(VoiceAnnouncement(
      text: settings.language == 'bm'
          ? 'Nin ye NOVIGO kumakan sɛgɛsɛgɛli ye.'
          : 'Ceci est un test des annonces vocales NOVIGO.',
      language: settings.language,
      voice: settings.voice,
      speed: settings.speed,
      volume: settings.volume,
      repeatCount: 1,
      kind: 'TEST',
    ));
  }

  Future<void> stop() async {
    try {
      await _tts.stop();
    } catch (_) {
      /* rien à arrêter */
    }
    _speaking = false;
    notifyListeners();
  }

  Future<void> _ack(VoiceAnnouncement a, {required bool played, String? error}) async {
    if (a.id == null || !NovigoEnv.live) return;
    try {
      await voiceApi.ack(a.id!, played: played, error: error);
    } catch (e) {
      debugPrint('[Voice] accusé non transmis: $e');
    }
  }
}

final voice = VoiceService();
