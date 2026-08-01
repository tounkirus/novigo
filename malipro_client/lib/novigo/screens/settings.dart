import 'package:flutter/material.dart';

import '../ui/ui.dart';

/// Paramètres — **trois groupes** : ce qui vous alerte, ce que vous préférez, et
/// ce qu'est cette application.
///
/// La bascule « Mode sombre » a été remplacée par une simple ligne d'information :
/// NOVIGO n'a qu'un thème, et un interrupteur qui ne change rien à l'écran fait
/// douter de tous les autres.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushNotif = true;
  bool _promos = true;
  bool _localisation = true;
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

  Future<void> _pickLangue() async {
    const langues = ['Français', 'Bambara', 'English'];
    final choice = await showNovigoSheet<String>(
      context,
      builder: (_) => NovigoBottomSheet(
        title: 'Choisir la langue',
        // `ListTile` peint son onde tactile sur le `Material` le plus proche ;
        // la feuille a un fond opaque, il faut donc lui en fournir un.
        child: Material(
          type: MaterialType.transparency,
          child: Column(children: [
            for (final l in langues)
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l,
                    style: const TextStyle(
                        color: NC.ink, fontWeight: FontWeight.w600, fontSize: 15)),
                trailing: _langue == l ? const Icon(Icons.check_rounded, color: NC.brand) : null,
                onTap: () => Navigator.pop(context, l),
              ),
          ]),
        ),
      ),
    );
    if (choice == null || !mounted) return;
    setState(() => _langue = choice);
    // L'application n'est pas encore traduite : le dire vaut mieux que de laisser
    // croire que l'interface va changer de langue.
    _snack(choice == 'Français'
        ? 'Langue : Français'
        : 'Langue enregistrée : $choice — traduction en cours de déploiement.');
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      appBar: AppBar(title: const Text('Paramètres', style: T.h2)),
      body: SafeArea(
        top: false,
        child: NovigoContentWidth(
          child: ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xxl),
            children: [
              const Text('NOTIFICATIONS', style: T.overline),
              const SizedBox(height: Sp.md),
              NovigoCard(
                padding: EdgeInsets.zero,
                clipBehavior: Clip.antiAlias,
                child: Column(children: [
                  _SettingSwitch(
                    icon: Icons.notifications_active_outlined,
                    title: 'Notifications push',
                    subtitle: 'Suivi de commande et alertes',
                    value: _pushNotif,
                    onChanged: (v) => setState(() => _pushNotif = v),
                  ),
                  const NovigoDivider(indent: 66),
                  _SettingSwitch(
                    icon: Icons.local_offer_outlined,
                    title: 'Promotions',
                    subtitle: 'Offres et bons plans NOVIGO',
                    value: _promos,
                    onChanged: (v) => setState(() => _promos = v),
                  ),
                ]),
              ),

              const SizedBox(height: Sp.xl),
              const Text('PRÉFÉRENCES', style: T.overline),
              const SizedBox(height: Sp.md),
              NovigoCard(
                padding: EdgeInsets.zero,
                clipBehavior: Clip.antiAlias,
                child: Column(children: [
                  _SettingSwitch(
                    icon: Icons.my_location_outlined,
                    title: 'Localisation',
                    subtitle: 'Adresses et livreurs à proximité',
                    value: _localisation,
                    onChanged: (v) => setState(() => _localisation = v),
                  ),
                  const NovigoDivider(indent: 66),
                  NovigoTile(
                    icon: Icons.language_rounded,
                    label: 'Langue',
                    subtitle: _langue,
                    onTap: _pickLangue,
                  ),
                  const NovigoDivider(indent: 66),
                  const _InfoRow(
                    icon: Icons.dark_mode_outlined,
                    label: 'Thème',
                    value: 'Sombre',
                  ),
                ]),
              ),

              const SizedBox(height: Sp.xl),
              const Text('À PROPOS', style: T.overline),
              const SizedBox(height: Sp.md),
              NovigoCard(
                padding: EdgeInsets.zero,
                clipBehavior: Clip.antiAlias,
                child: Column(children: [
                  NovigoTile(
                    icon: Icons.privacy_tip_outlined,
                    label: 'Confidentialité',
                    onTap: () => _snack('Politique de confidentialité'),
                  ),
                  const NovigoDivider(indent: 66),
                  NovigoTile(
                    icon: Icons.description_outlined,
                    label: 'Conditions d\'utilisation',
                    onTap: () => _snack('Conditions d\'utilisation'),
                  ),
                  const NovigoDivider(indent: 66),
                  const _InfoRow(
                    icon: Icons.info_outline_rounded,
                    label: 'Version',
                    value: '1.0.0',
                    neutral: true,
                  ),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Ligne à interrupteur, au même gabarit que `NovigoTile`.
class _SettingSwitch extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SettingSwitch({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      toggled: value,
      label: '$title, $subtitle',
      child: InkWell(
        onTap: () => onChanged(!value),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: Sp.lg, vertical: Sp.md),
          child: Row(children: [
            Container(
              width: 38,
              height: 38,
              decoration:
                  BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(11)),
              child: Icon(icon, color: NC.brand, size: 19),
            ),
            const SizedBox(width: Sp.md),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title,
                    style: const TextStyle(
                        color: NC.ink, fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 2),
                Text(subtitle, style: T.muted, maxLines: 2, overflow: TextOverflow.ellipsis),
              ]),
            ),
            const SizedBox(width: Sp.sm),
            Switch(
              value: value,
              onChanged: onChanged,
              activeThumbColor: Colors.white,
              activeTrackColor: NC.brand,
              inactiveThumbColor: NC.muted,
              inactiveTrackColor: NC.surfaceAlt,
            ),
          ]),
        ),
      ),
    );
  }
}

/// Ligne purement informative (pas de chevron, pas d'action).
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool neutral;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.neutral = false,
  });

  @override
  Widget build(BuildContext context) {
    final accent = neutral ? NC.muted : NC.brand;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Sp.lg, vertical: Sp.md + 2),
      child: Row(children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: neutral ? NC.surfaceAlt : NC.brandSoft,
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(icon, color: accent, size: 19),
        ),
        const SizedBox(width: Sp.md),
        Expanded(
          child: Text(label,
              style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w600, fontSize: 15)),
        ),
        Text(value, style: const TextStyle(color: NC.faint, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}
