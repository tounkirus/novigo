import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'motion.dart';

/// Palette NOVIGO — thème sombre premium, aligné pixel sur l'app web.
class NC {
  // Fonds
  static const shell = Color(0xFF0F1117); // fond principal
  static const paper = Color(0xFF171A22); // fond secondaire
  static const surface = Color(0xFF1C202A); // cartes
  static const surfaceAlt = Color(0xFF232733); // cartes surélevées / champs
  static const line = Color(0xFF313743); // séparateurs

  // Marque
  static const brand = Color(0xFFE53935);
  static const brandDark = Color(0xFFC62828);
  static const brandLight = Color(0xFFFF5A5F);
  static const gold = Color(0xFFFFC043);

  // Texte
  static const ink = Color(0xFFFFFFFF);
  static const muted = Color(0xFFB8BDC9);
  static const faint = Color(0xFF7C8496);

  // Sémantique
  static const success = Color(0xFF2ECC71);
  static const error = Color(0xFFFF5A5F);
  static const info = Color(0xFF2196F3);
  static const warning = Color(0xFFFF9800);
  static const violet = Color(0xFF7C4DFF);

  static Color brandSoft = brand.withValues(alpha: 0.14);
  static Color successSoft = success.withValues(alpha: 0.16);

  /// Liseré très discret qui détache les cartes du fond sombre sans trait dur.
  static Color hairline = Colors.white.withValues(alpha: 0.06);

  // Dégradés
  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand, brandDark],
  );
  static const premiumGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF12141C), Color(0xFF1C202A), brandDark],
    stops: [0.0, 0.45, 1.0],
  );

  /// Voile appliqué sous les visuels : garantit la lisibilité du texte posé
  /// sur des photos dont on ne maîtrise pas la luminosité.
  static const imageScrim = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0x00000000), Color(0x14000000), Color(0xB3000000)],
    stops: [0.0, 0.5, 1.0],
  );

  /// Surface légèrement translucide posée sur une image (pastilles, boutons).
  static Color glass = Colors.black.withValues(alpha: 0.42);
}

/// Rayons — une seule échelle pour toute l'app.
class R {
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 26.0;
  static const pill = 999.0;
}

/// Décoration de carte réutilisable.
/// [elevated] réserve l'ombre portée aux surfaces qui doivent flotter : sur un
/// fond sombre, une ombre sur chaque carte alourdit la page au lieu de la
/// hiérarchiser.
BoxDecoration cardDeco({
  Color? color,
  double radius = R.lg,
  Border? border,
  bool elevated = false,
}) {
  return BoxDecoration(
    color: color ?? NC.surface,
    borderRadius: BorderRadius.circular(radius),
    border: border ?? Border.all(color: NC.hairline),
    boxShadow: elevated
        ? const [BoxShadow(color: Color(0x40000000), blurRadius: 28, offset: Offset(0, 14))]
        : const [BoxShadow(color: Color(0x1A000000), blurRadius: 14, offset: Offset(0, 6))],
  );
}

ThemeData novigoTheme() {
  const scheme = ColorScheme.dark(
    primary: NC.brand,
    onPrimary: Colors.white,
    secondary: NC.gold,
    surface: NC.surface,
    onSurface: NC.ink,
    error: NC.error,
  );
  final base = ThemeData(useMaterial3: true, brightness: Brightness.dark, colorScheme: scheme);
  return base.copyWith(
    // Une seule transition pour toute l'app, plutôt que le zoom d'Android.
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: NovigoPageTransitions(),
      TargetPlatform.iOS: NovigoPageTransitions(),
    }),
    scaffoldBackgroundColor: NC.shell,
    canvasColor: NC.shell,
    splashColor: NC.brand.withValues(alpha: 0.10),
    highlightColor: Colors.transparent,
    textTheme: base.textTheme.apply(bodyColor: NC.ink, displayColor: NC.ink),
    appBarTheme: const AppBarTheme(
      backgroundColor: NC.shell,
      foregroundColor: NC.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    ),
  );
}

/// Styles de texte fréquents (helpers courts).
class T {
  // Titres : resserrés (height ~1.05-1.15) et légèrement chassés en négatif,
  // ce qui donne une allure éditoriale plutôt que « texte système ».
  static const h1 = TextStyle(
      fontSize: 27, fontWeight: FontWeight.w800, color: NC.ink, height: 1.08, letterSpacing: -0.6);
  static const h2 = TextStyle(
      fontSize: 20, fontWeight: FontWeight.w800, color: NC.ink, height: 1.15, letterSpacing: -0.35);
  static const title = TextStyle(
      fontSize: 16.5, fontWeight: FontWeight.w700, color: NC.ink, letterSpacing: -0.2);
  static const body = TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: NC.ink, height: 1.35);
  static const muted = TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500, color: NC.muted, height: 1.3);
  static const chip = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: NC.ink);

  /// Montants : chiffres à chasse fixe, sinon les prix « dansent » d'une ligne
  /// à l'autre dans les listes et les totaux.
  static const price = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w800,
    color: NC.ink,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  /// Étiquette de section en petites capitales espacées.
  static const overline = TextStyle(
    fontSize: 11.5,
    fontWeight: FontWeight.w800,
    color: NC.faint,
    letterSpacing: 1.2,
  );
}
