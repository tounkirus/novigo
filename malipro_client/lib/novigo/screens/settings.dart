import 'package:flutter/material.dart';
import '../theme.dart';

/// Paramètres de l'application (bascules visuelles + langue, tout en mock).
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushNotif = true;
  bool _promos = true;
  bool _localisation = true;
  bool _darkMode = true;
  String _langue = 'Français';

  void _snack(String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Paramètres', style: T.h2)),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            _sectionLabel('Notifications'),
            _group([
              _switch(
                icon: Icons.notifications_active_outlined,
                title: 'Notifications push',
                subtitle: 'Suivi de commande et alertes',
                value: _pushNotif,
                onChanged: (v) => setState(() => _pushNotif = v),
              ),
              _divider(),
              _switch(
                icon: Icons.local_offer_outlined,
                title: 'Promotions',
                subtitle: 'Offres et bons plans NOVIGO',
                value: _promos,
                onChanged: (v) => setState(() => _promos = v),
              ),
            ]),
            const SizedBox(height: 20),
            _sectionLabel('Préférences'),
            _group([
              _switch(
                icon: Icons.my_location_outlined,
                title: 'Localisation',
                subtitle: 'Adresses et livreurs à proximité',
                value: _localisation,
                onChanged: (v) => setState(() => _localisation = v),
              ),
              _divider(),
              _switch(
                icon: Icons.dark_mode_outlined,
                title: 'Mode sombre',
                subtitle: 'Thème sombre premium',
                value: _darkMode,
                onChanged: (v) => setState(() => _darkMode = v),
              ),
              _divider(),
              _langueTile(),
            ]),
            const SizedBox(height: 20),
            _sectionLabel('À propos'),
            _group([
              _nav(Icons.privacy_tip_outlined, 'Confidentialité', () => _snack('Politique de confidentialité')),
              _divider(),
              _nav(Icons.description_outlined, 'Conditions d\'utilisation', () => _snack('Conditions d\'utilisation')),
              _divider(),
              const _VersionTile(),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String t) => Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 10),
        child: Text(t.toUpperCase(),
            style: const TextStyle(color: NC.faint, fontWeight: FontWeight.w800, fontSize: 12, letterSpacing: 0.8)),
      );

  Widget _group(List<Widget> children) => Container(
        decoration: cardDeco(radius: 18),
        clipBehavior: Clip.antiAlias,
        child: Column(children: children),
      );

  Widget _divider() => const Divider(color: NC.line, height: 1, indent: 16, endIndent: 16);

  Widget _switch({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      secondary: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: NC.brand, size: 20),
      ),
      title: Text(title, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 15)),
      subtitle: Text(subtitle, style: T.muted),
      value: value,
      activeColor: Colors.white,
      activeTrackColor: NC.brand,
      inactiveThumbColor: NC.muted,
      inactiveTrackColor: NC.surfaceAlt,
      onChanged: onChanged,
    );
  }

  Widget _langueTile() {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
        child: const Icon(Icons.language_rounded, color: NC.brand, size: 20),
      ),
      title: const Text('Langue', style: TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 15)),
      subtitle: Text(_langue, style: T.muted),
      trailing: const Icon(Icons.chevron_right_rounded, color: NC.faint),
      onTap: _pickLangue,
    );
  }

  void _pickLangue() {
    const langues = ['Français', 'Bambara', 'English'];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: NC.paper,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          top: false,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const SizedBox(height: 10),
            Container(width: 44, height: 5, decoration: BoxDecoration(color: NC.line, borderRadius: BorderRadius.circular(999))),
            const SizedBox(height: 12),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text('Choisir la langue', style: T.title),
            ),
            for (final l in langues)
              ListTile(
                title: Text(l, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w600, fontSize: 15)),
                trailing: _langue == l ? const Icon(Icons.check_rounded, color: NC.brand) : null,
                onTap: () {
                  setState(() => _langue = l);
                  Navigator.pop(context);
                  _snack('Langue : $l');
                },
              ),
            const SizedBox(height: 8),
          ]),
        ),
      ),
    );
  }

  Widget _nav(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: NC.brand, size: 20),
      ),
      title: Text(title, style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 15)),
      trailing: const Icon(Icons.chevron_right_rounded, color: NC.faint),
      onTap: onTap,
    );
  }
}

class _VersionTile extends StatelessWidget {
  const _VersionTile();
  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(12)),
        child: const Icon(Icons.info_outline_rounded, color: NC.muted, size: 20),
      ),
      title: const Text('Version', style: TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 15)),
      trailing: const Text('1.0.0', style: TextStyle(color: NC.faint, fontWeight: FontWeight.w700)),
    );
  }
}
