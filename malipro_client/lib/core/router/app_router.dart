import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/home/home_shell.dart';
import '../../features/wallet/presentation/wallet_screen.dart';
import '../../features/cart/presentation/cart_screen.dart';
import '../../features/orders/presentation/checkout_screen.dart';
import '../../features/orders/presentation/order_detail_screen.dart';
import '../../features/chat/presentation/conversations_screen.dart';
import '../../features/chat/presentation/chat_screen.dart';
import '../../features/services/presentation/artisan_detail_screen.dart';
import '../../features/services/presentation/my_requests_screen.dart';
import '../../features/stores/presentation/stores_list_screen.dart';
import '../../features/stores/presentation/storefront_screen.dart';

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
      GoRoute(path: '/wallet', builder: (_, __) => const WalletScreen()),
      GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
      GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
      GoRoute(
        path: '/orders/:id',
        builder: (_, s) => OrderDetailScreen(orderId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/stores', builder: (_, __) => const StoresListScreen()),
      GoRoute(
        path: '/stores/:id',
        builder: (_, s) => StorefrontScreen(storeId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/services/requests', builder: (_, __) => const MyRequestsScreen()),
      GoRoute(
        path: '/services/:id',
        builder: (_, s) => ArtisanDetailScreen(artisanId: s.pathParameters['id']!),
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
