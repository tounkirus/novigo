import 'package:flutter/material.dart';
import '../theme.dart';
import '../data.dart';
import '../widgets.dart';
import 'wallet.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Compte', style: T.h1),
        const SizedBox(height: 16),
        // Profil boutique
        Container(
          padding: const EdgeInsets.all(16),
          decoration: cardDeco(radius: 20),
          child: const Row(children: [
            Avatar(Shop.initials, size: 60),
            SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Flexible(child: Text(Shop.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
                  SizedBox(width: 6),
                  Icon(Icons.verified_rounded, color: NC.info, size: 18),
                ]),
                SizedBox(height: 4),
                Text('${Shop.category} · ${Shop.district}', style: T.muted),
                SizedBox(height: 6),
                Row(children: [
                  Icon(Icons.star_rounded, color: NC.gold, size: 16),
                  SizedBox(width: 3),
                  Text('${Shop.rating}',
                      style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 13.5)),
                  SizedBox(width: 4),
                  Text('(${Shop.reviews} avis)', style: TextStyle(color: NC.muted, fontSize: 12.5)),
                ]),
              ]),
            ),
          ]),
        ),
        const SizedBox(height: 14),
        // Carte revenus
        GestureDetector(
          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WalletScreen())),
          behavior: HitTestBehavior.opaque,
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(20)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Row(children: [
                Icon(Icons.account_balance_wallet_rounded, color: Colors.white70, size: 18),
                SizedBox(width: 8),
                Text('Revenus disponibles', style: TextStyle(color: Colors.white70, fontSize: 13)),
              ]),
              const SizedBox(height: 8),
              const Text('182 400 FCFA',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 28)),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(color: NC.brand, borderRadius: BorderRadius.circular(12)),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Text('Voir le portefeuille', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                  SizedBox(width: 6),
                  Icon(Icons.chevron_right_rounded, color: Colors.white, size: 18),
                ]),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 18),
        _group([
          _tile(Icons.storefront_outlined, 'Infos boutique'),
          _tile(Icons.schedule_rounded, 'Horaires d\'ouverture'),
          _tile(Icons.delivery_dining_rounded, 'Livraison & zones'),
        ]),
        const SizedBox(height: 14),
        _group([
          _tile(Icons.help_outline_rounded, 'Aide & support'),
          _tile(Icons.settings_outlined, 'Paramètres'),
          _tile(Icons.logout_rounded, 'Déconnexion', danger: true),
        ]),
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _group(List<Widget> children) => Container(
        decoration: cardDeco(radius: 18),
        clipBehavior: Clip.antiAlias,
        child: Column(children: children),
      );

  Widget _tile(IconData icon, String label, {bool danger = false}) => ListTile(
        leading: Icon(icon, color: danger ? NC.error : NC.brand),
        title: Text(label, style: TextStyle(color: danger ? NC.error : NC.ink, fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right_rounded, color: NC.faint),
        onTap: () {},
      );
}
