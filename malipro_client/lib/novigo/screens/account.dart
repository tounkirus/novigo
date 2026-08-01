import 'package:flutter/material.dart';

import '../data/session.dart';
import '../favorites.dart';
import '../ui/ui.dart';
import 'addresses.dart';
import 'chat.dart';
import 'coupons.dart';
import 'favorites_screen.dart';
import 'login.dart';
import 'loyalty.dart';
import 'premium.dart';
import 'referral.dart';
import 'settings.dart';
import 'support.dart';
import 'wallet_screen.dart';

/// Profil — trois groupes seulement : mon compte, mes avantages, l'assistance.
///
/// Onze entrées les unes sous les autres se lisaient comme une liste
/// administrative ; regroupées par intention, on trouve ce qu'on cherche sans
/// lire tous les libellés.
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  /// +22370000000 -> « +223 70 00 00 00 ».
  static String prettyPhone(String? raw) {
    final digits = (raw ?? '').replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length < 11) return raw ?? 'Non connecté';
    final local = digits.substring(digits.length - 8);
    final pairs = <String>[for (var i = 0; i < local.length; i += 2) local.substring(i, i + 2)];
    return '+223 ${pairs.join(' ')}';
  }

  void _go(BuildContext c, Widget screen) =>
      Navigator.of(c).push(MaterialPageRoute(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return SafeArea(
      bottom: false,
      child: NovigoContentWidth(
        child: ListView(
          padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, 120),
          children: [
            const Text('Mon profil', style: T.h1),
            const SizedBox(height: Sp.lg),

            // ───── Identité ─────
            NovigoCard(
              child: Row(children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: const Icon(Icons.person_rounded, color: Colors.white, size: 28),
                ),
                const SizedBox(width: Sp.md + 2),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Mon compte', style: T.title),
                    const SizedBox(height: 3),
                    // Numéro réellement connecté, pas un contact de démo.
                    Text(prettyPhone(session.phone), style: T.muted),
                  ]),
                ),
                const Icon(Icons.qr_code_2_rounded, color: NC.muted),
              ]),
            ),
            const SizedBox(height: Sp.md + 2),

            // ───── Solde ─────
            NovigoCard(
              onTap: () => _go(context, const WalletScreen()),
              radius: R.xl,
              gradient: NC.premiumGradient,
              elevated: true,
              padding: const EdgeInsets.all(Sp.lg + 2),
              semanticLabel: 'Solde NOVIGO Pay, 45 200 FCFA, ouvrir le portefeuille',
              child: Row(children: [
                const Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Solde NOVIGO Pay',
                        style: TextStyle(color: Colors.white70, fontSize: 13)),
                    SizedBox(height: Sp.xs + 2),
                    Text('45 200 FCFA',
                        style: TextStyle(
                            color: Colors.white, fontWeight: FontWeight.w900, fontSize: 26)),
                  ]),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: Sp.md + 2, vertical: Sp.sm + 2),
                  decoration:
                      BoxDecoration(color: NC.brand, borderRadius: BorderRadius.circular(12)),
                  child: const Text('Recharger',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                ),
              ]),
            ),

            // ───── Groupe 1 · Mon compte ─────
            const SizedBox(height: Sp.section),
            const NovigoSectionHeader(overline: 'Compte', title: 'Mes informations'),
            const SizedBox(height: Sp.md),
            ListenableBuilder(
              listenable: favorites,
              builder: (_, __) => NovigoTileGroup(children: [
                NovigoTile(
                  icon: Icons.favorite_border,
                  label: 'Favoris',
                  trailingText: favorites.count > 0 ? '${favorites.count}' : null,
                  onTap: () => _go(context, const FavoritesScreen()),
                ),
                NovigoTile(
                  icon: Icons.location_on_outlined,
                  label: 'Adresses',
                  onTap: () => _go(context, const AddressesScreen()),
                ),
                NovigoTile(
                  icon: Icons.confirmation_number_outlined,
                  label: 'Coupons & promos',
                  onTap: () => _go(context, const CouponsScreen()),
                ),
              ]),
            ),

            // ───── Groupe 2 · Avantages ─────
            const SizedBox(height: Sp.section),
            const NovigoSectionHeader(overline: 'Avantages', title: 'Fidélité & parrainage'),
            const SizedBox(height: Sp.md),
            NovigoTileGroup(children: [
              NovigoTile(
                icon: Icons.workspace_premium_outlined,
                tone: NC.gold,
                label: 'NOVIGO Premium',
                onTap: () => _go(context, const PremiumScreen()),
              ),
              NovigoTile(
                icon: Icons.stars_rounded,
                tone: NC.gold,
                label: 'Fidélité',
                onTap: () => _go(context, const LoyaltyScreen()),
              ),
              NovigoTile(
                icon: Icons.card_giftcard_rounded,
                label: 'Parrainage',
                onTap: () => _go(context, const ReferralScreen()),
              ),
              NovigoTile(
                icon: Icons.chat_bubble_outline_rounded,
                label: 'Messages',
                onTap: () => _go(context, const ChatScreen()),
              ),
            ]),

            // ───── Groupe 3 · Assistance ─────
            const SizedBox(height: Sp.section),
            const NovigoSectionHeader(overline: 'Assistance', title: 'Aide & réglages'),
            const SizedBox(height: Sp.md),
            NovigoTileGroup(children: [
              NovigoTile(
                icon: Icons.help_outline_rounded,
                label: 'Aide & support',
                onTap: () => _go(context, const SupportScreen()),
              ),
              NovigoTile(
                icon: Icons.settings_outlined,
                label: 'Paramètres',
                onTap: () => _go(context, const SettingsScreen()),
              ),
              NovigoTile(
                icon: Icons.logout_rounded,
                label: 'Déconnexion',
                danger: true,
                onTap: () => _confirmSignOut(context),
              ),
            ]),
          ],
        ),
      ),
    );
  }

  /// La déconnexion purge le coffre : elle mérite une confirmation, sinon un
  /// appui malheureux renvoie l'utilisateur à l'écran OTP sans prévenir.
  Future<void> _confirmSignOut(BuildContext context) async {
    final confirmed = await showNovigoSheet<bool>(
      context,
      builder: (sheetContext) => NovigoBottomSheet(
        title: 'Se déconnecter ?',
        subtitle: 'Vous devrez ressaisir votre numéro pour revenir.',
        footer: Row(children: [
          Expanded(
            child: NovigoButton.secondary(
              label: 'Annuler',
              onPressed: () => Navigator.pop(sheetContext, false),
            ),
          ),
          const SizedBox(width: Sp.md),
          Expanded(
            child: NovigoButton(
              label: 'Se déconnecter',
              variant: NovigoButtonVariant.danger,
              onPressed: () => Navigator.pop(sheetContext, true),
            ),
          ),
        ]),
        child: const SizedBox.shrink(),
      ),
    );
    if (confirmed != true || !context.mounted) return;
    // Purge aussi le numéro mémorisé, sinon le prochain lancement rouvrirait
    // la session qu'on vient de fermer.
    await session.signOut();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (r) => false,
    );
  }
}
