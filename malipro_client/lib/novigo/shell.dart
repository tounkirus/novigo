import 'package:flutter/material.dart';
import 'theme.dart';
import 'cart.dart';
import 'screens/home.dart';
import 'screens/services.dart';
import 'screens/cart_screen.dart';
import 'screens/orders.dart';
import 'screens/account.dart';

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _i = 0;

  static const _pages = [HomeScreen(), ServicesScreen(), CartScreen(), OrdersScreen(), AccountScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _i, children: _pages),
      bottomNavigationBar: _bottomBar(),
    );
  }

  Widget _bottomBar() {
    return Container(
      decoration: const BoxDecoration(
        color: NC.paper,
        border: Border(top: BorderSide(color: NC.line, width: 0.6)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(children: [
            _item(0, Icons.home_rounded, 'Accueil'),
            _item(1, Icons.grid_view_rounded, 'Services'),
            _item(2, Icons.shopping_bag_rounded, 'Panier', badge: true),
            _item(3, Icons.receipt_long_rounded, 'Commandes'),
            _item(4, Icons.person_rounded, 'Compte'),
          ]),
        ),
      ),
    );
  }

  Widget _item(int i, IconData icon, String label, {bool badge = false}) {
    final on = _i == i;
    final color = on ? NC.brand : NC.faint;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _i = i),
        behavior: HitTestBehavior.opaque,
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Stack(clipBehavior: Clip.none, children: [
            Icon(icon, color: color, size: 25),
            if (badge)
              Positioned(
                right: -8,
                top: -6,
                child: ListenableBuilder(
                  listenable: cart,
                  builder: (_, __) => cart.count == 0
                      ? const SizedBox.shrink()
                      : Container(
                          padding: const EdgeInsets.all(4),
                          constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                          decoration: BoxDecoration(color: NC.brand, shape: BoxShape.circle, border: Border.all(color: NC.paper, width: 2)),
                          alignment: Alignment.center,
                          child: Text('${cart.count}',
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
                        ),
                ),
              ),
          ]),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: color, fontSize: 11.5, fontWeight: on ? FontWeight.w700 : FontWeight.w500)),
        ]),
      ),
    );
  }
}
