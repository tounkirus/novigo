import 'package:flutter/material.dart';

import '../../core/theme.dart';
import '../data/voice_api.dart';
import '../voice_service.dart';

/// Écran « Annonces vocales » de l'application artisan.
/// Mêmes réglages et même API que côté livreur — habillage du thème artisan.
class VoiceSettingsScreen extends StatefulWidget {
  const VoiceSettingsScreen({super.key});

  @override
  State<VoiceSettingsScreen> createState() => _VoiceSettingsScreenState();
}

class _VoiceSettingsScreenState extends State<VoiceSettingsScreen> {
  List<VoiceLogEntry> _journal = const [];
  bool _chargement = true;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    await voice.loadSettings();
    try {
      final j = await voiceApi.history(limit: 15);
      if (mounted) setState(() => _journal = j);
    } catch (_) {
      // Journal indisponible (hors ligne) : l'écran reste utilisable.
    }
    if (mounted) setState(() => _chargement = false);
  }

  Future<void> _maj(VoiceSettings s) => voice.saveSettings(s);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Annonces vocales')),
      body: ListenableBuilder(
        listenable: voice,
        builder: (context, _) {
          final s = voice.settings;
          return RefreshIndicator(
            onRefresh: _charger,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              children: [
                _carte(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: s.enabled,
                      activeThumbColor: AppColors.brand,
                      onChanged: (v) => _maj(s.copyWith(enabled: v)),
                      title: Text(s.enabled ? 'Annonces activées' : 'Annonces désactivées',
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text(
                        s.enabled
                            ? 'Vous êtes prévenu à la voix, sans regarder l’écran.'
                            : 'Vous ne recevrez aucune annonce vocale.',
                        style: const TextStyle(fontSize: 12, color: AppColors.muted),
                      ),
                    ),
                    Text('Annonces reçues sur cet appareil : ${voice.received}',
                        style: const TextStyle(fontSize: 11.5, color: AppColors.muted)),
                    if (!voice.available)
                      const Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: Text('Aucun moteur vocal détecté sur cet appareil.',
                            style: TextStyle(fontSize: 12, color: AppColors.warning)),
                      ),
                    if (voice.lastError != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(voice.lastError!,
                            style: const TextStyle(fontSize: 12, color: AppColors.warning)),
                      ),
                    if (voice.lastSpoken != null) ...[
                      const Divider(height: 22),
                      const Text('Dernière annonce prononcée',
                          style: TextStyle(fontSize: 11.5, color: AppColors.muted)),
                      const SizedBox(height: 4),
                      Text('« ${voice.lastSpoken!} »'),
                    ],
                  ]),
                ),
                const SizedBox(height: 16),
                _titre('Langue'),
                Row(children: [
                  Expanded(child: _choix('Français', s.language == 'fr', () => _maj(s.copyWith(language: 'fr')))),
                  const SizedBox(width: 10),
                  Expanded(child: _choix('Bambara', s.language == 'bm', () => _maj(s.copyWith(language: 'bm')))),
                ]),
                const SizedBox(height: 16),
                _titre('Voix'),
                Row(children: [
                  Expanded(child: _choix('Féminine', s.voice == 'FEMALE', () => _maj(s.copyWith(voice: 'FEMALE')))),
                  const SizedBox(width: 10),
                  Expanded(child: _choix('Masculine', s.voice == 'MALE', () => _maj(s.copyWith(voice: 'MALE')))),
                ]),
                const SizedBox(height: 16),
                _curseur('Vitesse de lecture', s.speed, 0.5, 2, '×${s.speed.toStringAsFixed(1)}',
                    (v) => _maj(s.copyWith(speed: v)), (v) => voice.settings = s.copyWith(speed: v)),
                _curseur('Volume', s.volume, 0, 1, '${(s.volume * 100).round()} %',
                    (v) => _maj(s.copyWith(volume: v)), (v) => voice.settings = s.copyWith(volume: v)),
                const SizedBox(height: 4),
                _titre('Répétition'),
                Row(children: List.generate(3, (i) {
                  final n = i + 1;
                  return Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(right: i < 2 ? 10 : 0),
                      child: _choix(n == 1 ? '1 fois' : '$n fois', s.repeatCount == n,
                          () => _maj(s.copyWith(repeatCount: n))),
                    ),
                  );
                })),
                const SizedBox(height: 20),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.brand,
                    minimumSize: const Size.fromHeight(50),
                  ),
                  onPressed: voice.speaking ? null : () => voice.speakTest(),
                  icon: Icon(voice.speaking ? Icons.graphic_eq_rounded : Icons.play_arrow_rounded),
                  label: Text(voice.speaking ? 'Lecture en cours…' : 'Tester l’annonce'),
                ),
                const SizedBox(height: 22),
                _titre('Dernières annonces'),
                if (_chargement)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 18),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_journal.isEmpty)
                  _carte(child: const Text('Aucune annonce pour le moment.',
                      style: TextStyle(color: AppColors.muted)))
                else
                  ..._journal.map(_ligne),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _carte({required Widget child}) => Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.line),
        ),
        child: Padding(padding: const EdgeInsets.all(14), child: child),
      );

  Widget _titre(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(t, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
      );

  Widget _choix(String label, bool actif, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Container(
          height: 46,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: actif ? AppColors.brand.withValues(alpha: 0.12) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: actif ? AppColors.brand : AppColors.line),
          ),
          child: Text(label,
              style: TextStyle(
                  color: actif ? AppColors.brand : AppColors.muted,
                  fontWeight: FontWeight.w700,
                  fontSize: 14)),
        ),
      );

  Widget _ligne(VoiceLogEntry e) {
    final couleur = e.status == 'PLAYED'
        ? AppColors.success
        : e.status == 'FAILED'
            ? AppColors.error
            : AppColors.muted;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: _carte(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
              decoration: BoxDecoration(
                color: couleur.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(e.statusLabel,
                  style: TextStyle(color: couleur, fontWeight: FontWeight.w800, fontSize: 11)),
            ),
            const Spacer(),
            Text(e.channel, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
          ]),
          const SizedBox(height: 8),
          Text('« ${e.text} »'),
        ]),
      ),
    );
  }

  Widget _curseur(
    String titre,
    double valeur,
    double min,
    double max,
    String affichage,
    ValueChanged<double> onFin,
    ValueChanged<double> apercu,
  ) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(titre, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          Text(affichage, style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.w800)),
        ]),
        Slider(
          value: valeur.clamp(min, max),
          min: min,
          max: max,
          divisions: ((max - min) * 10).round(),
          activeColor: AppColors.brand,
          // Aperçu pendant le glissement, enregistrement au relâchement.
          onChanged: (v) => setState(() => apercu(v)),
          onChangeEnd: onFin,
        ),
      ]);
}
