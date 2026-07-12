import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../application/auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phone = TextEditingController(text: '+223');
  final _password = TextEditingController();
  bool _usePassword = false;
  bool _busy = false;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _busy = true);
    final phone = _phone.text.trim();
    try {
      if (_usePassword) {
        await ref
            .read(authControllerProvider.notifier)
            .loginWithPassword(phone, _password.text);
        if (mounted) context.go('/');
      } else {
        await ref.read(authControllerProvider.notifier).requestOtp(phone);
        if (mounted) context.push('/otp?phone=${Uri.encodeComponent(phone)}');
      }
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Row(
                  children: [
                    Icon(Icons.delivery_dining, color: AppColors.gold, size: 34),
                    SizedBox(width: 10),
                    Text('NOVIGO',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 4),
                const Text('Espace Livreur',
                    style: TextStyle(color: Colors.white70)),
                const SizedBox(height: 28),
                SectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Connexion',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phone,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                            labelText: 'Téléphone', hintText: '+22375000000'),
                      ),
                      if (_usePassword) ...[
                        const SizedBox(height: 12),
                        TextField(
                          controller: _password,
                          obscureText: true,
                          decoration:
                              const InputDecoration(labelText: 'Mot de passe'),
                        ),
                      ],
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _busy ? null : _submit,
                        child: Text(_busy
                            ? '...'
                            : (_usePassword ? 'Se connecter' : 'Recevoir le code')),
                      ),
                      TextButton(
                        onPressed: _busy
                            ? null
                            : () => setState(() => _usePassword = !_usePassword),
                        child: Text(_usePassword
                            ? 'Utiliser un code SMS (OTP)'
                            : 'Se connecter par mot de passe'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
