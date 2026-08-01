import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:malipro_client/novigo/cart.dart';
import 'package:malipro_client/novigo/data/catalog_model.dart';
import 'package:malipro_client/novigo/screens/all_services.dart';
import 'package:malipro_client/novigo/services_catalog.dart';
import 'package:malipro_client/novigo/shell.dart';
import 'package:malipro_client/novigo/theme.dart';
import 'package:malipro_client/novigo/ui/ui.dart';

/// Enveloppe minimale : même thème que l'application réelle, pour que les
/// couleurs et les styles des composants soient ceux qui seront rendus.
Widget _app(Widget child) => MaterialApp(theme: novigoTheme(), home: child);

void main() {
  setUp(() => cart.clear());

  group('Registre des services', () {
    test('l\'accueil expose sept services, la huitième case étant « Plus »', () {
      expect(homeServices.length, 7);
    });

    test('tout service de l\'accueil ouvre un écran réel', () {
      for (final s in homeServices) {
        expect(s.destination, isNotNull, reason: '${s.label} n\'ouvre aucun écran');
      }
    });

    test('les identifiants de service sont uniques', () {
      final ids = allNovigoServices.map((s) => s.id).toList();
      expect(ids.toSet().length, ids.length);
    });

    test('la recherche de service trouve par libellé et par description', () {
      expect(searchNovigoServices('pharmacie'), isNotEmpty);
      expect(searchNovigoServices('coursier'), isNotEmpty);
      expect(searchNovigoServices('zzzz'), isEmpty);
    });
  });

  group('Shell', () {
    testWidgets('affiche cinq destinations', (tester) async {
      await tester.pumpWidget(_app(const Shell()));
      await tester.pump();

      for (final label in ['Accueil', 'Explorer', 'Commandes', 'Wallet', 'Profil']) {
        expect(find.text(label), findsWidgets, reason: 'onglet $label manquant');
      }
    });

    testWidgets('la barre de panier n\'apparaît qu\'une fois le panier rempli', (tester) async {
      await tester.pumpWidget(_app(const Shell()));
      await tester.pump();
      expect(find.text('Voir le panier'), findsNothing);

      final store = catalog.allStores.first;
      cart.add(store.products.first, store);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      expect(find.text('Voir le panier'), findsOneWidget);
    });
  });

  group('Accueil', () {
    testWidgets('présente ses trois sections et la grille 4 × 2', (tester) async {
      await tester.pumpWidget(_app(const Shell()));
      await tester.pump();

      expect(find.text('Que voulez-vous faire ?'), findsOneWidget);
      expect(find.text('Pour vous'), findsOneWidget);

      // Sept services + la tuile « Plus ».
      expect(find.byType(NovigoServiceTile), findsNWidgets(8));
      expect(find.text('Plus'), findsOneWidget);

      // Le Brain ferme la page : il n'est atteint qu'après défilement, ce qui
      // vérifie aussi qu'il vit bien dans la troisième zone et non en tête.
      await tester.drag(find.byType(CustomScrollView), const Offset(0, -600));
      await tester.pump();
      expect(find.text('NOVIGO Brain'), findsOneWidget);
    });
  });

  group('Tous les services', () {
    testWidgets('rend une rubrique par groupe du registre', (tester) async {
      await tester.pumpWidget(_app(const AllServicesScreen()));
      await tester.pump();

      // Le titre de la première rubrique apparaît deux fois : dans le rail de
      // filtres et en en-tête de section.
      expect(find.text(novigoServiceGroups.first.title), findsWidgets);
    });
  });

  group('États', () {
    testWidgets('NovigoStateView affiche l\'état vide fourni', (tester) async {
      await tester.pumpWidget(_app(const Scaffold(
        body: NovigoStateView(
          status: NovigoStatus.empty,
          emptyState: NovigoEmptyState.empty(title: 'Rien ici', message: 'Revenez plus tard.'),
          loaded: _never,
        ),
      )));

      expect(find.text('Rien ici'), findsOneWidget);
    });

    testWidgets('NovigoStateView propose de réessayer en erreur', (tester) async {
      var retried = false;
      await tester.pumpWidget(_app(Scaffold(
        body: NovigoStateView(
          status: NovigoStatus.error,
          onRetry: () => retried = true,
          loaded: _never,
        ),
      )));

      await tester.tap(find.text('Réessayer'));
      expect(retried, isTrue);
    });
  });

  group('NovigoButton', () {
    testWidgets('ignore les appuis pendant le chargement', (tester) async {
      var taps = 0;
      await tester.pumpWidget(_app(Scaffold(
        body: NovigoButton(label: 'Confirmer', loading: true, onPressed: () => taps++),
      )));

      await tester.tap(find.byType(NovigoButton));
      await tester.pump();

      expect(taps, 0, reason: 'un bouton en cours de chargement ne doit pas se redéclencher');
      expect(find.text('Un instant…'), findsOneWidget);
    });
  });
}

Widget _never(BuildContext context) => const SizedBox.shrink();
