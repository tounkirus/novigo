import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../application/shop_providers.dart';

/// Onboarding marchand : affiché au premier login tant que le profil n'est pas
/// renseigné. Appelle POST /merchants/me puis rafraîchit le profil.
class MerchantOnboardingScreen extends ConsumerStatefulWidget {
  const MerchantOnboardingScreen({super.key, this.initial});
  final Map<String, dynamic>? initial;

  @override
  ConsumerState<MerchantOnboardingScreen> createState() =>
      _MerchantOnboardingScreenState();
}

class _MerchantOnboardingScreenState
    extends ConsumerState<MerchantOnboardingScreen> {
  late final TextEditingController _businessName;
  String? _category;
  bool _busy = false;

  static const _categories = [
    'RESTAURANT',
    'GROCERY',
    'PHARMACY',
    'FASHION',
    'ELECTRONICS',
    'OTHER',
  ];

  @override
  void initState() {
    super.initState();
    final b = (widget.initial?['businessName'] ?? '').toString();
    _businessName =
        TextEditingController(text: b == 'À renseigner' ? '' : b);
    final c = widget.initial?['category']?.toString();
    if (c != null && _categories.contains(c)) _category = c;
  }

  @override
  void dispose() {
    _businessName.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _businessName.text.trim();
    if (name.isEmpty) {
      showError(context, 'Indiquez le nom de votre commerce.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(merchantRepositoryProvider).completeProfile(
            businessName: name,
            category: _category,
          );
      bumpRefresh(ref);
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
      appBar: AppBar(title: const Text('Bienvenue sur NOVIGO Marchand')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Complétez votre profil',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Ces informations identifient votre commerce.',
                style: TextStyle(color: Theme.of(context).hintColor)),
            const SizedBox(height: 20),
            TextField(
              controller: _businessName,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Nom du commerce *',
                hintText: 'Ex. Alimentation Diarra',
                prefixIcon: Icon(Icons.storefront_outlined),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(
                labelText: 'Catégorie',
                prefixIcon: Icon(Icons.category_outlined),
              ),
              items: _categories
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: (v) => setState(() => _category = v),
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
