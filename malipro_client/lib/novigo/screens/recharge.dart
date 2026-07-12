import 'package:flutter/material.dart';
import '../theme.dart';

/// Recharge crédit & forfaits télécom — Orange, Malitel, Telecel.
class RechargeScreen extends StatefulWidget {
  const RechargeScreen({super.key});
  @override
  State<RechargeScreen> createState() => _RechargeScreenState();
}

class _RechargeScreenState extends State<RechargeScreen> {
  int _operator = 0;
  int _tab = 0; // 0 = Crédit, 1 = Forfaits
  int _amount = 1; // index dans _credits
  int _plan = 0; // index dans _plans

  final _operators = const [
    _Operator('Orange', Color(0xFFFF7A00)),
    _Operator('Malitel', Color(0xFF2ECC71)),
    _Operator('Telecel', Color(0xFF7C4DFF)),
  ];

  final _credits = const ['500', '1 000', '2 000', '5 000'];

  final _plans = const [
    _Plan('Internet 1 Go', '24 heures', '500'),
    _Plan('Internet 5 Go', '7 jours', '2 000'),
    _Plan('Illimité Nuit', '00h – 06h · 30 j', '3 500'),
    _Plan('Pass Réseaux Sociaux', '30 jours', '1 500'),
  ];

  Color get _accent => _operators[_operator].color;

  String get _selectedLabel => _tab == 0
      ? 'Recharger ${_credits[_amount]} FCFA'
      : 'Souscrire — ${_plans[_plan].price} FCFA';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recharge & Forfaits', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 24), children: [
        // Sélecteur d'opérateur
        const Text('Opérateur', style: T.h2),
        const SizedBox(height: 12),
        Row(children: [
          for (var i = 0; i < _operators.length; i++) ...[
            if (i > 0) const SizedBox(width: 10),
            Expanded(child: _operatorTile(i)),
          ],
        ]),
        const SizedBox(height: 20),

        // Numéro préempli
        Container(
          decoration: cardDeco(radius: 16),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(children: [
            Icon(Icons.smartphone_rounded, color: _accent, size: 22),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
              Text('Numéro à recharger', style: T.muted),
              SizedBox(height: 2),
              Text('+223 76 44 21 08',
                  style: TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 16)),
            ])),
            TextButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Changer de numéro — bientôt disponible'), duration: Duration(seconds: 1)),
              ),
              child: Text('Changer', style: TextStyle(color: _accent, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
        const SizedBox(height: 20),

        // Onglets Crédit / Forfaits
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(999)),
          child: Row(children: [
            _tabBtn('Crédit', 0),
            _tabBtn('Forfaits', 1),
          ]),
        ),
        const SizedBox(height: 18),

        if (_tab == 0) _creditGrid() else _plansList(),
      ]),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: GestureDetector(
          onTap: () => ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${_operators[_operator].name} · $_selectedLabel — bientôt disponible'),
              duration: const Duration(seconds: 1),
            ),
          ),
          child: Container(
            height: 56,
            decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
            alignment: Alignment.center,
            child: Text(_tab == 0 ? 'Recharger' : 'Souscrire',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
          ),
        ),
      ),
    );
  }

  Widget _operatorTile(int i) {
    final on = i == _operator;
    final c = _operators[i].color;
    return GestureDetector(
      onTap: () => setState(() => _operator = i),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: on ? c.withValues(alpha: 0.16) : NC.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: on ? c : NC.line, width: on ? 1.6 : 1),
        ),
        child: Column(children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: c.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(12)),
            child: Icon(Icons.sim_card_rounded, color: c, size: 22),
          ),
          const SizedBox(height: 8),
          Text(_operators[i].name,
              style: TextStyle(color: on ? NC.ink : NC.muted, fontWeight: FontWeight.w800, fontSize: 13)),
        ]),
      ),
    );
  }

  Widget _tabBtn(String label, int i) {
    final on = i == _tab;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _tab = i),
        child: Container(
          height: 42,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: on ? NC.brand : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(label,
              style: TextStyle(color: on ? Colors.white : NC.muted, fontWeight: FontWeight.w700, fontSize: 14.5)),
        ),
      ),
    );
  }

  Widget _creditGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.9,
      children: [
        for (var i = 0; i < _credits.length; i++)
          GestureDetector(
            onTap: () => setState(() => _amount = i),
            child: Container(
              decoration: BoxDecoration(
                color: NC.surface,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: i == _amount ? _accent : NC.line, width: i == _amount ? 1.6 : 1),
              ),
              alignment: Alignment.center,
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(_credits[i],
                    style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 22)),
                const SizedBox(height: 2),
                const Text('FCFA', style: TextStyle(color: NC.faint, fontSize: 11.5)),
              ]),
            ),
          ),
      ],
    );
  }

  Widget _plansList() {
    return Column(children: [
      for (var i = 0; i < _plans.length; i++) ...[
        if (i > 0) const SizedBox(height: 12),
        GestureDetector(
          onTap: () => setState(() => _plan = i),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: NC.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: i == _plan ? _accent : NC.line, width: i == _plan ? 1.6 : 1),
            ),
            child: Row(children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: _accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
                child: Icon(Icons.wifi_rounded, color: _accent, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_plans[i].name, style: T.title),
                const SizedBox(height: 3),
                Row(children: [
                  const Icon(Icons.schedule_rounded, size: 13.5, color: NC.faint),
                  const SizedBox(width: 4),
                  Text(_plans[i].validity, style: T.muted),
                ]),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(_plans[i].price,
                    style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w900, fontSize: 16)),
                const Text('FCFA', style: TextStyle(color: NC.faint, fontSize: 11)),
              ]),
            ]),
          ),
        ),
      ],
    ]);
  }
}

class _Operator {
  final String name;
  final Color color;
  const _Operator(this.name, this.color);
}

class _Plan {
  final String name, validity, price;
  const _Plan(this.name, this.validity, this.price);
}
