import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:malipro_client/novigo/cart.dart';
import 'package:malipro_client/novigo/data.dart' show categories;
import 'package:malipro_client/novigo/data/catalog_model.dart';
import 'package:malipro_client/novigo/screens/addresses.dart';
import 'package:malipro_client/novigo/screens/all_services.dart';
import 'package:malipro_client/novigo/screens/bills.dart';
import 'package:malipro_client/novigo/screens/brain_ask.dart';
import 'package:malipro_client/novigo/screens/cart_screen.dart';
import 'package:malipro_client/novigo/screens/category.dart';
import 'package:malipro_client/novigo/screens/checkout.dart';
import 'package:malipro_client/novigo/screens/for_you.dart';
import 'package:malipro_client/novigo/screens/home_services.dart';
import 'package:malipro_client/novigo/screens/hotels.dart';
import 'package:malipro_client/novigo/screens/login.dart';
import 'package:malipro_client/novigo/screens/real_estate.dart';
import 'package:malipro_client/novigo/screens/settings.dart';
import 'package:malipro_client/novigo/screens/notifications.dart';
import 'package:malipro_client/novigo/screens/order_detail.dart';
import 'package:malipro_client/novigo/screens/product_detail.dart';
import 'package:malipro_client/novigo/screens/store.dart';
import 'package:malipro_client/novigo/screens/support.dart';
import 'package:malipro_client/novigo/screens/tracking.dart';
import 'package:malipro_client/novigo/shell.dart';
import 'package:malipro_client/novigo/theme.dart';
import 'package:malipro_client/novigo/ui/tokens.dart';

/// Parc d'écrans de référence, du plus contraint au plus large.
const _devices = <String, Size>{
  'petit téléphone (320 × 640)': Size(320, 640),
  'téléphone standard (360 × 800)': Size(360, 800),
  'grand téléphone (411 × 914)': Size(411, 914),
  'tablette (800 × 1280)': Size(800, 1280),
};

/// Facteurs d'échelle de texte à couvrir : réglage par défaut et gros texte.
const _textScales = [1.0, 1.3];

Widget _app(Widget child) => MaterialApp(
      theme: novigoTheme(),
      // Même bornage qu'en production : les tests valident ce que l'utilisateur
      // verra réellement, pas un cas impossible à atteindre dans l'application.
      builder: (context, c) => NovigoTextScale(child: c ?? const SizedBox.shrink()),
      home: child,
    );

/// Rend [child] à la taille et à l'échelle de texte demandées, puis échoue si
/// Flutter a signalé le moindre débordement de mise en page.
Future<void> _expectNoOverflow(
  WidgetTester tester,
  Widget child, {
  required Size size,
  required double textScale,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(MediaQuery(
    data: MediaQueryData(size: size, textScaler: TextScaler.linear(textScale)),
    child: _app(child),
  ));
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 600));

  final error = tester.takeException();
  expect(error, isNull, reason: 'débordement à ${size.width}×${size.height} (×$textScale) : $error');
}

void main() {
  setUp(() => cart.clear());

  /// Déclare la même vérification pour chaque taille d'écran et chaque échelle
  /// de texte — c'est la combinaison des deux qui casse, pas l'une ou l'autre.
  void matrix(String name, Widget Function() build) {
    for (final device in _devices.entries) {
      for (final scale in _textScales) {
        testWidgets('$name — ${device.key} ×$scale', (tester) async {
          await _expectNoOverflow(tester, build(),
              size: device.value, textScale: scale);
        });
      }
    }
  }

  matrix('Accueil', () => const Shell());
  matrix('Tous les services', () => const AllServicesScreen());
  matrix('Catégorie Repas', () => CategoryScreen(category: categories.first));
  matrix('Catégorie Colis', () => CategoryScreen(category: categories.last));
  matrix('Fiche boutique', () => StoreScreen(store: catalog.allStores.first));
  matrix(
    'Fiche produit',
    () => ProductDetailScreen(
      product: catalog.allStores.first.products.first,
      store: catalog.allStores.first,
    ),
  );
  matrix('Pour vous', () => const ForYouScreen());
  matrix('NOVIGO Brain', () => const BrainAskScreen());
  matrix('Panier vide', () => const CartScreen());

  matrix('Services à domicile', () => const HomeServicesScreen());
  matrix('Métier — prestataires', () => HsCategoryScreen(category: hsServices.categories.first));
  matrix('Fiche prestataire', () => HsProviderScreen(provider: hsServices.popular.first));
  matrix('Réservation d\'un pro', () => HsBookingScreen(provider: hsServices.popular.first));
  matrix('Mes interventions', () => const HsInterventionsScreen());

  // Verticales « Réserver » : cartes à grande photo, prix longs (des millions de
  // francs CFA) et filtres — le pire cas pour une largeur contrainte.
  matrix('Hôtels', () => const HotelsScreen());
  matrix('Immobilier', () => const RealEstateScreen());

  // Écrans annexes refondus.
  matrix('Factures', () => const BillsScreen());
  matrix('Aide & support', () => const SupportScreen());
  matrix('Mes adresses', () => const AddressesScreen());
  matrix('Paramètres', () => const SettingsScreen());

  // Parcours quotidien : connexion, code, suivi et détail de commande. Ce sont
  // les écrans les plus denses en chiffres et en libellés — donc les premiers à
  // déborder quand la police système est agrandie.
  matrix('Connexion', () => const LoginScreen());
  matrix('Code de vérification', () => const OtpScreen(phone: '+22371000000'));
  matrix('Notifications', () => const NotificationsScreen());
  matrix('Suivi de commande', () => const TrackingScreen(storeName: 'Chez Fatou - ACI 2000'));
  matrix(
    'Détail de commande',
    () => const OrderDetailScreen(
      reference: 'MLP-2026-000041',
      storeName: 'Chez Fatou - ACI 2000',
      status: 'En route',
    ),
  );

  /// Les écrans qui n'ont de sens qu'avec un panier rempli.
  void matrixWithCart(String name, Widget Function() build) {
    for (final device in _devices.entries) {
      for (final scale in _textScales) {
        testWidgets('$name — ${device.key} ×$scale', (tester) async {
          final store = catalog.allStores.first;
          cart.add(store.products.first, store);
          cart.add(store.products[1], store);
          await _expectNoOverflow(tester, build(), size: device.value, textScale: scale);
        });
      }
    }
  }

  matrixWithCart('Panier rempli', () => const CartScreen());
  matrixWithCart('Validation de commande', () => const CheckoutScreen());

  group('Grille de services', () {
    testWidgets('4 colonnes sur téléphone, 6 sur tablette', (tester) async {
      const phone = Size(360, 800);
      const tablet = Size(900, 1280);

      late int phoneColumns;
      late int tabletColumns;

      for (final entry in {phone: true, tablet: false}.entries) {
        tester.view.physicalSize = entry.key;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.reset);
        await tester.pumpWidget(MediaQuery(
          data: MediaQueryData(size: entry.key),
          child: _app(Builder(builder: (context) {
            final columns = Rs.of(context).serviceColumns;
            if (entry.value) {
              phoneColumns = columns;
            } else {
              tabletColumns = columns;
            }
            return const SizedBox.shrink();
          })),
        ));
        await tester.pump();
      }

      expect(phoneColumns, 4);
      expect(tabletColumns, 6);
    });
  });
}
