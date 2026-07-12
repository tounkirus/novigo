import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../application/artisan_providers.dart';

/// Écran d'onboarding affiché au premier login tant que le profil artisan
/// n'est pas renseigné. Appelle POST /artisans/me puis rafraîchit le profil.
class ArtisanOnboardingScreen extends ConsumerStatefulWidget {
  const ArtisanOnboardingScreen({super.key, this.initial});
  final Map<String, dynamic>? initial;

  @override
  ConsumerState<ArtisanOnboardingScreen> createState() =>
      _ArtisanOnboardingScreenState();
}

class _ArtisanOnboardingScreenState
    extends ConsumerState<ArtisanOnboardingScreen> {
  late final TextEditingController _profession;
  late final TextEditingController _serviceArea;
  late final TextEditingController _bio;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final p = (widget.initial?['profession'] ?? '').toString();
    _profession = TextEditingController(text: p == 'À renseigner' ? '' : p);
    _serviceArea =
        TextEditingController(text: widget.initial?['serviceArea']?.toString() ?? '');
    _bio = TextEditingController(text: widget.initial?['bio']?.toString() ?? '');
  }

  @override
  void dispose() {
    _profession.dispose();
    _serviceArea.dispose();
    _bio.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final profession = _profession.text.trim();
    if (profession.isEmpty) {
      showError(context, 'Indiquez votre métier.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(artisanRepositoryProvider).completeProfile(
            profession: profession,
            serviceArea: _serviceArea.text.trim(),
            bio: _bio.text.trim(),
          );
      bumpRefresh(ref); // la porte du HomeShell ré-évalue et laisse passer.
      if (mounted) showInfo(context, 'Profil enregistré. Bienvenue !');
    } on ApiException catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        showError(context, e.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bienvenue sur MALIPRO Artisan')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Complétez votre profil',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Ces informations seront visibles par vos clients.',
                style: TextStyle(color: Theme.of(context).hintColor)),
            const SizedBox(height: 20),
            TextField(
              controller: _profession,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Métier *',
                hintText: 'Ex. Plombier, Électricien, Menuisier',
                prefixIcon: Icon(Icons.handyman_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _serviceArea,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Zone d\'intervention',
                hintText: 'Ex. Bamako, Kalaban Coro',
                prefixIcon: Icon(Icons.place_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _bio,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Présentation (optionnel)',
                hintText: 'Votre expérience, vos spécialités…',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _busy ? null : _submit,
              icon: _busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.check),
              label: Text(_busy ? 'Enregistrement…' : 'Commencer'),
            ),
          ],
        ),
      ),
    );
  }
}
