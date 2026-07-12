import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/home/home_shell.dart';
import '../../features/deliveries/presentation/delivery_detail_screen.dart';
import '../../features/chat/presentation/conversations_screen.dart';
import '../../features/chat/presentation/chat_screen.dart';

GoRouter buildRouter(Ref ref) {
  final status = ref.read(authStatusProvider);
  return GoRouter(
    initialLocation: '/',
    refreshListenable: status,
    redirect: (context, state) {
      if (!status.ready) return null;
      final loc = state.matchedLocation;
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
      GoRoute(
        path: '/deliveries/:id',
        builder: (_, s) =>
            DeliveryDetailScreen(deliveryId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/chat', builder: (_, __) => const ConversationsScreen()),
      GoRoute(
        path: '/chat/:id',
        builder: (_, s) => ChatScreen(conversationId: s.pathParameters['id']!),
      ),
    ],
  );
}

final routerProvider = Provider<GoRouter>((ref) => buildRouter(ref));
