import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme.dart';
import 'features/auth/application/auth_controller.dart';
import 'features/notifications/presentation/push_notification_host.dart';
import 'novigo/voice_boot.dart';

class MaliproArtisanApp extends ConsumerStatefulWidget {
  const MaliproArtisanApp({super.key});
  @override
  ConsumerState<MaliproArtisanApp> createState() => _MaliproArtisanAppState();
}

class _MaliproArtisanAppState extends ConsumerState<MaliproArtisanApp> {
  @override
  void initState() {
    super.initState();
    // Instancie AuthController (bootstrap des tokens).
    ref.read(authControllerProvider);
    // NOVIGO — annonces vocales : session propre + écoute du Gateway.
    // Sans --dart-define=NOVIGO_LIVE=true, cet appel ne fait rien.
    startVoiceDispatch();
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
          title: 'MALIPRO Artisan',
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
