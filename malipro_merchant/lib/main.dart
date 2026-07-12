import 'package:flutter/material.dart';
import 'novigo/theme.dart';
import 'novigo/shell.dart';
import 'novigo/state.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Synchronise les commandes LIVE depuis le Gateway si activé
  // (--dart-define=NOVIGO_LIVE=true) et ouvre le flux temps réel. Sans attendre :
  // l'UI s'affiche sur le seed mock, puis se met à jour à l'arrivée des données.
  merchant.goLive();
  runApp(const NovigoMerchantApp());
}

class NovigoMerchantApp extends StatelessWidget {
  const NovigoMerchantApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'NOVIGO Marchand',
      theme: novigoTheme(),
      home: const MerchantShell(),
    );
  }
}
