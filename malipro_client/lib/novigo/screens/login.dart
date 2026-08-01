import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../data/env.dart';
import '../data/session.dart';
import '../shell.dart';
import '../ui/ui.dart';

/// Entrée dans l'application — **deux zones** : qui vous accueille, et comment
/// vous entrez.
///
/// Le bouton n'est plus actif tant que le numéro n'est pas complet : la version
/// précédente laissait « Recevoir le code » toujours cliquable et remplaçait en
/// douce un champ vide par le numéro de démonstration, ce qui donnait à
/// l'utilisateur l'impression d'avoir demandé un code pour un numéro qui n'était
/// pas le sien.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController();
  final _focus = FocusNode();

  /// Un numéro malien national compte huit chiffres (hors indicatif +223).
  static const _digits = 8;

  @override
  void initState() {
    super.initState();
    _phone.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _phone.dispose();
    _focus.dispose();
    super.dispose();
  }

  String get _typed => _phone.text.replaceAll(RegExp(r'[^0-9]'), '');
  bool get _complete => _typed.length == _digits;

  void _sendCode() {
    if (!_complete) return;
    FocusScope.of(context).unfocus();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OtpScreen(phone: '+223$_typed')),
    );
  }

  /// Renseigne le numéro du compte de démonstration — visible et explicite,
  /// plutôt qu'un remplacement silencieux au moment de l'envoi.
  void _useDemoNumber() {
    var digits = NovigoEnv.demoPhone.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.startsWith('223')) digits = digits.substring(3);
    _phone.text = digits;
    _phone.selection = TextSelection.collapsed(offset: digits.length);
  }

  void _soon(String label) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('$label — bientôt disponible'),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  void _guest() => Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const Shell()),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: NC.premiumGradient),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(Sp.gutter + 2, Sp.xl, Sp.gutter + 2, Sp.xl),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ───────── Zone 1 · L'accueil ─────────
                    const _Logo(),
                    const SizedBox(height: Sp.xl - 2),
                    const Text('Bienvenue sur NOVIGO', style: T.h1, textAlign: TextAlign.center),
                    const SizedBox(height: Sp.sm),
                    const Text('La super-app du Mali', style: T.muted, textAlign: TextAlign.center),

                    // ───────── Zone 2 · L'entrée ─────────
                    const SizedBox(height: Sp.xxl),
                    _PhoneField(
                      controller: _phone,
                      focusNode: _focus,
                      maxDigits: _digits,
                      onSubmitted: _sendCode,
                    ),
                    const SizedBox(height: Sp.sm + 2),
                    // `Wrap` plutôt que `Row` : avec la police système agrandie,
                    // l'aide et le raccourci de démonstration ne tiennent plus
                    // sur une seule ligne — ils passent alors l'un sous l'autre
                    // au lieu de déborder.
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: Sp.sm,
                      children: [
                        Text(
                          _complete
                              ? 'Un code à 6 chiffres vous sera envoyé.'
                              : 'Entrez vos $_digits chiffres, sans l\'indicatif.',
                          style: const TextStyle(
                              color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w500),
                        ),
                        if (!_complete)
                          NovigoButton.ghost(
                            label: 'Numéro de démo',
                            size: NovigoButtonSize.small,
                            onPressed: _useDemoNumber,
                          ),
                      ],
                    ),
                    const SizedBox(height: Sp.md),
                    NovigoButton(
                      label: 'Recevoir le code',
                      icon: Icons.sms_outlined,
                      onPressed: _complete ? _sendCode : null,
                    ),
                    const SizedBox(height: Sp.xl - 2),
                    const _OrDivider(),
                    const SizedBox(height: Sp.xl - 2),
                    Row(children: [
                      Expanded(
                        child: _SocialButton(
                          icon: Icons.g_mobiledata_rounded,
                          label: 'Google',
                          onTap: () => _soon('Google'),
                        ),
                      ),
                      const SizedBox(width: Sp.md),
                      Expanded(
                        child: _SocialButton(
                          icon: Icons.apple_rounded,
                          label: 'Apple',
                          onTap: () => _soon('Apple'),
                        ),
                      ),
                    ]),
                    const SizedBox(height: Sp.lg),
                    TextButton(
                      onPressed: _guest,
                      child: const Text('Continuer en invité',
                          style: TextStyle(color: NC.ink, fontSize: 14.5, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(height: Sp.sm),
                    const Text(
                      'En continuant, vous acceptez les Conditions générales\net la Politique de confidentialité de NOVIGO.',
                      style: TextStyle(
                          color: NC.faint, fontSize: 11.5, height: 1.4, fontWeight: FontWeight.w500),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Logo extends StatelessWidget {
  const _Logo();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 76,
        height: 76,
        decoration: BoxDecoration(
          gradient: NC.brandGradient,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
                color: NC.brand.withValues(alpha: 0.45), blurRadius: 28, offset: const Offset(0, 12)),
          ],
        ),
        alignment: Alignment.center,
        child: const Text('N',
            style: TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w900, height: 1)),
      ),
    );
  }
}

