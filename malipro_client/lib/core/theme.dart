import 'package:flutter/material.dart';
import 'design/tokens.dart';
import 'design/typography.dart';

/// Compatibilité ascendante : les écrans existants référencent `AppColors.*`.
/// Ces constantes pointent désormais sur la palette d'identité officielle
/// ([MaliColors]) — même API, couleurs alignées sur la charte premium.
class AppColors {
  static const brand = MaliColors.emerald;
  static const brandDark = MaliColors.emeraldDark;
  static const gold = MaliColors.gold;
  static const ink = MaliColors.ink;
  static const paper = MaliColors.paper;
  static const muted = MaliColors.muted;
  static const line = MaliColors.line;

  // États sémantiques (nouveaux, disponibles pour les écrans).
  static const success = MaliColors.success;
  static const error = MaliColors.error;
  static const info = MaliColors.info;
  static const warning = MaliColors.warning;
}

/// Thème clair MALIPRO.
ThemeData buildTheme() => _build(Brightness.light);

/// Thème sombre MALIPRO (dark mode complet).
ThemeData buildDarkTheme() => _build(Brightness.dark);

ThemeData _build(Brightness brightness) {
  final isDark = brightness == Brightness.dark;

  final onSurface = isDark ? MaliColors.inkOnDark : MaliColors.ink;
  final muted = isDark ? MaliColors.inkMuted : MaliColors.muted;
  final surface = isDark ? MaliColors.inkSurfaceAlt : MaliColors.white;
  final scaffold = isDark ? MaliColors.inkSurface : MaliColors.paper;
  final line = isDark ? MaliColors.inkLine : MaliColors.line;

  final colorScheme = ColorScheme(
    brightness: brightness,
    primary: MaliColors.emerald,
    onPrimary: MaliColors.white,
    primaryContainer: isDark ? MaliColors.emeraldDark : MaliColors.emeraldLight,
    onPrimaryContainer: MaliColors.white,
    secondary: MaliColors.gold,
    onSecondary: MaliColors.ink,
    secondaryContainer: isDark ? MaliColors.goldDark : MaliColors.goldLight,
    onSecondaryContainer: MaliColors.ink,
    surface: surface,
    onSurface: onSurface,
    surfaceContainerHighest: isDark ? MaliColors.inkSurfaceAlt : MaliColors.surfaceAlt,
    onSurfaceVariant: muted,
    error: MaliColors.error,
    onError: MaliColors.white,
    outline: line,
    outlineVariant: line,
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: isDark ? MaliColors.paper : MaliColors.ink,
    onInverseSurface: isDark ? MaliColors.ink : MaliColors.white,
    inversePrimary: MaliColors.emeraldLight,
  );

  final textTheme = MaliType.textTheme(onSurface, muted);

  final base = ThemeData(useMaterial3: true, brightness: brightness, colorScheme: colorScheme);

  return base.copyWith(
    scaffoldBackgroundColor: scaffold,
    textTheme: textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: surface,
      foregroundColor: onSurface,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: textTheme.titleLarge,
    ),
    cardTheme: CardThemeData(
      color: surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: MaliRadius.card,
        side: BorderSide(color: line),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: MaliColors.emerald,
        foregroundColor: MaliColors.white,
        disabledBackgroundColor: MaliColors.emerald.withValues(alpha: 0.4),
        minimumSize: const Size.fromHeight(52),
        textStyle: textTheme.labelLarge,
        shape: RoundedRectangleBorder(borderRadius: MaliRadius.button),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: MaliColors.emerald,
        minimumSize: const Size.fromHeight(52),
        side: const BorderSide(color: MaliColors.emerald, width: 1.5),
        textStyle: textTheme.labelLarge,
        shape: RoundedRectangleBorder(borderRadius: MaliRadius.button),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: MaliColors.emerald,
        textStyle: textTheme.labelLarge,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: isDark ? MaliColors.inkSurface : MaliColors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: MaliSpacing.md, vertical: MaliSpacing.md),
      hintStyle: textTheme.bodyLarge?.copyWith(color: muted),
      border: OutlineInputBorder(borderRadius: MaliRadius.field, borderSide: BorderSide(color: line)),
      enabledBorder: OutlineInputBorder(borderRadius: MaliRadius.field, borderSide: BorderSide(color: line)),
      focusedBorder: OutlineInputBorder(
        borderRadius: MaliRadius.field,
        borderSide: const BorderSide(color: MaliColors.emerald, width: 1.6),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: MaliRadius.field,
        borderSide: const BorderSide(color: MaliColors.error),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: isDark ? MaliColors.inkSurfaceAlt : MaliColors.surfaceAlt,
      side: BorderSide(color: line),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(MaliRadius.pill)),
      labelStyle: textTheme.labelSmall,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: surface,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(MaliRadius.xl)),
      ),
    ),
    dividerTheme: DividerThemeData(color: line, thickness: 1, space: 1),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: surface,
      indicatorColor: MaliColors.emerald.withValues(alpha: isDark ? 0.24 : 0.12),
      elevation: 0,
      labelTextStyle: WidgetStatePropertyAll(textTheme.labelSmall),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: MaliColors.ink,
      contentTextStyle: textTheme.bodyMedium?.copyWith(color: MaliColors.white),
      shape: RoundedRectangleBorder(borderRadius: MaliRadius.field),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: MaliColors.emerald),
  );
}
