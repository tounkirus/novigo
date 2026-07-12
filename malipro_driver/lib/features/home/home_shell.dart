import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../deliveries/application/deliveries_providers.dart';
import '../deliveries/presentation/available_screen.dart';
import '../deliveries/presentation/my_deliveries_screen.dart';
import '../deliveries/presentation/onboarding_screen.dart';
import '../profile/presentation/profile_screen.dart';

/// Véhicule non renseigné → onboarding requis avant d'accéder à l'app.
bool _needsOnboarding(Map<String, dynamic> profile) {
  final v = (profile['vehicleType'] ?? '').toString().trim();
  return v.isEmpty;
}

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});
  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  static const _tabs = [
    AvailableScreen(),
    MyDeliveriesScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(driverProfileProvider);
    return profileAsync.when(
      loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator())),
      error: (_, __) => _shell(context),
      data: (profile) => _needsOnboarding(profile)
          ? DriverOnboardingScreen(initial: profile)
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
              icon: Icon(Icons.explore_outlined),
              selectedIcon: Icon(Icons.explore),
              label: 'Disponibles'),
          NavigationDestination(
              icon: Icon(Icons.local_shipping_outlined),
              selectedIcon: Icon(Icons.local_shipping),
              label: 'Mes courses'),
          NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profil'),
        ],
      ),
    );
  }
}
