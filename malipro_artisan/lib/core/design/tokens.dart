import 'package:flutter/material.dart';

/// MALIPRO — jetons de design (design tokens).
///
/// Source de vérité unique pour la couleur, l'espace, le rayon, l'élévation
/// et le mouvement. Les thèmes clair/sombre ([buildTheme]/[buildDarkTheme])
/// et tous les composants dérivent de ces valeurs — ne jamais coder une
/// couleur ou un espacement « en dur » ailleurs.

// ─────────────────────────────────────────────────────────────────────────
// Palette de marque (identité visuelle premium)
// ─────────────────────────────────────────────────────────────────────────
class MaliColors {
  MaliColors._();

  /// Vert émeraude — couleur primaire.
  static const emerald = Color(0xFF0D7A5F);
  static const emeraldDark = Color(0xFF0A5C47);
  static const emeraldLight = Color(0xFF16A37F);

  /// Or premium — couleur secondaire.
  static const gold = Color(0xFFC9A84C);
  static const goldDark = Color(0xFFA98A34);
  static const goldLight = Color(0xFFE0C577);

  /// Fonds & texte.
  static const paper = Color(0xFFF7F8FC); // blanc cassé (fond clair)
  static const ink = Color(0xFF1E293B); // noir charbon (texte clair)
  static const white = Color(0xFFFFFFFF);

  /// Neutres (clair).
  static const muted = Color(0xFF64748B);
  static const line = Color(0xFFE2E8F0);
  static const surfaceAlt = Color(0xFFEEF1F6);

  /// Neutres (sombre).
  static const inkSurface = Color(0xFF0F172A); // fond sombre
  static const inkSurfaceAlt = Color(0xFF1E293B);
  static const inkLine = Color(0xFF334155);
  static const inkMuted = Color(0xFF94A3B8);
  static const inkOnDark = Color(0xFFF1F5F9);

  /// Couleurs sémantiques (états).
  static const success = Color(0xFF22C55E);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6);
  static const warning = Color(0xFFF59E0B);
}

// ─────────────────────────────────────────────────────────────────────────
// Espacement (échelle 4 pt)
// ─────────────────────────────────────────────────────────────────────────
class MaliSpacing {
  MaliSpacing._();
  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

// ─────────────────────────────────────────────────────────────────────────
// Rayons d'angle (cartes arrondies, coins doux)
// ─────────────────────────────────────────────────────────────────────────
class MaliRadius {
  MaliRadius._();
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double pill = 999;

  static BorderRadius get card => BorderRadius.circular(lg);
  static BorderRadius get field => BorderRadius.circular(md);
  static BorderRadius get button => BorderRadius.circular(md);
}

// ─────────────────────────────────────────────────────────────────────────
// Élévations (ombres douces, glassmorphism léger)
// ─────────────────────────────────────────────────────────────────────────
class MaliElevation {
  MaliElevation._();

  /// Ombre de carte discrète (mode clair).
  static List<BoxShadow> card(Brightness b) => b == Brightness.dark
      ? const [BoxShadow(color: Color(0x33000000), blurRadius: 16, offset: Offset(0, 6))]
      : const [BoxShadow(color: Color(0x14101828), blurRadius: 18, offset: Offset(0, 8))];

  /// Ombre marquée (bottom sheets, éléments flottants).
  static List<BoxShadow> lifted(Brightness b) => b == Brightness.dark
      ? const [BoxShadow(color: Color(0x40000000), blurRadius: 28, offset: Offset(0, 12))]
      : const [BoxShadow(color: Color(0x1F101828), blurRadius: 30, offset: Offset(0, 14))];
}

// ─────────────────────────────────────────────────────────────────────────
// Mouvement (animations fluides 60 fps)
// ─────────────────────────────────────────────────────────────────────────
class MaliMotion {
  MaliMotion._();
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration base = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 400);
  static const Curve easeOut = Curves.easeOutCubic;
  static const Curve emphasized = Curves.easeInOutCubicEmphasized;
}
