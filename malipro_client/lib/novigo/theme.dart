import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
}

/// Décoration de carte réutilisable (fond surface + rayon + ombre douce).
BoxDecoration cardDeco({Color? color, double radius = 20, Border? border}) {
  return BoxDecoration(
    color: color ?? NC.surface,
    borderRadius: BorderRadius.circular(radius),
    border: border,
    boxShadow: const [
      BoxShadow(color: Color(0x33000000), blurRadius: 24, offset: Offset(0, 12)),
    ],
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
  static const h1 = TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: NC.ink, height: 1.1);
  static const h2 = TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: NC.ink, height: 1.15);
  static const title = TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: NC.ink);
  static const body = TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: NC.ink);
  static const muted = TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500, color: NC.muted);
  static const price = TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: NC.ink);
  static const chip = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: NC.ink);
}
