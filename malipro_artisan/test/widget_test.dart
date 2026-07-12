import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:malipro_artisan/app.dart';

void main() {
  testWidgets('L\'app artisan démarre sur un écran de chargement',
      (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaliproArtisanApp()));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
