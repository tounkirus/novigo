import 'package:flutter/material.dart';
import '../theme.dart';
import '../data/voice_api.dart';
import '../voice_service.dart';

/// Écran « Annonces vocales » : le livreur règle ce qu'il entend et vérifie
/// immédiatement le résultat. Tout est enregistré côté serveur (§5 et §6 du
/// cahier des charges) ; l'écran ne fabrique aucune phrase lui-même.
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
      backgroundColor: NC.shell,
      appBar: AppBar(
        backgroundColor: NC.shell,
        elevation: 0,
        leading: const BackButton(color: NC.ink),
        title: const Text('Annonces vocales', style: T.title),
      ),
      body: ListenableBuilder(
        listenable: voice,
        builder: (context, _) {
          final s = voice.settings;
          return RefreshIndicator(
            onRefresh: _charger,
            color: NC.brand,
            backgroundColor: NC.surface,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                _carteEtat(s),
                const SizedBox(height: 16),
                _section('Langue'),
                Row(children: [
                  Expanded(child: _choix('Français', s.language == 'fr', () => _maj(s.copyWith(language: 'fr')))),
                  const SizedBox(width: 10),
                  Expanded(child: _choix('Bambara', s.language == 'bm', () => _maj(s.copyWith(language: 'bm')))),
                ]),
                const SizedBox(height: 18),
                _section('Voix'),
                Row(children: [
                  Expanded(child: _choix('Féminine', s.voice == 'FEMALE', () => _maj(s.copyWith(voice: 'FEMALE')))),
                  const SizedBox(width: 10),
                  Expanded(child: _choix('Masculine', s.voice == 'MALE', () => _maj(s.copyWith(voice: 'MALE')))),
                ]),
                const SizedBox(height: 18),
                _curseur(
                  'Vitesse de lecture',
                  s.speed,
                  0.5,
                  2,
                  '×${s.speed.toStringAsFixed(1)}',
                  (v) => _maj(s.copyWith(speed: v)),
                ),
                _curseur(
                  'Volume',
                  s.volume,
                  0,
                  1,
                  '${(s.volume * 100).round()} %',
                  (v) => _maj(s.copyWith(volume: v)),
                ),
                const SizedBox(height: 6),
                _section('Répétition'),
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
                const SizedBox(height: 22),
                _boutonTest(),
                const SizedBox(height: 24),
                _section('Dernières annonces'),
                if (_chargement)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 18),
                    child: Center(child: CircularProgressIndicator(color: NC.brand)),
                  )
                else if (_journal.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: cardDeco(radius: 16),
                    child: const Text('Aucune annonce pour le moment.', style: T.muted),
                  )
                else
                  ..._journal.map(_ligneJournal),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _carteEtat(VoiceSettings s) => Container(
        padding: const EdgeInsets.all(18),
        decoration: cardDeco(radius: 20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: (s.enabled ? NC.brand : NC.faint).withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(s.enabled ? Icons.campaign_rounded : Icons.volume_off_rounded,
                  color: s.enabled ? NC.brand : NC.faint),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(s.enabled ? 'Annonces activées' : 'Annonces désactivées', style: T.title),
                Text(
                  s.enabled
                      ? 'Vous êtes prévenu à la voix, sans regarder l’écran.'
                      : 'Vous ne recevrez aucune annonce vocale.',
                  style: T.muted,
                ),
              ]),
            ),
            Switch(
              value: s.enabled,
              onChanged: (v) => _maj(s.copyWith(enabled: v)),
              activeThumbColor: Colors.white,
              activeTrackColor: NC.brand,
              inactiveThumbColor: NC.faint,
              inactiveTrackColor: NC.surfaceAlt,
            ),
          ]),
          if (!voice.available) ...[
            const SizedBox(height: 12),
            const Row(children: [
              Icon(Icons.error_outline_rounded, size: 17, color: NC.gold),
              SizedBox(width: 8),
              Expanded(
                child: Text('Aucun moteur vocal détecté sur cet appareil.', style: T.muted),
              ),
            ]),
          ],
          if (voice.lastError != null) ...[
            const SizedBox(height: 10),
            Text(voice.lastError!, style: const TextStyle(color: NC.gold, fontSize: 12.5)),
          ],
          const SizedBox(height: 10),
          Text('Annonces reçues sur cet appareil : ${voice.received}',
              style: const TextStyle(color: NC.faint, fontSize: 12)),
          if (voice.lastSpoken != null) ...[
            const SizedBox(height: 12),
            Container(height: 1, color: NC.line),
            const SizedBox(height: 12),
            const Text('Dernière annonce prononcée',
                style: TextStyle(color: NC.faint, fontSize: 11.5, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text('« ${voice.lastSpoken!} »', style: T.body),
          ],
        ]),
      );

  Widget _boutonTest() => SizedBox(
        width: double.infinity,
        height: 52,
        child: FilledButton.icon(
          style: FilledButton.styleFrom(
            backgroundColor: NC.brand,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          onPressed: voice.speaking ? null : () => voice.speakTest(),
          icon: Icon(voice.speaking ? Icons.graphic_eq_rounded : Icons.play_arrow_rounded,
              color: Colors.white),
          label: Text(voice.speaking ? 'Lecture en cours…' : 'Tester l’annonce',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
        ),
      );

  Widget _ligneJournal(VoiceLogEntry e) {
    final couleur = e.status == 'PLAYED'
        ? NC.success
        : e.status == 'FAILED'
            ? NC.brand
            : NC.faint;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: cardDeco(radius: 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
            decoration: BoxDecoration(
              color: couleur.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(e.statusLabel,
                style: TextStyle(color: couleur, fontWeight: FontWeight.w800, fontSize: 11.5)),
          ),
          const Spacer(),
          Text(e.channel, style: const TextStyle(color: NC.faint, fontSize: 11)),
        ]),
        const SizedBox(height: 8),
        Text('« ${e.text} »', style: T.body),
      ]),
    );
  }

  Widget _section(String titre) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(titre, style: T.h2),
      );

  /// Bouton de choix. Volontairement SANS `Expanded` : l'étirement est décidé
  /// par l'appelant (`Expanded` sous un `Padding` casse le rendu en release).
  Widget _choix(String label, bool actif, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Container(
          height: 46,
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          decoration: BoxDecoration(
            color: actif ? NC.brand.withValues(alpha: 0.16) : NC.surfaceAlt,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: actif ? NC.brand : NC.line),
          ),
          child: Text(label,
              style: TextStyle(
                  color: actif ? NC.brand : NC.muted, fontWeight: FontWeight.w700, fontSize: 14)),
        ),
      );

  Widget _curseur(
    String titre,
    double valeur,
    double min,
    double max,
    String affichage,
    ValueChanged<double> onFin,
  ) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(titre, style: T.h2),
          Text(affichage,
              style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 14)),
        ]),
        Slider(
          value: valeur.clamp(min, max),
          min: min,
          max: max,
          divisions: ((max - min) * 10).round(),
          activeColor: NC.brand,
          inactiveColor: NC.line,
          // On enregistre à la fin du geste : un curseur ne doit pas produire
          // une requête par pixel parcouru.
          onChanged: (v) => setState(() => voice.settings = _appliquer(titre, v)),
          onChangeEnd: onFin,
        ),
        const SizedBox(height: 8),
      ]);

  /// Aperçu immédiat pendant le glissement (l'enregistrement suit au relâchement).
  VoiceSettings _appliquer(String titre, double v) =>
      titre.startsWith('Vitesse') ? voice.settings.copyWith(speed: v) : voice.settings.copyWith(volume: v);
}
