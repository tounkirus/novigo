import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme.dart';
import 'features/auth/application/auth_controller.dart';
import 'features/notifications/presentation/push_notification_host.dart';

class MaliproMerchantApp extends ConsumerStatefulWidget {
  const MaliproMerchantApp({super.key});
  @override
  ConsumerState<MaliproMerchantApp> createState() =>
      _MaliproMerchantAppState();
}

class _MaliproMerchantAppState extends ConsumerState<MaliproMerchantApp> {
  @override
  void initState() {
    super.initState();
    // Instancie AuthController (bootstrap des tokens).
    ref.read(authControllerProvider);
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(authStatusProvider);
    return ListenableBuilder(
      listenable: status,
      builder: (context, _) {
        if (!status.ready) {
          return MaterialApp(
            theme: buildTheme(),
            darkTheme: buildDarkTheme(),
            themeMode: ThemeMode.system,
            debugShowCheckedModeBanner: false,
            home: const Scaffold(
                body: Center(child: CircularProgressIndicator())),
          );
        }
        return MaterialApp.router(
          title: 'NOVIGO Marchand',
          debugShowCheckedModeBanner: false,
          theme: buildTheme(),
          darkTheme: buildDarkTheme(),
          themeMode: ThemeMode.system,
          routerConfig: ref.read(routerProvider),
          builder: (context, child) =>
              PushNotificationHost(child: child ?? const SizedBox.shrink()),
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('fr'), Locale('en')],
        );
      },
    );
  }
}
