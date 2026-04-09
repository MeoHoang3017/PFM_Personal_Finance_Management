import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:toastification/toastification.dart';

import 'core/di/injection.dart';
import 'core/preferences/app_preferences.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await setupInjection();
  await getIt<AppPreferences>().loadFromStorage();
  await EasyLocalization.ensureInitialized();
  final startLocale = getIt<AppPreferences>().locale ?? const Locale('vi');
  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('vi'), Locale('en')],
      path: 'assets/translations',
      fallbackLocale: const Locale('vi'),
      startLocale: startLocale,
      saveLocale: false,
      child: const PfmApp(),
    ),
  );
}

class PfmApp extends StatefulWidget {
  const PfmApp({super.key});

  @override
  State<PfmApp> createState() => _PfmAppState();
}

class _PfmAppState extends State<PfmApp> {
  @override
  void initState() {
    super.initState();
    getIt<AppPreferences>().addListener(_onPreferencesChanged);
  }

  void _onPreferencesChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    getIt<AppPreferences>().removeListener(_onPreferencesChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final prefs = getIt<AppPreferences>();
    return ToastificationWrapper(
      child: MaterialApp.router(
        title: 'app_title'.tr(),
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: prefs.themeMode,
        locale: context.locale,
        supportedLocales: context.supportedLocales,
        localizationsDelegates: context.localizationDelegates,
        routerConfig: createAppRouter(),
      ),
    );
  }
}