/// Champ téléphone : indicatif fixe à gauche, saisie à droite.
///
/// Le liseré s'allume à la prise de focus — d'où l'état local : sans écoute du
/// `FocusNode`, la bordure ne changeait qu'à la première frappe.
class _PhoneField extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final int maxDigits;
  final VoidCallback onSubmitted;

  const _PhoneField({
    required this.controller,
    required this.focusNode,
    required this.maxDigits,
    required this.onSubmitted,
  });

  @override
  State<_PhoneField> createState() => _PhoneFieldState();
}

class _PhoneFieldState extends State<_PhoneField> {
  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_onFocus);
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_onFocus);
    super.dispose();
  }

  void _onFocus() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      textField: true,
      label: 'Numéro de téléphone, indicatif +223',
      child: Container(
        decoration: cardDeco(
          color: NC.surfaceAlt,
          radius: R.md,
          border: Border.all(color: widget.focusNode.hasFocus ? NC.brand : NC.line, width: 1),
        ),
        padding: const EdgeInsets.symmetric(horizontal: Sp.lg),
        child: Row(children: [
          const Text('+223',
              style: TextStyle(color: NC.ink, fontSize: 16, fontWeight: FontWeight.w800)),
          Container(
            width: 1,
            height: 26,
            color: NC.line,
            margin: const EdgeInsets.symmetric(horizontal: Sp.md + 2),
          ),
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: widget.focusNode,
              keyboardType: TextInputType.phone,
              autofillHints: const [AutofillHints.telephoneNumberNational],
              textInputAction: TextInputAction.done,
              style: const TextStyle(
                  color: NC.ink, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 1.2),
              cursorColor: NC.brand,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(widget.maxDigits),
              ],
              decoration: const InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                hintText: '70 00 00 00',
                hintStyle: TextStyle(
                    color: NC.faint, fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: 1.2),
                contentPadding: EdgeInsets.symmetric(vertical: 18),
              ),
              onSubmitted: (_) => widget.onSubmitted(),
            ),
          ),
        ]),
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) => const Row(children: [
        Expanded(child: NovigoDivider()),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: Sp.md + 2),
          child: Text('ou',
              style: TextStyle(color: NC.faint, fontSize: 13, fontWeight: FontWeight.w600)),
        ),
        Expanded(child: NovigoDivider()),
      ]);
}

/// Bouton de connexion tierce (pas encore ouverte).
class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SocialButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Continuer avec $label',
      child: PressableScale(
        onTap: onTap,
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            color: NC.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: NC.line, width: 1),
          ),
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: Sp.sm),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, color: NC.ink, size: 24),
            const SizedBox(width: Sp.sm),
            Flexible(
              child: Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: NC.ink, fontSize: 14.5, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
      ),
    );
  }
}

/// Saisie du code à 6 chiffres, puis entrée dans l'application.
class OtpScreen extends StatefulWidget {
  final String phone;
  const OtpScreen({super.key, required this.phone});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  static const _len = 6;
  static const _resendDelay = 30;

  final List<TextEditingController> _cells = List.generate(_len, (_) => TextEditingController());
  final List<FocusNode> _nodes = List.generate(_len, (_) => FocusNode());

  bool _busy = false;

  /// Renseigné lorsque le serveur n'a pas validé la session : on le dit, au lieu
  /// d'entrer dans l'application en laissant croire que l'on est connecté.
  String? _notice;

