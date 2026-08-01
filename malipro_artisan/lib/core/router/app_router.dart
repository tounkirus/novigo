import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/home/home_shell.dart';
import '../../features/chat/presentation/conversations_screen.dart';
import '../../features/chat/presentation/chat_screen.dart';
import '../../novigo/data/env.dart';
import '../../novigo/screens/voice_settings.dart';

GoRouter buildRouter(Ref ref) {
  final status = ref.read(authStatusProvider);
  return GoRouter(
    // Démonstration : ouvrir directement les annonces vocales.
    initialLocation: NovigoEnv.voiceHome ? '/voix' : '/',
    refreshListenable: status,
    redirect: (context, state) {
      if (!status.ready) return null;
      final loc = state.matchedLocation;
      // Les réglages vocaux restent atteignables même avant connexion : le module
      // vocal a sa propre session NOVIGO.
      if (loc == '/voix') return null;
      final onAuth = loc == '/login' || loc.startsWith('/otp');
      if (!status.loggedIn) return onAuth ? null : '/login';
      if (onAuth) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/otp',
        builder: (_, s) => OtpScreen(phone: s.uri.queryParameters['phone'] ?? ''),
      ),
      GoRoute(path: '/', builder: (_, __) => const HomeShell()),
      GoRoute(path: '/voix', builder: (_, __) => const VoiceSettingsScreen()),
      GoRoute(path: '/chat', builder: (_, __) => const ConversationsScreen()),
      GoRoute(
        path: '/chat/:id',
        builder: (_, s) => ChatScreen(conversationId: s.pathParameters['id']!),
      ),
    ],
  );
}

final routerProvider = Provider<GoRouter>((ref) => buildRouter(ref));
