import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../shell.dart';
import '../data/session.dart';
import '../data/env.dart';

/// Écran d'accueil de connexion premium NOVIGO (OTP simulé côté démo).
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController();
  final _focus = FocusNode();

  @override
  void dispose() {
    _phone.dispose();
    _focus.dispose();
    super.dispose();
  }

  String _fullPhone() {
    var digits = _phone.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) {
      // Préremplir avec le numéro démo (sans son préfixe +223).
      digits = NovigoEnv.demoPhone.replaceAll(RegExp(r'[^0-9]'), '');
      if (digits.startsWith('223')) digits = digits.substring(3);
    }
    return '+223$digits';
  }

  void _sendCode() {
    FocusScope.of(context).unfocus();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OtpScreen(phone: _fullPhone())),
    );
  }

  void _soon(String label) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('$label — Bientôt disponible'),
        backgroundColor: NC.surfaceAlt,
        behavior: SnackBarBehavior.floating,
      ));
  }

  void _guest() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const Shell()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: NC.premiumGradient),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(22, 28, 22, 24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 12),
                    _logo(),
                    const SizedBox(height: 22),
                    const Text('Bienvenue sur NOVIGO', style: T.h1, textAlign: TextAlign.center),
                    const SizedBox(height: 8),
                    const Text('La super-app du Mali', style: T.muted, textAlign: TextAlign.center),
                    const SizedBox(height: 32),
                    _phoneField(),
                    const SizedBox(height: 16),
                    _GradientButton(label: 'Recevoir le code', onTap: _sendCode),
                    const SizedBox(height: 22),
                    _divider(),
                    const SizedBox(height: 22),
                    Row(children: [
                      Expanded(child: _SocialButton(icon: Icons.g_mobiledata_rounded, label: 'Google', onTap: () => _soon('Google'))),
                      const SizedBox(width: 12),
                      Expanded(child: _SocialButton(icon: Icons.apple_rounded, label: 'Apple', onTap: () => _soon('Apple'))),
                    ]),
                    const SizedBox(height: 26),
                    TextButton(
                      onPressed: _guest,
                      child: const Text('Continuer en invité',
                          style: TextStyle(color: NC.ink, fontSize: 14.5, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'En continuant, vous acceptez les Conditions générales\net la Politique de confidentialité de NOVIGO.',
                      style: TextStyle(color: NC.faint, fontSize: 11.5, height: 1.4, fontWeight: FontWeight.w500),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _logo() {
    return Column(children: [
      Container(
        width: 76,
        height: 76,
        decoration: BoxDecoration(
          gradient: NC.brandGradient,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: NC.brand.withValues(alpha: 0.45), blurRadius: 28, offset: const Offset(0, 12)),
          ],
        ),
        alignment: Alignment.center,
        child: const Text('N',
            style: TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w900, height: 1)),
      ),
    ]);
  }

  Widget _phoneField() {
    return Container(
      decoration: cardDeco(
        color: NC.surfaceAlt,
        radius: 16,
        border: Border.all(color: NC.line, width: 1),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(children: [
        const Text('+223', style: TextStyle(color: NC.ink, fontSize: 16, fontWeight: FontWeight.w800)),
        Container(width: 1, height: 26, color: NC.line, margin: const EdgeInsets.symmetric(horizontal: 14)),
        Expanded(
          child: TextField(
            controller: _phone,
            focusNode: _focus,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: NC.ink, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 1.2),
            cursorColor: NC.brand,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(12),
            ],
            decoration: const InputDecoration(
              isCollapsed: true,
              border: InputBorder.none,
              hintText: '70 00 00 00',
              hintStyle: TextStyle(color: NC.faint, fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: 1.2),
              contentPadding: EdgeInsets.symmetric(vertical: 18),
            ),
            onSubmitted: (_) => _sendCode(),
          ),
        ),
      ]),
    );
  }

  Widget _divider() {
    return Row(children: const [
      Expanded(child: Divider(color: NC.line, thickness: 1)),
      Padding(
        padding: EdgeInsets.symmetric(horizontal: 14),
        child: Text('ou', style: TextStyle(color: NC.faint, fontSize: 13, fontWeight: FontWeight.w600)),
      ),
      Expanded(child: Divider(color: NC.line, thickness: 1)),
    ]);
  }
}

