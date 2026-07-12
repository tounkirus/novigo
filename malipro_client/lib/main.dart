import 'package:flutter/material.dart';
import 'novigo/theme.dart';
import 'novigo/screens/login.dart';
import 'novigo/data/catalog_model.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Charge le catalogue LIVE depuis le Gateway si activé (--dart-define=NOVIGO_LIVE=true).
  // Sans attendre : l'UI s'affiche sur le seed mock, puis se met à jour à l'arrivée des données.
  catalog.init();
  runApp(const NovigoApp());
}

class NovigoApp extends StatelessWidget {
  const NovigoApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'NOVIGO',
      theme: novigoTheme(),
      home: const LoginScreen(),
    );
  }
}
