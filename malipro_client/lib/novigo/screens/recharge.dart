import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../ui/ui.dart';

class _Operator {
  final String name;
  final Color color;
  const _Operator(this.name, this.color);
}

class _Plan {
  final String name, validity, price;
  const _Plan(this.name, this.validity, this.price);
}

const _operators = <_Operator>[
  _Operator('Orange', Color(0xFFFF7A00)),
  _Operator('Malitel', Color(0xFF2ECC71)),
  _Operator('Telecel', Color(0xFF7C4DFF)),
];

const _credits = ['500', '1 000', '2 000', '5 000'];

const _plans = <_Plan>[
  _Plan('Internet 1 Go', '24 heures', '500'),
  _Plan('Internet 5 Go', '7 jours', '2 000'),
  _Plan('Illimité Nuit', '00h – 06h · 30 j', '3 500'),
  _Plan('Pass Réseaux Sociaux', '30 jours', '1 500'),
];

/// Recharge & forfaits — **trois sections** : qui recharger, quoi, combien.
///
/// « Changer » de numéro ouvrait un message « bientôt disponible » : on peut
/// désormais saisir réellement le numéro à recharger. Le paiement, lui, n'est
/// pas branché, et l'écran le dit plutôt que de le laisser croire.
class RechargeScreen extends StatefulWidget {
  const RechargeScreen({super.key});

  @override
  State<RechargeScreen> createState() => _RechargeScreenState();
}

class _RechargeScreenState extends State<RechargeScreen> {
  int _operator = 0;
  int _tab = 0; // 0 = Crédit, 1 = Forfaits
  int _amount = 1;
  int _plan = 0;

  String _phone = '+223 76 44 21 08';

  Color get _accent => _operators[_operator].color;

  String get _selectedLabel =>
      _tab == 0 ? '${_credits[_amount]} FCFA' : '${_plans[_plan].price} FCFA';

  Future<void> _editPhone() async {
    final controller = TextEditingController(
        text: _phone.replaceAll(RegExp(r'[^0-9]'), '').replaceFirst(RegExp(r'^223'), ''));
    final result = await showNovigoSheet<String>(
      context,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(sheetContext).bottom),
        child: NovigoBottomSheet(
          title: 'Numéro à recharger',
          subtitle: 'Huit chiffres, sans l\'indicatif.',
          footer: NovigoButton(
            label: 'Valider',
            onPressed: () => Navigator.pop(sheetContext, controller.text),
          ),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: Sp.lg),
            decoration:
                BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(14)),
            child: Row(children: [
              const Text('+223',
                  style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(width: Sp.md),
              Expanded(
                child: TextField(
                  controller: controller,
                  autofocus: true,
                  keyboardType: TextInputType.phone,
                  cursorColor: NC.brand,
                  style: const TextStyle(
                      color: NC.ink, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 1.2),
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(8),
                  ],
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    isCollapsed: true,
                    hintText: '76 00 00 00',
                    hintStyle: TextStyle(color: NC.faint, fontSize: 16),
                    contentPadding: EdgeInsets.symmetric(vertical: 18),
                  ),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
    controller.dispose();
    if (result == null || !mounted) return;
    final digits = result.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length != 8) return;
    setState(() => _phone = '+223 ${digits.substring(0, 2)} ${digits.substring(2, 4)} '
        '${digits.substring(4, 6)} ${digits.substring(6)}');
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recharge & Forfaits', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: SafeArea(
        top: false,
        child: NovigoContentWidth(
          child: ListView(
            padding: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.xl),
            children: [
              // ───────── Section 1 · Qui recharger ─────────
              const NovigoSectionHeader(overline: 'Étape 1', title: 'Opérateur et numéro'),
              const SizedBox(height: Sp.md),
              Row(children: [
                for (var i = 0; i < _operators.length; i++) ...[
                  if (i > 0) const SizedBox(width: Sp.md - 2),
                  Expanded(
                    child: _OperatorTile(
                      operator: _operators[i],
                      selected: i == _operator,
                      onTap: () => setState(() => _operator = i),
                    ),
                  ),
                ],
              ]),
              const SizedBox(height: Sp.md),
              NovigoCard(
                radius: R.md,
                padding: const EdgeInsets.symmetric(horizontal: Sp.lg, vertical: Sp.md),
                child: Row(children: [
                  Icon(Icons.smartphone_rounded, color: _accent, size: 22),
                  const SizedBox(width: Sp.md),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Numéro à recharger', style: T.muted),
                      const SizedBox(height: 2),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(_phone,
                            style: const TextStyle(
                                color: NC.ink, fontWeight: FontWeight.w800, fontSize: 16)),
                      ),
                    ]),
                  ),
                  const SizedBox(width: Sp.sm),
                  NovigoButton.ghost(
                    label: 'Changer',
                    size: NovigoButtonSize.small,
                    onPressed: _editPhone,
                  ),
                ]),
              ),

