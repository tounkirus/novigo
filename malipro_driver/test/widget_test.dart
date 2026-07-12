import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:malipro_driver/app.dart';

void main() {
  testWidgets('L\'app livreur démarre sur un écran de chargement',
      (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaliproDriverApp()));
    // Au démarrage, le bootstrap des tokens affiche un indicateur de chargement.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
