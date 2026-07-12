import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/money.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../../shop/application/shop_providers.dart';

/// Wallet commerçant : solde à verser, ventes Mobile Money vs Espèces,
/// versement Mobile Money, et ledger (ventes + versements).
class MerchantWalletScreen extends ConsumerWidget {
  const MerchantWalletScreen({super.key});

  int _amt(Map<String, dynamic>? m) => (m?['amount'] as num?)?.toInt() ?? 0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(merchantWalletProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Portefeuille')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (w) {
          final balance = _amt(w['balance'] as Map<String, dynamic>?);
          final ledger = (w['ledger'] as List?)?.cast<Map<String, dynamic>>() ?? [];
          return RefreshIndicator(
            onRefresh: () async => bumpRefresh(ref),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Solde à verser
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppColors.brandDark, AppColors.brand]),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Row(children: [
                      Icon(Icons.account_balance_wallet, color: Colors.white70, size: 18),
                      SizedBox(width: 6),
                      Text('Solde à verser', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    ]),
                    const SizedBox(height: 6),
                    Text(formatMoney(w['balance'] as Map<String, dynamic>?),
                        style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: balance > 0 ? () => _openPayout(context, ref, balance) : null,
                        icon: const Icon(Icons.arrow_downward, size: 18),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.gold, foregroundColor: AppColors.brandDark,
                          disabledBackgroundColor: Colors.white24, disabledForegroundColor: Colors.white54,
                          padding: const EdgeInsets.symmetric(vertical: 13),
                        ),
                        label: const Text('Verser', style: TextStyle(fontWeight: FontWeight.w800)),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 12),
                // Split MoMo / Espèces
                Row(children: [
                  Expanded(child: _SplitCard(
                    icon: Icons.smartphone, label: 'Ventes Mobile Money',
                    amount: formatMoney(w['digital'] as Map<String, dynamic>?), color: AppColors.brand)),
                  const SizedBox(width: 10),
                  Expanded(child: _SplitCard(
                    icon: Icons.payments, label: 'Ventes espèces',
                    amount: formatMoney(w['cash'] as Map<String, dynamic>?), color: AppColors.gold)),
                ]),
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text('${w['salesCount'] ?? 0} vente(s) · encaissé total ${formatMoney(w['totalEarned'] as Map<String, dynamic>?)}',
                      style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                ),
                const SizedBox(height: 16),
                const Text('Mouvements', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (ledger.isEmpty)
                  const Padding(padding: EdgeInsets.all(16),
                      child: Text('Aucun mouvement', style: TextStyle(color: AppColors.muted)))
                else
                  ...ledger.map(_LedgerTile.new),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  void _openPayout(BuildContext context, WidgetRef ref, int balance) {
    showModalBottomSheet<void>(
      context: context, isScrollControlled: true, showDragHandle: true,
      builder: (_) => _PayoutSheet(balance: balance),
    );
  }
}

class _SplitCard extends StatelessWidget {
  const _SplitCard({required this.icon, required this.label, required this.amount, required this.color});
  final IconData icon;
  final String label;
  final String amount;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.35)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
          const SizedBox(height: 2),
          Text(amount, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
        ]),
      );
}

class _LedgerTile extends StatelessWidget {
  const _LedgerTile(this.tx);
  final Map<String, dynamic> tx;
  @override
  Widget build(BuildContext context) {
    final kind = (tx['kind'] ?? '').toString();
    final isPayout = kind == 'payout';
    final isCash = kind == 'saleCash';
    final (icon, color) = isPayout
        ? (Icons.arrow_downward, AppColors.error)
        : isCash
            ? (Icons.payments, AppColors.gold)
            : (Icons.point_of_sale, AppColors.brand);
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppColors.line)),
      child: ListTile(
        leading: CircleAvatar(backgroundColor: color.withValues(alpha: 0.14), child: Icon(icon, color: color, size: 20)),
        title: Text(tx['label']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text([
          if (tx['subtitle'] != null) tx['subtitle'].toString(),
          if (!isPayout) (isCash ? 'Espèces' : 'Mobile Money'),
        ].join(' · '), style: const TextStyle(fontSize: 12)),
        trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${isPayout ? "-" : "+"}${formatMoney(tx['amount'] as Map<String, dynamic>?)}',
              style: TextStyle(fontWeight: FontWeight.w800,
                  color: isPayout ? AppColors.ink : AppColors.brand)),
          if (isCash) const Text('espèces', style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.w700)),
        ]),
      ),
    );
  }
}

class _PayoutSheet extends ConsumerStatefulWidget {
  const _PayoutSheet({required this.balance});
  final int balance;
  @override
  ConsumerState<_PayoutSheet> createState() => _PayoutSheetState();
}

class _PayoutSheetState extends ConsumerState<_PayoutSheet> {
  static const _methods = ['ORANGE_MONEY', 'WAVE', 'BANK'];
  static const _labels = {'ORANGE_MONEY': 'Orange Money', 'WAVE': 'Wave', 'BANK': 'Virement bancaire'};
  final _ctrl = TextEditingController();
  String _method = 'ORANGE_MONEY';
  bool _busy = false;

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final amount = int.tryParse(_ctrl.text.trim()) ?? 0;
    final valid = amount > 0 && amount <= widget.balance;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Verser le solde', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text('Solde à verser : ${formatMoney({'amount': widget.balance, 'currency': 'XOF'})}',
            style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
        const SizedBox(height: 14),
        Wrap(spacing: 8, children: _methods.map((m) => ChoiceChip(
              label: Text(_labels[m]!), selected: _method == m,
              onSelected: (_) => setState(() => _method = m))).toList()),
        const SizedBox(height: 12),
        TextField(
          controller: _ctrl, keyboardType: TextInputType.number, onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(labelText: 'Montant', suffixText: 'F', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 8),
        Wrap(spacing: 8, children: [
          for (final q in [25000, 50000, 100000])
            if (q <= widget.balance)
              ActionChip(label: Text(formatMoney({'amount': q, 'currency': 'XOF'})),
                  onPressed: () => setState(() => _ctrl.text = q.toString())),
          ActionChip(label: const Text('Tout'), onPressed: () => setState(() => _ctrl.text = widget.balance.toString())),
        ]),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: (!valid || _busy) ? null : () async {
              setState(() => _busy = true);
              final nav = Navigator.of(context);
              final messenger = ScaffoldMessenger.of(context);
              try {
                await ref.read(merchantRepositoryProvider).payout(amount, _method);
                bumpRefresh(ref);
                nav.pop();
                messenger.showSnackBar(SnackBar(
                  content: Text('Versement de ${formatMoney({'amount': amount, 'currency': 'XOF'})} envoyé'),
                  backgroundColor: AppColors.brand));
              } on ApiException catch (e) {
                setState(() => _busy = false);
                messenger.showSnackBar(SnackBar(content: Text(e.message), backgroundColor: AppColors.error));
              }
            },
            child: Text(_busy ? '...' : 'Confirmer le versement', style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ),
      ]),
    );
  }
}
