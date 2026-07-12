import 'package:flutter/material.dart';
import 'theme.dart';
import 'state.dart';
import 'screens/dashboard.dart';
import 'screens/orders.dart';
import 'screens/menu.dart';
import 'screens/account.dart';

class MerchantShell extends StatefulWidget {
  const MerchantShell({super.key});
  @override
  State<MerchantShell> createState() => _MerchantShellState();
}

class _MerchantShellState extends State<MerchantShell> {
  int _i = 0;

  static const _pages = [DashboardScreen(), OrdersScreen(), MenuScreen(), AccountScreen()];

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
            _item(0, Icons.space_dashboard_rounded, 'Tableau'),
            _item(1, Icons.receipt_long_rounded, 'Commandes', badge: true),
            _item(2, Icons.restaurant_menu_rounded, 'Menu'),
            _item(3, Icons.storefront_rounded, 'Compte'),
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
                  listenable: merchant,
                  builder: (_, __) => merchant.newCount == 0
                      ? const SizedBox.shrink()
                      : Container(
                          padding: const EdgeInsets.all(4),
                          constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                          decoration: BoxDecoration(
                              color: NC.brand, shape: BoxShape.circle, border: Border.all(color: NC.paper, width: 2)),
                          alignment: Alignment.center,
                          child: Text('${merchant.newCount}',
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
