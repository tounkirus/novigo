import 'package:flutter/material.dart';
import 'theme.dart';

/// Primitives de mouvement partagées.
///
/// Tout est centralisé ici pour que l'app parle une seule langue d'animation :
/// mêmes durées, mêmes courbes, mêmes distances de translation. Une transition
/// réglée au cas par cas dans chaque écran finit toujours par se désaccorder.
class M {
  /// Micro-interaction (appui, bascule d'état).
  static const fast = Duration(milliseconds: 180);

  /// Apparition d'un élément de liste, changement de contenu.
  static const base = Duration(milliseconds: 320);

  /// Navigation entre écrans.
  static const page = Duration(milliseconds: 380);

  /// Décélération douce : rapide au départ, longue à l'arrivée.
  static const ease = Curves.easeOutCubic;

  /// Légère surcourse, pour les éléments qui « arrivent » (badges, pastilles).
  static const spring = Curves.easeOutBack;
}

/// Transition d'écran : fondu + glissement vertical court.
///
/// Le `ZoomPageTransitionsBuilder` d'Android donne un effet de zoom brutal sur
/// des pages plein écran sombres ; ce mouvement-ci reste discret et lisible.
class NovigoPageTransitions extends PageTransitionsBuilder {
  const NovigoPageTransitions();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curved = CurvedAnimation(parent: animation, curve: M.ease, reverseCurve: Curves.easeInCubic);
    // L'écran sortant recule légèrement : la profondeur rend l'empilement lisible.
    final outgoing = CurvedAnimation(parent: secondaryAnimation, curve: M.ease);
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween(begin: const Offset(0, 0.035), end: Offset.zero).animate(curved),
        child: ScaleTransition(
          scale: Tween(begin: 1.0, end: 0.98).animate(outgoing),
          child: child,
        ),
      ),
    );
  }
}

/// Apparition en fondu + montée, décalée selon la position dans la liste.
///
/// Le décalage est plafonné : au-delà de quelques éléments, attendre son tour
/// donne l'impression d'une page qui rame plutôt que d'une entrée en scène.
class FadeSlideIn extends StatefulWidget {
  final Widget child;
  final int index;
  final Duration delayStep;

  const FadeSlideIn({
    super.key,
    required this.child,
    this.index = 0,
    this.delayStep = const Duration(milliseconds: 55),
  });

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn> with SingleTickerProviderStateMixin {
  late final Duration _delay = widget.delayStep * widget.index.clamp(0, 6);
  late final AnimationController _c =
      AnimationController(vsync: this, duration: M.base + _delay)..forward();

  /// Le décalage est porté par un `Interval` sur la courbe, pas par un
  /// `Future.delayed` : un minuteur qui survit à la destruction du widget
  /// s'accumule dans les listes longues et fait échouer les tests de widget.
  late final Animation<double> _curved = CurvedAnimation(
    parent: _c,
    curve: Interval(
      _delay.inMicroseconds / (M.base + _delay).inMicroseconds,
      1,
      curve: M.ease,
    ),
  );

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _curved,
      child: SlideTransition(
        position: Tween(begin: const Offset(0, 0.06), end: Offset.zero).animate(_curved),
        child: widget.child,
      ),
    );
  }
}

/// Réduction à l'appui : retour tactile immédiat sur les surfaces cliquables.
class PressableScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  const PressableScale({super.key, required this.child, this.onTap, this.scale = 0.97});

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => setState(() => _down = true),
      onTapUp: (_) => setState(() => _down = false),
      onTapCancel: () => setState(() => _down = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: M.fast,
        curve: M.ease,
        child: widget.child,
      ),
    );
  }
}

/// Balayage lumineux pour les zones en cours de chargement.
///
/// Un aplat gris fixe fait croire à une image manquante ; un reflet qui passe
/// dit « ça arrive » sans bloquer la lecture de la mise en page.
class Shimmer extends StatefulWidget {
  final double? width;
  final double? height;
  final BorderRadius radius;

  const Shimmer({
    super.key,
    this.width,
    this.height,
    this.radius = const BorderRadius.all(Radius.circular(R.md)),
  });

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1250))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (_, __) {
        final t = _c.value * 2 - 1; // -1 → 1
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.radius,
            gradient: LinearGradient(
              begin: Alignment(t - 0.6, 0),
              end: Alignment(t + 0.6, 0),
              colors: const [NC.surfaceAlt, Color(0xFF2C3140), NC.surfaceAlt],
            ),
          ),
        );
      },
    );
  }
}

/// Défilement avec rebond sur toutes les plateformes.
/// Le défilement Android « sec » casse la sensation de continuité recherchée ici.
class NovigoScrollBehavior extends MaterialScrollBehavior {
  const NovigoScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics());

  @override
  Widget buildOverscrollIndicator(BuildContext context, Widget child, ScrollableDetails details) => child;
}
