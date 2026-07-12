import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../application/deliveries_providers.dart';

/// Onboarding livreur : affiché au premier login tant que le véhicule n'est pas
/// renseigné. Appelle POST /drivers/me puis rafraîchit le profil.
class DriverOnboardingScreen extends ConsumerStatefulWidget {
  const DriverOnboardingScreen({super.key, this.initial});
  final Map<String, dynamic>? initial;

  @override
  ConsumerState<DriverOnboardingScreen> createState() =>
      _DriverOnboardingScreenState();
}

class _DriverOnboardingScreenState
    extends ConsumerState<DriverOnboardingScreen> {
  String? _vehicleType;
  late final TextEditingController _plateNumber;
  bool _busy = false;

  static const _vehicles = ['MOTO', 'VOITURE', 'VELO', 'CAMIONNETTE'];

  @override
  void initState() {
    super.initState();
    final v = widget.initial?['vehicleType']?.toString();
    if (v != null && _vehicles.contains(v)) _vehicleType = v;
    _plateNumber =
        TextEditingController(text: widget.initial?['plateNumber']?.toString() ?? '');
  }

  @override
  void dispose() {
    _plateNumber.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_vehicleType == null) {
      showError(context, 'Choisissez votre type de véhicule.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(deliveriesRepositoryProvider).completeProfile(
            vehicleType: _vehicleType,
            plateNumber: _plateNumber.text.trim(),
          );
      bumpRefresh(ref);
      if (mounted) showInfo(context, 'Profil enregistré. Bonne route !');
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
      appBar: AppBar(title: const Text('Bienvenue sur NOVIGO Livreur')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Complétez votre profil',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Renseignez votre véhicule pour commencer à livrer.',
                style: TextStyle(color: Theme.of(context).hintColor)),
            const SizedBox(height: 20),
            DropdownButtonFormField<String>(
              initialValue: _vehicleType,
              decoration: const InputDecoration(
                labelText: 'Type de véhicule *',
                prefixIcon: Icon(Icons.two_wheeler_outlined),
              ),
              items: _vehicles
                  .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                  .toList(),
              onChanged: (v) => setState(() => _vehicleType = v),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _plateNumber,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Plaque d\'immatriculation',
                hintText: 'Ex. BKO-1234',
                prefixIcon: Icon(Icons.confirmation_number_outlined),
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
