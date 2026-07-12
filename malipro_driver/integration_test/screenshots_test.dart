// Captures d'écran automatisées — NOVIGO Livreur (login par mot de passe).
// Lancer : voir _stack/tool/take_screenshots.ps1 ou store/play/SCREENSHOTS.md
//
// Les écrans post-connexion nécessitent un backend démo joignable et un compte
// démo (téléphone + mot de passe passés via --dart-define). Sans backend, seul
// l'écran de connexion est capturé — le reste est ignoré proprement.
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:malipro_driver/main.dart' as app;

const String demoPhone = String.fromEnvironment('DEMO_PHONE', defaultValue: '+22375000001');
const String demoPassword = String.fromEnvironment('DEMO_PASSWORD', defaultValue: '123456');

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<void> shot(String name) async {
    await binding.takeScreenshot(name);
  }

  testWidgets('NOVIGO Livreur — captures', (tester) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 2));
    if (Platform.isAndroid) {
      try {
        await binding.convertFlutterSurfaceToImage();
      } catch (_) {}
    }
    await tester.pumpAndSettle();

    // 01 — Écran de connexion
    await shot('01-login');

    try {
      // Basculer en mode mot de passe (pas d'OTP/SMS)
      await tester.tap(find.text('Se connecter par mot de passe'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField).at(0), demoPhone);
      await tester.enterText(find.byType(TextField).at(1), demoPassword);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle(const Duration(seconds: 4));

      // 02 — Accueil (après connexion)
      await shot('02-accueil');

      // 03+ — Parcourir chaque onglet
      final tabs = find.byType(NavigationDestination).evaluate().length;
      for (var i = 1; i < tabs; i++) {
        try {
          await tester.tap(find.byType(NavigationDestination).at(i));
          await tester.pumpAndSettle(const Duration(seconds: 2));
          await shot('0${i + 2}-onglet-$i');
        } catch (_) {}
      }
    } catch (e) {
      // ignore: avoid_print
      print('[screenshots] connexion/navigation impossible (backend requis) : $e');
    }
  });
}
