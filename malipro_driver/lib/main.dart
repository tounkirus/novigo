import 'package:flutter/material.dart';
import 'novigo/theme.dart';
import 'novigo/shell.dart';
import 'novigo/state.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Branche l'état livreur sur le Gateway LIVE si activé (--dart-define=NOVIGO_LIVE=true).
  // Sans attendre : l'UI s'affiche sur le mock, puis se met à jour à l'arrivée des données.
  driver.goLive();
  runApp(const NovigoDriverApp());
}

class NovigoDriverApp extends StatelessWidget {
  const NovigoDriverApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'NOVIGO Livreur',
      theme: novigoTheme(),
      home: const DriverShell(),
    );
  }
}
