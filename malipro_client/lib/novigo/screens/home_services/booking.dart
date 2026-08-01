import 'package:flutter/material.dart';

import '../../data/services_model.dart';
import '../../models.dart' show fcfa;
import '../../ui/ui.dart';
import '../../widgets.dart' show Stars;
import 'interventions.dart';
import 'widgets.dart';

/// Réservation d'un prestataire — **trois sections** : quoi, quand et où,
/// combien.
class HsBookingScreen extends StatefulWidget {
  final HsProvider provider;
  const HsBookingScreen({super.key, required this.provider});

  @override
  State<HsBookingScreen> createState() => _HsBookingScreenState();
}

class _HsBookingScreenState extends State<HsBookingScreen> {
  int _service = 0;
  int _date = 0;
  int _slot = 1;
  bool _sending = false;

  final _address = TextEditingController(text: 'Rue 250, Hamdallaye ACI');
  final _note = TextEditingController();

  static const _slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
  static const _fee = 1000; // déplacement

  /// Cinq jours à partir d'aujourd'hui, calculés depuis la date réelle.
  ///
  /// La liste était figée (« Auj., Demain, Ven., Sam., Dim. ») : un mardi, elle
  /// proposait donc un rendez-vous « vendredi » qui tombait en fait le jeudi.
  static const _weekdays = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

  List<String> get _days {
    final now = DateTime.now();
    return [
      for (var i = 0; i < 5; i++)
        if (i == 0)
          'Auj.'
        else if (i == 1)
          'Demain'
        else
          _weekdays[now.add(Duration(days: i)).weekday - 1],
    ];
  }

  @override
  void dispose() {
    _address.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    if (_sending) return;
    final p = widget.provider;
    final svc = p.services[_service];
    final days = _days;
    final total = svc.price + _fee;

    setState(() => _sending = true);
    // La demande part vraiment vers le backend pour un prestataire live ; l'appel
    // absorbe lui-même ses erreurs. On l'attend pour que le bouton ne puisse pas
    // être pressé deux fois.
    await hsServices.requestQuotation(
      artisanId: p.id,
      description: '${svc.name} · ${days[_date]} ${_slots[_slot]} · ${_address.text.trim()}'
          '${_note.text.trim().isNotEmpty ? ' — ${_note.text.trim()}' : ''}',
      budget: total,
    );
    if (!mounted) return;
    setState(() => _sending = false);
    Navigator.of(context).pushReplacement(MaterialPageRoute(
      builder: (_) => _BookingConfirmedScreen(
        provider: p,
        service: svc,
        day: days[_date],
        slot: _slots[_slot],
        total: total,
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final p = widget.provider;
    final svc = p.services[_service];
    final total = svc.price + _fee;
    final days = _days;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Réservation', style: T.title),
        leading: const BackButton(color: NC.ink),
      ),
      body: NovigoContentWidth(
        child: ListView(
          padding: EdgeInsets.fromLTRB(gutter, Sp.xs, gutter, Sp.xl),
          children: [
            // ───────── Section 1 · Quelle prestation ? ─────────
            NovigoCard(
              padding: const EdgeInsets.all(Sp.md + 2),
              child: Row(children: [
                HsAvatar(p.name, size: 48),
                const SizedBox(width: Sp.md),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(p.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(p.trade, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ]),
                ),
                const SizedBox(width: Sp.sm),
                Stars(p.rating),
              ]),
            ),
            const SizedBox(height: Sp.xl),
            const NovigoSectionHeader(overline: 'Étape 1', title: 'Quelle prestation ?'),
            const SizedBox(height: Sp.md),
            for (var i = 0; i < p.services.length; i++) ...[
              if (i > 0) const SizedBox(height: Sp.md - 2),
              _ServiceOption(
                service: p.services[i],
                selected: i == _service,
                onTap: () => setState(() => _service = i),
              ),
            ],

            // ───────── Section 2 · Quand et où ? ─────────
            const SizedBox(height: Sp.section),
            const NovigoSectionHeader(overline: 'Étape 2', title: 'Quand et où ?'),
            const SizedBox(height: Sp.md),
            const Text('JOUR', style: T.overline),
            const SizedBox(height: Sp.sm),
            NovigoChipRail(
              labels: days,
              selectedIndex: _date,
              onSelected: (i) => setState(() => _date = i),
              padding: EdgeInsets.zero,
            ),
            const SizedBox(height: Sp.md),
            const Text('HEURE', style: T.overline),
            const SizedBox(height: Sp.sm),
            NovigoChipRail(
              labels: _slots,
              selectedIndex: _slot,
              onSelected: (i) => setState(() => _slot = i),
              padding: EdgeInsets.zero,
            ),
            const SizedBox(height: Sp.lg),
            _Field(
              controller: _address,
              icon: Icons.place_outlined,
              hint: 'Votre adresse',
              label: 'Adresse d\'intervention',
            ),
            const SizedBox(height: Sp.md),
            _Field(
              controller: _note,
              icon: Icons.chat_bubble_outline_rounded,
              hint: 'Précisez votre besoin…',
              label: 'Note pour le prestataire (optionnel)',
              lines: 3,
            ),

            // ───────── Section 3 · Combien ? ─────────
            const SizedBox(height: Sp.section),
            const NovigoSectionHeader(overline: 'Étape 3', title: 'Récapitulatif'),
            const SizedBox(height: Sp.md),
            NovigoCard(
              child: Column(children: [
                _Recap(label: 'Prestation', value: fcfa(svc.price)),
                const SizedBox(height: Sp.sm),
                _Recap(label: 'Déplacement', value: fcfa(_fee)),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: Sp.md),
                  child: NovigoDivider(),
                ),
                _Recap(label: 'Total estimé', value: fcfa(total), strong: true),
              ]),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(gutter, 0, gutter, Sp.md),
          child: NovigoButton(
            label: 'Confirmer la réservation',
            trailingLabel: fcfa(total),
            loading: _sending,
            onPressed: _confirm,
          ),
        ),
      ),
    );
  }
}

