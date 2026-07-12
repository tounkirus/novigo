import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../shop/application/shop_providers.dart';
import '../shop/presentation/onboarding_screen.dart';
import '../shop/presentation/stores_screen.dart';
import '../orders/presentation/merchant_orders_screen.dart';
import '../wallet/presentation/merchant_wallet_screen.dart';
import '../account/presentation/account_screen.dart';

/// Profil non renseigné → onboarding requis avant d'accéder à l'app.
bool _needsOnboarding(Map<String, dynamic> profile) {
  final b = (profile['businessName'] ?? '').toString().trim();
  return b.isEmpty || b == 'À renseigner';
}

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});
  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  static const _tabs = [
    StoresScreen(),
    MerchantOrdersScreen(),
    MerchantWalletScreen(),
    AccountScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(merchantProfileProvider);
    return profileAsync.when(
      loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator())),
      error: (_, __) => _shell(context),
      data: (profile) => _needsOnboarding(profile)
          ? MerchantOnboardingScreen(initial: profile)
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
              icon: Icon(Icons.storefront_outlined),
              selectedIcon: Icon(Icons.storefront),
              label: 'Boutiques'),
          NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined),
              selectedIcon: Icon(Icons.receipt_long),
              label: 'Commandes'),
          NavigationDestination(
              icon: Icon(Icons.account_balance_wallet_outlined),
              selectedIcon: Icon(Icons.account_balance_wallet),
              label: 'Wallet'),
          NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Compte'),
        ],
      ),
    );
  }
}
