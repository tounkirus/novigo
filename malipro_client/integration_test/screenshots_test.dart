// Captures d'écran automatisées — NOVIGO Client (login téléphone + OTP).
// Lancer : voir _stack/tool/take_screenshots.ps1 ou store/play/SCREENSHOTS.md
//
// Les écrans post-connexion nécessitent un backend démo joignable ET un OTP
// accepté pour le numéro démo (passés via --dart-define). Sans backend, seuls
// les écrans login (+ OTP) sont capturés — le reste est ignoré proprement.
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:malipro_client/main.dart' as app;

const String demoPhone = String.fromEnvironment('DEMO_PHONE', defaultValue: '+22370000001');
const String demoOtp = String.fromEnvironment('DEMO_OTP', defaultValue: '123456');

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<void> shot(String name) async {
    await binding.takeScreenshot(name);
  }

  testWidgets('NOVIGO Client — captures', (tester) async {
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
      // Saisir le numéro et demander le code
      await tester.enterText(find.byType(TextField).first, demoPhone);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Recevoir le code'));
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // 02 — Vérification OTP
      await shot('02-otp');
      await tester.enterText(find.byType(TextField).first, demoOtp);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Vérifier'));
      await tester.pumpAndSettle(const Duration(seconds: 4));

      // 03 — Accueil (après connexion)
      await shot('03-accueil');

      // 04+ — Parcourir chaque onglet de la barre de navigation
      final tabs = find.byType(NavigationDestination).evaluate().length;
      for (var i = 1; i < tabs; i++) {
        try {
          await tester.tap(find.byType(NavigationDestination).at(i));
          await tester.pumpAndSettle(const Duration(seconds: 2));
          await shot('0${i + 3}-onglet-$i');
        } catch (_) {}
      }
    } catch (e) {
      // ignore: avoid_print
      print('[screenshots] connexion/navigation impossible (backend requis) : $e');
    }
  });
}