/// Une prestation proposée, sélectionnable.
class _ServiceOption extends StatelessWidget {
  final HsService service;
  final bool selected;
  final VoidCallback onTap;

  const _ServiceOption({required this.service, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: '${service.name}, ${fcfa(service.price)}',
      child: NovigoCard(
        onTap: onTap,
        radius: 14,
        padding: const EdgeInsets.all(Sp.md + 2),
        border: Border.all(color: selected ? NC.brand : NC.hairline, width: selected ? 1.5 : 1),
        child: Row(children: [
          Icon(selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? NC.brand : NC.faint, size: 22),
          const SizedBox(width: Sp.md),
          Expanded(child: Text(service.name, style: T.body)),
          const SizedBox(width: Sp.sm),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerRight,
              child: Text(fcfa(service.price),
                  style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 14)),
            ),
          ),
        ]),
      ),
    );
  }
}

/// Champ de saisie avec son intitulé.
class _Field extends StatelessWidget {
  final TextEditingController controller;
  final IconData icon;
  final String hint;
  final String label;
  final int lines;

  const _Field({
    required this.controller,
    required this.icon,
    required this.hint,
    required this.label,
    this.lines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label.toUpperCase(), style: T.overline),
      const SizedBox(height: Sp.sm),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: Sp.md + 2, vertical: Sp.xs),
        decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(14)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.only(top: Sp.md + 2),
            child: Icon(icon, color: NC.faint, size: 20),
          ),
          const SizedBox(width: Sp.md - 2),
          Expanded(
            child: TextField(
              controller: controller,
              maxLines: lines,
              style: const TextStyle(color: NC.ink, fontSize: 14.5),
              cursorColor: NC.brand,
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: NC.faint, fontSize: 14),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: Sp.md + 2),
                isDense: true,
              ),
            ),
          ),
        ]),
      ),
    ]);
  }
}

class _Recap extends StatelessWidget {
  final String label;
  final String value;
  final bool strong;

  const _Recap({required this.label, required this.value, this.strong = false});

  @override
  Widget build(BuildContext context) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(label,
                style: TextStyle(
                    color: strong ? NC.ink : NC.muted,
                    fontWeight: strong ? FontWeight.w800 : FontWeight.w500,
                    fontSize: strong ? 16 : 14)),
          ),
          const SizedBox(width: Sp.md),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerRight,
              child: Text(value,
                  style: TextStyle(
                      color: strong ? NC.brand : NC.ink,
                      fontWeight: FontWeight.w800,
                      fontSize: strong ? 17 : 14)),
            ),
          ),
        ],
      );
}

/// Confirmation après réservation.
class _BookingConfirmedScreen extends StatelessWidget {
  final HsProvider provider;
  final HsService service;
  final String day, slot;
  final int total;

  const _BookingConfirmedScreen({
    required this.provider,
    required this.service,
    required this.day,
    required this.slot,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    return Scaffold(
      appBar: AppBar(leading: const CloseButton(color: NC.ink)),
      body: SafeArea(
        child: NovigoContentWidth(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: gutter + 4, vertical: Sp.lg),
            child: Column(children: [
              const SizedBox(height: Sp.xxl),
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(color: NC.successSoft, shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded, color: NC.success, size: 54),
              ),
              const SizedBox(height: Sp.xl),
              const Text('Réservation confirmée', style: T.h1, textAlign: TextAlign.center),
              const SizedBox(height: Sp.md - 2),
              Text(
                '${provider.name} interviendra $day à $slot pour « ${service.name} ».',
                style: const TextStyle(color: NC.muted, fontSize: 15, height: 1.4),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: Sp.lg),
              NovigoCard(
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Expanded(child: Text('Total estimé', style: T.body)),
                  const SizedBox(width: Sp.md),
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerRight,
                      child: Text(fcfa(total),
                          style: const TextStyle(
                              color: NC.brand, fontWeight: FontWeight.w800, fontSize: 18)),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: Sp.xxl),
              NovigoButton(
                label: 'Voir mes interventions',
                icon: Icons.event_note_rounded,
                onPressed: () => Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const HsInterventionsScreen())),
              ),
              const SizedBox(height: Sp.sm),
              TextButton(
                onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
                child: const Text('Retour à l\'accueil',
                    style: TextStyle(color: NC.muted, fontWeight: FontWeight.w600)),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
