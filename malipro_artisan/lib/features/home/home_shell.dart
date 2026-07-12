import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../artisan/application/artisan_providers.dart';
import '../artisan/presentation/onboarding_screen.dart';
import '../artisan/presentation/services_screen.dart';
import '../artisan/presentation/quotations_screen.dart';
import '../account/presentation/account_screen.dart';

/// Profil non renseigné → onboarding requis avant d'accéder à l'app.
bool _needsOnboarding(Map<String, dynamic> profile) {
  final p = (profile['profession'] ?? '').toString().trim();
  return p.isEmpty || p == 'À renseigner';
}

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});
  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  static const _tabs = [
    ServicesScreen(),
    QuotationsScreen(),
    AccountScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    // Porte d'onboarding : tant que le profil n'est pas renseigné, on l'affiche.
    final profileAsync = ref.watch(artisanProfileProvider);
    return profileAsync.when(
      loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator())),
      error: (_, __) => _shell(context),
      data: (profile) => _needsOnboarding(profile)
          ? ArtisanOnboardingScreen(initial: profile)
          : _shell(context),
    );
  }

  Widget _shell(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: _tabs[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.handyman_outlined),
              selectedIcon: Icon(Icons.handyman),
              label: 'Services'),
          NavigationDestination(
              icon: Icon(Icons.request_quote_outlined),
              selectedIcon: Icon(Icons.request_quote),
              label: 'Devis'),
          NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Compte'),
        ],
      ),
    );
  }
}
