import 'package:flutter/material.dart';
import 'theme.dart';
import 'state.dart';
import 'screens/home.dart';
import 'screens/deliveries.dart';
import 'screens/earnings.dart';
import 'screens/account.dart';

class DriverShell extends StatefulWidget {
  const DriverShell({super.key});
  @override
  State<DriverShell> createState() => _DriverShellState();
}

class _DriverShellState extends State<DriverShell> {
  int _i = 0;

  static const _pages = [
    HomeScreen(),
    DeliveriesScreen(),
    EarningsScreen(),
    AccountScreen(),
  ];

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
            _item(1, Icons.pedal_bike_rounded, 'Courses', badge: true),
            _item(2, Icons.account_balance_wallet_rounded, 'Gains'),
            _item(3, Icons.person_rounded, 'Compte'),
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
                  listenable: driver,
                  builder: (_, __) => !driver.hasActive
                      ? const SizedBox.shrink()
                      : Container(
                          padding: const EdgeInsets.all(4),
                          constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                          decoration: BoxDecoration(
                              color: NC.brand,
                              shape: BoxShape.circle,
                              border: Border.all(color: NC.paper, width: 2)),
                          alignment: Alignment.center,
                          child: const Text('1',
                              style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
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