/// Saisie du code OTP à 6 cases, puis entrée dans l'app.
class OtpScreen extends StatefulWidget {
  final String phone;
  const OtpScreen({super.key, required this.phone});
  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  static const _len = 6;
  final List<TextEditingController> _cells =
      List.generate(_len, (_) => TextEditingController());
  final List<FocusNode> _nodes = List.generate(_len, (_) => FocusNode());
  bool _busy = false;

  @override
  void dispose() {
    for (final c in _cells) {
      c.dispose();
    }
    for (final n in _nodes) {
      n.dispose();
    }
    super.dispose();
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
    setState(() => _busy = true);
    FocusScope.of(context).unfocus();

    // Mode live : tentative best-effort pour obtenir un vrai token.
    if (NovigoEnv.live) {
      try {
        await session.login(widget.phone, NovigoEnv.demoPassword);
      } catch (_) {
        // Échec toléré : on continue en démo.
      }
    }

    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const Shell()),
      (route) => false,
    );
  }

  void _resend() {
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
          padding: const EdgeInsets.fromLTRB(22, 8, 22, 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 6),
                const Text('Vérification', style: T.h1),
                const SizedBox(height: 10),
                Text.rich(
                  TextSpan(
                    style: T.muted,
                    children: [
                      const TextSpan(text: 'Entrez le code envoyé au '),
                      TextSpan(
                        text: widget.phone,
                        style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 30),
                _otpRow(),
                const SizedBox(height: 26),
                _GradientButton(
                  label: 'Vérifier',
                  loading: _busy,
                  enabled: _complete,
                  onTap: _verify,
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Renvoyer dans 0:30',
                        style: TextStyle(color: NC.faint, fontSize: 13.5, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 8),
                    const Text('·', style: TextStyle(color: NC.faint)),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: _resend,
                      style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 6), minimumSize: const Size(0, 0)),
                      child: const Text('Renvoyer le code',
                          style: TextStyle(color: NC.brand, fontSize: 13.5, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    child: const Text('Changer de numéro',
                        style: TextStyle(color: NC.muted, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _otpRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(_len, (i) => _cell(i)),
    );
  }

  Widget _cell(int i) {
    final focused = _nodes[i].hasFocus;
    final filled = _cells[i].text.isNotEmpty;
    return SizedBox(
      width: 48,
      height: 58,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: NC.surfaceAlt,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: focused ? NC.brand : (filled ? NC.line : NC.line),
            width: focused ? 2 : 1,
          ),
        ),
        child: Center(
          child: TextField(
            controller: _cells[i],
            focusNode: _nodes[i],
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
            onChanged: (v) => _onChanged(i, v),
            onTap: () => setState(() {}),
          ),
        ),
      ),
    );
  }
}

/// Bouton principal 56px à dégradé de marque.
class _GradientButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool enabled;
  final bool loading;
  const _GradientButton({
    required this.label,
    required this.onTap,
    this.enabled = true,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final active = enabled && !loading;
    return Opacity(
      opacity: active ? 1 : 0.55,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: active ? onTap : null,
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              gradient: NC.brandGradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(color: NC.brand.withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 10)),
              ],
            ),
            alignment: Alignment.center,
            child: loading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                  )
                : Text(label,
                    style: const TextStyle(color: Colors.white, fontSize: 16.5, fontWeight: FontWeight.w800)),
          ),
        ),
      ),
    );
  }
}

/// Bouton social visuel (Google / Apple).
class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SocialButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            color: NC.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: NC.line, width: 1),
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: NC.ink, size: 24),
              const SizedBox(width: 8),
              Text(label,
                  style: const TextStyle(color: NC.ink, fontSize: 14.5, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}