  Timer? _timer;
  int _remaining = _resendDelay;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _cells) {
      c.dispose();
    }
    for (final n in _nodes) {
      n.dispose();
    }
    super.dispose();
  }

  /// Décompte réel avant de pouvoir redemander un code — l'écran affichait
  /// jusqu'ici « Renvoyer dans 0:30 » en texte fixe, qui ne bougeait jamais.
  void _startCountdown() {
    _timer?.cancel();
    setState(() => _remaining = _resendDelay);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _remaining--);
      if (_remaining <= 0) t.cancel();
    });
  }

  String get _code => _cells.map((c) => c.text).join();
  bool get _complete => _code.length == _len && !_code.contains(RegExp(r'[^0-9]'));

  void _onChanged(int i, String v) {
    if (v.length > 1) {
      // Collage : répartir les chiffres sur les cases.
      final digits = v.replaceAll(RegExp(r'[^0-9]'), '');
      for (var k = 0; k < _len; k++) {
        _cells[k].text = k < digits.length ? digits[k] : '';
      }
      final last = digits.length >= _len ? _len - 1 : digits.length;
      FocusScope.of(context).requestFocus(_nodes[last.clamp(0, _len - 1)]);
      setState(() {});
      return;
    }
    if (v.isNotEmpty && i < _len - 1) {
      FocusScope.of(context).requestFocus(_nodes[i + 1]);
    } else if (v.isEmpty && i > 0) {
      FocusScope.of(context).requestFocus(_nodes[i - 1]);
    }
    setState(() {});
  }

  Future<void> _verify() async {
    if (!_complete || _busy) return;
    setState(() {
      _busy = true;
      _notice = null;
    });
    FocusScope.of(context).unfocus();

    // Mode live : tentative best-effort pour obtenir un vrai token.
    if (NovigoEnv.live) {
      try {
        await session.login(widget.phone, NovigoEnv.demoPassword);
      } catch (_) {
        if (!mounted) return;
        setState(() => _notice =
            'Le serveur n\'a pas répondu : vous entrez en mode démonstration, les données ne seront pas les vôtres.');
      }
    }

    // Numéro validé : la session survit au redémarrage de l'app.
    await session.remember(widget.phone);

    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const Shell()),
      (route) => false,
    );
  }

  void _resend() {
    if (_remaining > 0) return;
    _startCountdown();
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(const SnackBar(
        content: Text('Code renvoyé'),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).maybePop(),
          tooltip: 'Changer de numéro',
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(Sp.gutter + 2, Sp.sm, Sp.gutter + 2, Sp.xl),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const SizedBox(height: Sp.xs + 2),
              const Text('Vérification', style: T.h1),
              const SizedBox(height: Sp.md - 2),
              Text.rich(
                TextSpan(style: T.muted, children: [
                  const TextSpan(text: 'Entrez le code envoyé au '),
                  TextSpan(
                    text: widget.phone,
                    style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800),
                  ),
                ]),
              ),
              const SizedBox(height: Sp.xxl - 2),
              _OtpRow(cells: _cells, nodes: _nodes, onChanged: _onChanged, onRefresh: () => setState(() {})),
              if (_notice != null) ...[
                const SizedBox(height: Sp.lg),
                _Notice(message: _notice!),
              ],
              const SizedBox(height: Sp.xl + 2),
              NovigoButton(
                label: 'Vérifier',
                loading: _busy,
                onPressed: _complete ? _verify : null,
              ),
              const SizedBox(height: Sp.lg),
              Center(
                child: _remaining > 0
                    ? Text(
                        'Renvoyer le code dans 0:${_remaining.toString().padLeft(2, '0')}',
                        style: const TextStyle(
                            color: NC.faint, fontSize: 13.5, fontWeight: FontWeight.w600),
                      )
                    : TextButton(
                        onPressed: _resend,
                        child: const Text('Renvoyer le code',
                            style: TextStyle(
                                color: NC.brand, fontSize: 13.5, fontWeight: FontWeight.w700)),
                      ),
              ),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  child: const Text('Changer de numéro',
                      style: TextStyle(color: NC.muted, fontSize: 13.5, fontWeight: FontWeight.w600)),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Six cases dont la largeur s'adapte : à 48 px fixes, la rangée débordait sur
/// un écran de 320 px.
class _OtpRow extends StatelessWidget {
  final List<TextEditingController> cells;
  final List<FocusNode> nodes;
  final void Function(int, String) onChanged;
  final VoidCallback onRefresh;

  const _OtpRow({
    required this.cells,
    required this.nodes,
    required this.onChanged,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    const gap = Sp.sm;
    return LayoutBuilder(builder: (context, c) {
      final width = ((c.maxWidth - gap * (cells.length - 1)) / cells.length).clamp(38.0, 56.0);
      return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        for (var i = 0; i < cells.length; i++) ...[
          if (i > 0) const SizedBox(width: gap),
          _OtpCell(
            width: width,
            controller: cells[i],
            focusNode: nodes[i],
            index: i,
            total: cells.length,
            onChanged: (v) => onChanged(i, v),
            onTap: onRefresh,
          ),
        ],
      ]);
    });
  }
}

class _OtpCell extends StatelessWidget {
  final double width;
  final TextEditingController controller;
  final FocusNode focusNode;
  final int index;
  final int total;
  final ValueChanged<String> onChanged;
  final VoidCallback onTap;

  const _OtpCell({
    required this.width,
    required this.controller,
    required this.focusNode,
    required this.index,
    required this.total,
    required this.onChanged,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final focused = focusNode.hasFocus;
    return Semantics(
      label: 'Chiffre ${index + 1} sur $total',
      child: SizedBox(
        width: width,
        height: 58,
        child: AnimatedContainer(
          duration: M.fast,
          decoration: BoxDecoration(
            color: NC.surfaceAlt,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: focused ? NC.brand : NC.line, width: focused ? 2 : 1),
          ),
          child: Center(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 1,
              cursorColor: NC.brand,
              style: const TextStyle(color: NC.ink, fontSize: 22, fontWeight: FontWeight.w800),
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(
                counterText: '',
                border: InputBorder.none,
                isCollapsed: true,
                contentPadding: EdgeInsets.zero,
              ),
              onChanged: onChanged,
              onTap: onTap,
            ),
          ),
        ),
      ),
    );
  }
}

/// Message d'information honnête (repli démonstration).
class _Notice extends StatelessWidget {
  final String message;
  const _Notice({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Sp.md),
      decoration: BoxDecoration(
        color: NC.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(R.sm),
        border: Border.all(color: NC.warning.withValues(alpha: 0.25)),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(Icons.info_outline_rounded, size: 17, color: NC.warning),
        const SizedBox(width: Sp.sm),
        Expanded(
          child: Text(message,
              style: const TextStyle(color: NC.warning, fontSize: 12.5, fontWeight: FontWeight.w600, height: 1.35)),
        ),
      ]),
    );
  }
}