              // ───────── Section 2 · Quoi ─────────
              const SizedBox(height: Sp.section),
              const NovigoSectionHeader(overline: 'Étape 2', title: 'Crédit ou forfait'),
              const SizedBox(height: Sp.md),
              Container(
                padding: const EdgeInsets.all(4),
                decoration:
                    BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(R.pill)),
                child: Row(children: [
                  _TabButton(
                      label: 'Crédit',
                      selected: _tab == 0,
                      onTap: () => setState(() => _tab = 0)),
                  _TabButton(
                      label: 'Forfaits',
                      selected: _tab == 1,
                      onTap: () => setState(() => _tab = 1)),
                ]),
              ),
              const SizedBox(height: Sp.lg),
              if (_tab == 0)
                GridView.count(
                  crossAxisCount: Rs.of(context).isTablet ? 4 : 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: Sp.md,
                  mainAxisSpacing: Sp.md,
                  childAspectRatio: 1.9,
                  children: [
                    for (var i = 0; i < _credits.length; i++)
                      _CreditTile(
                        amount: _credits[i],
                        selected: i == _amount,
                        accent: _accent,
                        onTap: () => setState(() => _amount = i),
                      ),
                  ],
                )
              else
                for (var i = 0; i < _plans.length; i++) ...[
                  if (i > 0) const SizedBox(height: Sp.md),
                  _PlanTile(
                    plan: _plans[i],
                    selected: i == _plan,
                    accent: _accent,
                    onTap: () => setState(() => _plan = i),
                  ),
                ],
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: EdgeInsets.fromLTRB(gutter, Sp.sm, gutter, Sp.lg),
        child: NovigoButton(
          label: _tab == 0 ? 'Recharger' : 'Souscrire',
          trailingLabel: _selectedLabel,
          onPressed: () {
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(SnackBar(
                content: Text(
                    '${_operators[_operator].name} · $_selectedLabel pour $_phone — le paiement ouvre bientôt.'),
                backgroundColor: NC.surfaceAlt,
                behavior: SnackBarBehavior.floating,
              ));
          },
        ),
      ),
    );
  }
}

class _OperatorTile extends StatelessWidget {
  final _Operator operator;
  final bool selected;
  final VoidCallback onTap;

  const _OperatorTile({required this.operator, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = operator.color;
    return Semantics(
      button: true,
      selected: selected,
      label: operator.name,
      child: PressableScale(
        onTap: onTap,
        child: AnimatedContainer(
          duration: M.fast,
          padding: const EdgeInsets.symmetric(vertical: Sp.lg, horizontal: Sp.xs),
          decoration: BoxDecoration(
            color: selected ? c.withValues(alpha: 0.16) : NC.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? c : NC.hairline, width: selected ? 1.6 : 1),
          ),
          child: Column(children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                  color: c.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.sim_card_rounded, color: c, size: 22),
            ),
            const SizedBox(height: Sp.sm),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(operator.name,
                  style: TextStyle(
                      color: selected ? NC.ink : NC.muted,
                      fontWeight: FontWeight.w800,
                      fontSize: 13)),
            ),
          ]),
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _TabButton({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        child: GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: M.fast,
            curve: M.ease,
            height: 42,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: selected ? NC.brand : Colors.transparent,
              borderRadius: BorderRadius.circular(R.pill),
            ),
            child: Text(label,
                style: TextStyle(
                    color: selected ? Colors.white : NC.muted,
                    fontWeight: FontWeight.w700,
                    fontSize: 14.5)),
          ),
        ),
      ),
    );
  }
}

class _CreditTile extends StatelessWidget {
  final String amount;
  final bool selected;
  final Color accent;
  final VoidCallback onTap;

  const _CreditTile({
    required this.amount,
    required this.selected,
    required this.accent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: '$amount francs CFA',
      child: PressableScale(
        onTap: onTap,
        child: AnimatedContainer(
          duration: M.fast,
          decoration: BoxDecoration(
            color: NC.surface,
            borderRadius: BorderRadius.circular(18),
            border:
                Border.all(color: selected ? accent : NC.hairline, width: selected ? 1.6 : 1),
          ),
          alignment: Alignment.center,
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(amount,
                  style:
                      const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 22)),
            ),
            const SizedBox(height: 2),
            const Text('FCFA', style: TextStyle(color: NC.faint, fontSize: 11.5)),
          ]),
        ),
      ),
    );
  }
}

class _PlanTile extends StatelessWidget {
  final _Plan plan;
  final bool selected;
  final Color accent;
  final VoidCallback onTap;

  const _PlanTile({
    required this.plan,
    required this.selected,
    required this.accent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: '${plan.name}, ${plan.validity}, ${plan.price} francs CFA',
      child: NovigoCard(
        onTap: onTap,
        radius: 18,
        border: Border.all(color: selected ? accent : NC.hairline, width: selected ? 1.6 : 1),
        child: Row(children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
            child: Icon(Icons.wifi_rounded, color: accent, size: 22),
          ),
          const SizedBox(width: Sp.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(plan.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 3),
              Row(children: [
                const Icon(Icons.schedule_rounded, size: 13.5, color: NC.faint),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(plan.validity,
                      style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ]),
            ]),
          ),
          const SizedBox(width: Sp.sm),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerRight,
              child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(plan.price,
                    style:
                        const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 16)),
                const Text('FCFA', style: TextStyle(color: NC.faint, fontSize: 11)),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}
