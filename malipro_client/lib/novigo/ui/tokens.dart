import 'package:flutter/material.dart';

import '../theme.dart';

export '../theme.dart' show NC, R, T, cardDeco;

/// Échelle d'espacement unique.
///
/// Les marges étaient jusqu'ici écrites en dur écran par écran (14, 16, 18, 22…),
/// ce qui donnait des rythmes différents d'une page à l'autre. Une seule échelle
/// à pas de 4 suffit et rend les pages visuellement parentes.
class Sp {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const xxl = 32.0;

  /// Marge latérale des écrans (gouttière).
  static const gutter = 20.0;

  /// Respiration entre deux grandes sections d'un écran.
  static const section = 30.0;
}

/// Tons d'accent des services.
///
/// Une grille où toutes les icônes sont rouges se lit comme un bloc uniforme :
/// l'œil ne distingue rien. Un ton par famille rend la grille scannable en un
/// coup d'œil tout en gardant le rouge NOVIGO pour les actions.
class Tone {
  static const ride = Color(0xFFFFC043);
  static const food = Color(0xFFFF6B4A);
  static const parcel = Color(0xFF7C6CF6);
  static const grocery = Color(0xFF2ECC71);
  static const hotel = Color(0xFF29B6F6);
  static const realEstate = Color(0xFF26C6B0);
  static const service = Color(0xFFEC5C8D);
  static const shopping = Color(0xFFB07C4F);
  static const pay = Color(0xFF42A5F5);
  static const more = Color(0xFFB8BDC9);
}

/// Points de rupture. L'app vise le téléphone : la tablette ne doit pas étirer
/// une colonne unique sur 1 000 px, elle passe simplement à plus de colonnes.
class Bp {
  static const small = 360.0; // petits Android (Redmi 9A…)
  static const medium = 400.0; // téléphone standard
  static const large = 600.0; // grand téléphone / petite tablette
  static const tablet = 840.0;
}

/// Helpers de mise en page dépendants de la largeur réelle.
class Rs {
  const Rs._(this.width);

  factory Rs.of(BuildContext context) => Rs._(MediaQuery.sizeOf(context).width);

  final double width;

  bool get isSmall => width < Bp.small;
  bool get isTablet => width >= Bp.large;

  /// Gouttière : resserrée sur les petits écrans, élargie sur tablette.
  double get gutter => isSmall ? Sp.lg : (isTablet ? Sp.xxl : Sp.gutter);

  /// Nombre de colonnes de la grille de services (4 par défaut, 6 sur tablette).
  int get serviceColumns => isTablet ? 6 : 4;

  /// Nombre de colonnes d'une grille de produits.
  int get productColumns => width >= Bp.tablet ? 4 : (isTablet ? 3 : 2);

  /// Largeur d'une carte de carrousel : jamais plus de 78 % de l'écran, sinon
  /// on ne devine plus qu'il y a une carte suivante.
  double get carouselCardWidth => (width * 0.72).clamp(240.0, 340.0);

  /// Largeur maximale d'une colonne de contenu — au-delà, le texte devient
  /// pénible à lire sur tablette.
  double get contentMaxWidth => isTablet ? 720.0 : double.infinity;
}

/// Borne le facteur d'échelle du texte système.
///
/// L'accessibilité impose de suivre le réglage de l'utilisateur ; un facteur
/// 2,0 sur une grille 4 colonnes fait néanmoins déborder chaque libellé. On
/// suit donc le réglage jusqu'à une limite raisonnable, sans jamais réduire
/// en dessous de 100 %.
class NovigoTextScale extends StatelessWidget {
  final Widget child;
  final double max;
  const NovigoTextScale({super.key, required this.child, this.max = 1.35});

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    return MediaQuery(
      data: mq.copyWith(textScaler: mq.textScaler.clamp(minScaleFactor: 1.0, maxScaleFactor: max)),
      child: child,
    );
  }
}

/// Contraint le contenu à une colonne lisible et le centre (tablette).
class NovigoContentWidth extends StatelessWidget {
  final Widget child;
  const NovigoContentWidth({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final rs = Rs.of(context);
    if (!rs.isTablet) return child;
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: rs.contentMaxWidth),
        child: child,
      ),
    );
  }
}

/// Séparateur fin, à l'épaisseur d'un cheveu quel que soit l'écran.
class NovigoDivider extends StatelessWidget {
  final double indent;
  const NovigoDivider({super.key, this.indent = 0});

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(left: indent),
        child: Container(height: 1, color: NC.hairline),
      );
}
