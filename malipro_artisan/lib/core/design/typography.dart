import 'package:flutter/material.dart';

/// MALIPRO — échelle typographique.
///
/// Inter en principal (SF Pro Display / system en repli). Les tailles suivent
/// la spécification d'identité : H1 32, H2 28, H3 24, Titre 20, Corps 16,
/// Petit 14, Légende 12. Aucune dépendance réseau : si la police Inter n'est
/// pas empaquetée, Flutter retombe proprement sur la police système.
class MaliType {
  MaliType._();

  static const String fontFamily = 'Inter';
  static const List<String> fallback = ['SF Pro Display', 'Roboto', 'sans-serif'];

  static TextTheme textTheme(Color onSurface, Color muted) {
    TextStyle s(double size, FontWeight w, {double? height, Color? c, double? spacing}) => TextStyle(
          fontFamily: fontFamily,
          fontFamilyFallback: fallback,
          fontSize: size,
          fontWeight: w,
          height: height,
          letterSpacing: spacing,
          color: c ?? onSurface,
        );

    return TextTheme(
      displaySmall: s(32, FontWeight.w800, height: 1.15, spacing: -0.5), // H1
      headlineLarge: s(28, FontWeight.w700, height: 1.2, spacing: -0.3), // H2
      headlineMedium: s(24, FontWeight.w700, height: 1.25), // H3
      titleLarge: s(20, FontWeight.w600, height: 1.3), // Titre
      titleMedium: s(16, FontWeight.w600, height: 1.4),
      bodyLarge: s(16, FontWeight.w400, height: 1.5), // Corps
      bodyMedium: s(14, FontWeight.w400, height: 1.45, c: onSurface), // Petit texte
      bodySmall: s(12, FontWeight.w400, height: 1.4, c: muted), // Légende
      labelLarge: s(15, FontWeight.w600, height: 1.2, spacing: 0.2), // Boutons
      labelSmall: s(12, FontWeight.w600, height: 1.2, spacing: 0.4, c: muted),
    );
  }
}
