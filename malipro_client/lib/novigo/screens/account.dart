import 'package:flutter/material.dart';
import '../theme.dart';
import '../favorites.dart';
import 'favorites_screen.dart';
import 'wallet_screen.dart';
import 'addresses.dart';
import 'coupons.dart';
import 'support.dart';
import 'settings.dart';
import 'loyalty.dart';
import 'premium.dart';
import 'referral.dart';
import 'chat.dart';
import 'login.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Mon compte', style: T.h1),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: cardDeco(radius: 20),
          child: Row(children: [
            Container(
              width: 56, height: 56,
              decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
              alignment: Alignment.center,
              child: const Text('YT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 20)),
            ),
            const SizedBox(width: 14),
            const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Youssouf Tounkara', style: T.title),
              SizedBox(height: 3),
              Text('+223 70 00 00 00', style: T.muted),
            ])),
            const Icon(Icons.qr_code_2_rounded, color: NC.muted),
          ]),
        ),
        const SizedBox(height: 14),
        // Solde wallet
        GestureDetector(
          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WalletScreen())),
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(gradient: NC.premiumGradient, borderRadius: BorderRadius.circular(20)),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Text('Solde NOVIGO Pay', style: TextStyle(color: Colors.white70, fontSize: 13)),
                SizedBox(height: 6),
                Text('45 200 FCFA', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 26)),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(color: NC.brand, borderRadius: BorderRadius.circular(12)),
                child: const Text('Recharger', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 18),
        _group([
          _tile(Icons.favorite_border, 'Favoris',
              trailingText: favorites.count > 0 ? '${favorites.count}' : null,
              onTap: () => _go(context, const FavoritesScreen())),
          _tile(Icons.location_on_outlined, 'Adresses',
              onTap: () => _go(context, const AddressesScreen())),
          _tile(Icons.confirmation_number_outlined, 'Coupons & promos',
              onTap: () => _go(context, const CouponsScreen())),
        ]),
        const SizedBox(height: 14),
        _group([
          _tile(Icons.workspace_premium_outlined, 'NOVIGO Premium',
              onTap: () => _go(context, const PremiumScreen())),
          _tile(Icons.stars_rounded, 'Fidélité',
              onTap: () => _go(context, const LoyaltyScreen())),
          _tile(Icons.card_giftcard_rounded, 'Parrainage',
              onTap: () => _go(context, const ReferralScreen())),
          _tile(Icons.chat_bubble_outline_rounded, 'Messages',
              onTap: () => _go(context, const ChatScreen())),
        ]),
        const SizedBox(height: 14),
        _group([
          _tile(Icons.help_outline_rounded, 'Aide & support',
              onTap: () => _go(context, const SupportScreen())),
          _tile(Icons.settings_outlined, 'Paramètres',
              onTap: () => _go(context, const SettingsScreen())),
          _tile(Icons.logout_rounded, 'Déconnexion', danger: true,
              onTap: () => Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()), (r) => false)),
        ]),
      ]),
    );
  }

  void _go(BuildContext c, Widget screen) =>
      Navigator.of(c).push(MaterialPageRoute(builder: (_) => screen));

  Widget _group(List<Widget> children) => Container(
        decoration: cardDeco(radius: 18),
        clipBehavior: Clip.antiAlias,
        child: Column(children: children),
      );

  Widget _tile(IconData icon, String label, {bool danger = false, String? trailingText, VoidCallback? onTap}) => Column(children: [
        ListTile(
          leading: Icon(icon, color: danger ? NC.error : NC.brand),
          title: Text(label, style: TextStyle(color: danger ? NC.error : NC.ink, fontWeight: FontWeight.w600)),
          trailing: Row(mainAxisSize: MainAxisSize.min, children: [
            if (trailingText != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(999)),
                child: Text(trailingText, style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 12.5)),
              ),
              const SizedBox(width: 8),
            ],
            const Icon(Icons.chevron_right_rounded, color: NC.faint),
          ]),
          onTap: onTap ?? () {},
        ),
      ]);
}
