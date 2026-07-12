import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../cart/application/cart_controller.dart';
import 'presentation/home_screen.dart';
import '../catalog/presentation/catalog_screen.dart';
import '../services/presentation/services_screen.dart';
import '../orders/presentation/orders_screen.dart';
import '../account/presentation/account_screen.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});
  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;
  static const _titles = ['Accueil', 'Catalogue', 'Services', 'Commandes', 'Compte'];

  void _goTab(int i) => setState(() => _index = i);

  @override
  Widget build(BuildContext context) {
    final count = ref.watch(cartControllerProvider).fold<int>(0, (s, l) => s + l.quantity);
    final pages = [
      HomeScreen(onTab: _goTab),
      const CatalogScreen(),
      const ServicesScreen(),
      const OrdersScreen(),
      const AccountScreen(),
    ];
    final showCart = _index == 0 || _index == 1;

    return Scaffold(
      // L'accueil embarque son propre en-tête dégradé : pas d'AppBar.
      appBar: _index == 0
          ? null
          : AppBar(
              title: Text(_titles[_index]),
              actions: [
                if (showCart) _CartButton(count: count),
              ],
            ),
      body: SafeArea(top: _index != 0, child: pages[_index]),
      floatingActionButton: _index == 0 && count > 0
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/cart'),
              backgroundColor: AppColors.brand,
              icon: const Icon(Icons.shopping_cart, color: Colors.white),
              label: Text('Panier ($count)', style: const TextStyle(color: Colors.white)),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _goTab,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Accueil'),
          NavigationDestination(icon: Icon(Icons.storefront_outlined), label: 'Catalogue'),
          NavigationDestination(icon: Icon(Icons.handyman_outlined), label: 'Services'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Commandes'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Compte'),
        ],
      ),
    );
  }
}

class _CartButton extends StatelessWidget {
  const _CartButton({required this.count});
  final int count;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Stack(
        alignment: Alignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined),
            onPressed: () => context.push('/cart'),
          ),
          if (count > 0)
            Positioned(
              right: 6,
              top: 6,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
                child: Text('$count',
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
    );
  }
}
