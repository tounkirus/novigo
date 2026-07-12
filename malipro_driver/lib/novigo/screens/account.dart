import 'package:flutter/material.dart';
import '../theme.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Compte', style: T.h1),
        const SizedBox(height: 16),
        // Profil livreur
        Container(
          padding: const EdgeInsets.all(16),
          decoration: cardDeco(radius: 20),
          child: Row(children: [
            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
              alignment: Alignment.center,
              child: const Text('MK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 22)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Moussa Keïta', style: T.title),
                const SizedBox(height: 3),
                const Text('+223 76 12 34 56', style: T.muted),
                const SizedBox(height: 8),
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                    decoration: BoxDecoration(color: NC.successSoft, borderRadius: BorderRadius.circular(999)),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.verified_rounded, color: NC.success, size: 13),
                      SizedBox(width: 4),
                      Text('Vérifié', style: TextStyle(color: NC.success, fontWeight: FontWeight.w700, fontSize: 12)),
                    ]),
                  ),
                  const SizedBox(width: 8),
                  const Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.star_rounded, color: NC.gold, size: 15),
                    SizedBox(width: 3),
                    Text('4.9', style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 13)),
                  ]),
                ]),
              ]),
            ),
          ]),
        ),
        const SizedBox(height: 14),
        // Véhicule
        Container(
          padding: const EdgeInsets.all(16),
          decoration: cardDeco(radius: 18),
          child: Row(children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.two_wheeler_rounded, color: NC.brand),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Moto · Yamaha Crux', style: T.body),
                Text('Plaque BA 4821 MB', style: T.muted),
              ]),
            ),
            const Icon(Icons.chevron_right_rounded, color: NC.faint),
          ]),
        ),
        const SizedBox(height: 18),
        _group([
          _tile(Icons.badge_outlined, 'Documents & KYC', trailingText: 'À jour'),
          _tile(Icons.receipt_long_rounded, 'Historique des paiements'),
          _tile(Icons.pedal_bike_rounded, 'Mon véhicule'),
        ]),
        const SizedBox(height: 14),
        _group([
          _tile(Icons.help_outline_rounded, 'Aide & support'),
          _tile(Icons.settings_outlined, 'Paramètres'),
          _tile(Icons.logout_rounded, 'Déconnexion', danger: true),
        ]),
        const SizedBox(height: 22),
        const Center(
          child: Text('NOVIGO Livreur · v1.0.0',
              style: TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w500)),
        ),
      ]),
    );
  }

  Widget _group(List<Widget> children) => Container(
        decoration: cardDeco(radius: 18),
        clipBehavior: Clip.antiAlias,
        child: Column(children: children),
      );

  Widget _tile(IconData icon, String label, {bool danger = false, String? trailingText}) => ListTile(
        leading: Icon(icon, color: danger ? NC.error : NC.brand),
        title: Text(label, style: TextStyle(color: danger ? NC.error : NC.ink, fontWeight: FontWeight.w600)),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          if (trailingText != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
              decoration: BoxDecoration(color: NC.successSoft, borderRadius: BorderRadius.circular(999)),
              child: Text(trailingText, style: const TextStyle(color: NC.success, fontWeight: FontWeight.w800, fontSize: 12.5)),
            ),
            const SizedBox(width: 8),
          ],
          const Icon(Icons.chevron_right_rounded, color: NC.faint),
        ]),
        onTap: () {},
      );
}
