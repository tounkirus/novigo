import 'package:flutter/material.dart';
import 'novigo/theme.dart';
import 'novigo/motion.dart';
import 'novigo/shell.dart';
import 'novigo/screens/login.dart';
import 'novigo/data/catalog_model.dart';
import 'novigo/data/session.dart';
import 'novigo/screens/home_services.dart';
import 'novigo/ui/tokens.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Session persistée : un redémarrage à froid ne doit pas renvoyer sur l'OTP.
  await session.restore();
  // Charge le catalogue + les services à domicile LIVE depuis le Gateway si activé
  // (--dart-define=NOVIGO_LIVE=true). Sans attendre : l'UI s'affiche sur le seed
  // mock, puis se met à jour à l'arrivée des données live (repli mock si KO).
  catalog.init();
  hsServices.init();
  runApp(NovigoApp(signedIn: session.signedIn));
}

class NovigoApp extends StatelessWidget {
  final bool signedIn;
  const NovigoApp({super.key, this.signedIn = false});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'NOVIGO',
      theme: novigoTheme(),
      // Rebond sur tous les défilements, y compris Android.
      scrollBehavior: const NovigoScrollBehavior(),
      // Le réglage système de taille de texte est respecté, mais borné : au-delà
      // de 135 %, une grille de quatre colonnes ne tient plus sur un écran de
      // 360 px et les libellés se coupent au milieu d'un mot.
      builder: (context, child) => NovigoTextScale(child: child ?? const SizedBox.shrink()),
      home: signedIn ? const Shell() : const LoginScreen(),
    );
  }
}
