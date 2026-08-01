import 'package:flutter/material.dart';

import 'cart.dart';
import 'models.dart' show fcfa;
import 'motion.dart';
import 'screens/account.dart';
import 'screens/cart_screen.dart';
import 'screens/explore.dart';
import 'screens/home.dart';
import 'screens/orders.dart';
import 'screens/wallet_screen.dart';
import 'ui/tokens.dart';

/// Squelette de l'application : cinq destinations, pas une de plus.
///
/// Le panier n'occupe plus un onglet permanent — il n'a de sens que lorsqu'il
/// contient quelque chose. Il apparaît alors en barre flottante au-dessus de la
/// navigation, avec le montant : c'est plus visible qu'une pastille sur un
/// onglet, et cela libère la place pour le Wallet, consulté beaucoup plus
/// souvent au quotidien.
class Shell extends StatefulWidget {
  const Shell({super.key});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _index = 0;

  /// Une pile de navigation par onglet : revenir sur « Explorer » doit retrouver
  /// la rubrique laissée ouverte, pas repartir du haut.
  late final List<Widget> _pages = [
    HomeScreen(onNavigateTab: _select),
    const ExploreScreen(),
    const OrdersScreen(),
    const WalletScreen(embedded: true),
    const AccountScreen(),
  ];

  static const _destinations = <_Destination>[
    _Destination(Icons.home_rounded, Icons.home_outlined, 'Accueil'),
    _Destination(Icons.grid_view_rounded, Icons.grid_view_outlined, 'Explorer'),
    _Destination(Icons.receipt_long_rounded, Icons.receipt_long_outlined, 'Commandes'),
    _Destination(Icons.account_balance_wallet_rounded, Icons.account_balance_wallet_outlined, 'Wallet'),
    _Destination(Icons.person_rounded, Icons.person_outline_rounded, 'Profil'),
  ];

  void _select(int i) {
    if (i == _index) return;
    setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: Column(mainAxisSize: MainAxisSize.min, children: [
        _CartBar(onTap: () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const CartScreen()))),
        _BottomBar(index: _index, onSelect: _select, destinations: _destinations),
      ]),
    );
  }
}

class _Destination {
  final IconData active;
  final IconData inactive;
  final String label;
  const _Destination(this.active, this.inactive, this.label);
}

class _BottomBar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onSelect;
  final List<_Destination> destinations;

  const _BottomBar({required this.index, required this.onSelect, required this.destinations});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: NC.paper,
        border: const Border(top: BorderSide(color: NC.line, width: 0.6)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.30), blurRadius: 24, offset: const Offset(0, -8)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Row(children: [
            for (var i = 0; i < destinations.length; i++)
              Expanded(
                child: _BottomItem(
                  destination: destinations[i],
                  selected: i == index,
                  onTap: () => onSelect(i),
                ),
              ),
          ]),
        ),
      ),
    );
  }
}

/// Onglet : icône pleine + libellé gras + pastille sous l'icône quand il est
/// actif. Trois signaux plutôt qu'un seul changement de teinte, qui passait
/// inaperçu en plein soleil.
class _BottomItem extends StatelessWidget {
  final _Destination destination;
  final bool selected;
  final VoidCallback onTap;

  const _BottomItem({required this.destination, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = selected ? NC.brand : NC.faint;
    return Semantics(
      button: true,
      selected: selected,
      label: destination.label,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          AnimatedScale(
            scale: selected ? 1.08 : 1,
            duration: M.fast,
            curve: M.spring,
            child: Icon(selected ? destination.active : destination.inactive, color: color, size: 24),
          ),
          const SizedBox(height: 3),
          Text(
            destination.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
            ),
          ),
          const SizedBox(height: 3),
          AnimatedContainer(
            duration: M.fast,
            curve: M.ease,
            height: 3,
            width: selected ? 18 : 0,
            decoration: BoxDecoration(color: NC.brand, borderRadius: BorderRadius.circular(R.pill)),
          ),
        ]),
      ),
    );
  }
}

/// Barre de panier flottante — n'existe que lorsque le panier est rempli.
class _CartBar extends StatelessWidget {
  final VoidCallback onTap;
  const _CartBar({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: cart,
      builder: (context, _) {
        final visible = cart.count > 0;
        return AnimatedSize(
          duration: M.base,
          curve: M.ease,
          alignment: Alignment.bottomCenter,
          child: visible
              ? Padding(
                  padding: const EdgeInsets.fromLTRB(Sp.md, 0, Sp.md, Sp.sm),
                  child: Semantics(
                    button: true,
                    label: 'Voir le panier, ${cart.count} articles, ${fcfa(cart.subtotal)}',
                    child: PressableScale(
                      onTap: onTap,
                      child: Container(
                        height: 54,
                        padding: const EdgeInsets.symmetric(horizontal: Sp.lg),
                        decoration: BoxDecoration(
                          gradient: NC.brandGradient,
                          borderRadius: BorderRadius.circular(R.md),
                          boxShadow: [
                            BoxShadow(
                                color: NC.brand.withValues(alpha: 0.34),
                                blurRadius: 20,
                                offset: const Offset(0, 8)),
                          ],
                        ),
                        child: Row(children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.22),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('${cart.count}',
                                style: const TextStyle(
                                    color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
                          ),
                          const SizedBox(width: Sp.md),
                          const Expanded(
                            child: Text('Voir le panier',
                                style: TextStyle(
                                    color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15.5)),
                          ),
                          Text(fcfa(cart.subtotal),
                              style: const TextStyle(
                                  color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15.5)),
                        ]),
                      ),
                    ),
                  ),
                )
              : const SizedBox(width: double.infinity),
        );
      },
    );
  }
}
