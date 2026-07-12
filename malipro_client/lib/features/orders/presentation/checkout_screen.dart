import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/money.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/providers.dart';
import '../../cart/application/cart_controller.dart';
import '../application/orders_providers.dart';

enum PayMethod { orangeMoney, wave, wallet, cash }

extension on PayMethod {
  String get api => switch (this) {
        PayMethod.orangeMoney => 'ORANGE_MONEY',
        PayMethod.wave => 'WAVE',
        PayMethod.wallet => 'WALLET',
        PayMethod.cash => 'CASH',
      };
  String get label => switch (this) {
        PayMethod.orangeMoney => 'Orange Money',
        PayMethod.wave => 'Wave',
        PayMethod.wallet => 'Portefeuille',
        PayMethod.cash => 'Espèces à la livraison',
      };
  IconData get icon => switch (this) {
        PayMethod.orangeMoney || PayMethod.wave => Icons.smartphone,
        PayMethod.wallet => Icons.account_balance_wallet_outlined,
        PayMethod.cash => Icons.payments_outlined,
      };
  bool get isMobileMoney => this == PayMethod.orangeMoney || this == PayMethod.wave;
  bool get isCash => this == PayMethod.cash;
}

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _line1 = TextEditingController(text: 'Rue 224, Porte 58');
  final _city = TextEditingController(text: 'Bamako');
  final _district = TextEditingController(text: 'Hamdallaye ACI 2000');
  final _phone = TextEditingController();
  PayMethod _method = PayMethod.orangeMoney;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _loadPhone();
  }

  Future<void> _loadPhone() async {
    try {
      final me = await ref.read(apiClientProvider).get('/users/me');
      if (me is Map && me['phone'] is String && mounted) {
        _phone.text = me['phone'] as String;
      }
    } catch (_) {/* champ saisi manuellement si indisponible */}
  }

  Future<void> _useMyLocation() async {
    final pos = await ref.read(locationServiceProvider).current();
    if (pos != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Position : ${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}')),
      );
    }
  }

  Future<void> _placeAndPay() async {
    final lines = ref.read(cartControllerProvider);
    if (lines.isEmpty) return;
    if (_method.isMobileMoney && _phone.text.trim().length < 8) {
      showError(context, 'Saisissez le numéro Mobile Money.');
      return;
    }
    setState(() => _busy = true);
    try {
      final repo = ref.read(ordersRepositoryProvider);
      final order = await repo.create(
        lines: lines,
        line1: _line1.text.trim(),
        city: _city.text.trim(),
        district: _district.text.trim(),
        paymentMethod: _method.api,
      );
      final orderId = order['id'] as String;

      if (_method.isCash) {
        // Paiement à la livraison : rien à régler maintenant, le livreur encaisse.
        final due = ref.read(cartTotalProvider);
        ref.read(cartControllerProvider.notifier).clear();
        if (mounted) {
          await _showInstruction(
              'Réglez ${formatMoney({'amount': due, 'currency': 'XOF'})} en espèces au livreur à la réception.');
        }
        if (mounted) context.go('/orders/$orderId');
      } else if (_method.isMobileMoney) {
        final res =
            await repo.payMobileMoney(orderId, _method.api, _phone.text.trim());
        ref.read(cartControllerProvider.notifier).clear();
        if (mounted) {
          await _showInstruction(res['instruction']?.toString() ?? 'Suivez les instructions de paiement.');
        }
        if (mounted) context.go('/orders/$orderId');
      } else {
        await repo.payWithWallet(orderId);
        ref.read(cartControllerProvider.notifier).clear();
        if (mounted) context.go('/orders/$orderId');
      }
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _showInstruction(String instruction) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Paiement en attente'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(instruction),
            const SizedBox(height: 12),
            const Text(
              'Votre commande sera confirmée dès validation du paiement par l\'opérateur.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('J\'ai compris'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final total = ref.watch(cartTotalProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Commander')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Adresse de livraison', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                TextField(controller: _line1, decoration: const InputDecoration(labelText: 'Adresse')),
                const SizedBox(height: 8),
                TextField(controller: _city, decoration: const InputDecoration(labelText: 'Ville')),
                const SizedBox(height: 8),
                TextField(controller: _district, decoration: const InputDecoration(labelText: 'Quartier')),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _useMyLocation,
                  icon: const Icon(Icons.my_location),
                  label: const Text('Utiliser ma position'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Mode de paiement', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                RadioGroup<PayMethod>(
                  groupValue: _method,
                  onChanged: (v) => setState(() => _method = v!),
                  child: Column(
                    children: PayMethod.values
                        .map((m) => RadioListTile<PayMethod>(
                              contentPadding: EdgeInsets.zero,
                              value: m,
                              title: Text(m.label),
                              secondary: Icon(m.icon),
                            ))
                        .toList(),
                  ),
                ),
                if (_method.isMobileMoney) ...[
                  const SizedBox(height: 4),
                  TextField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Numéro Mobile Money',
                      hintText: '+223XXXXXXXX',
                    ),
                  ),
                ],
                if (_method.isCash) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.info_outline, size: 16, color: Colors.grey),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Vous payez le livreur en espèces à la réception. Préparez l\'appoint.',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total', style: TextStyle(fontWeight: FontWeight.w600)),
                Text(formatMoney({'amount': total, 'currency': 'XOF'}),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _placeAndPay,
            child: Text(_busy
                ? '...'
                : switch (_method) {
                    PayMethod.cash => 'Commander · payer à la livraison',
                    PayMethod.wallet => 'Payer avec le wallet',
                    _ => 'Payer avec ${_method.label}',
                  }),
          ),
        ],
      ),
    );
  }
}
