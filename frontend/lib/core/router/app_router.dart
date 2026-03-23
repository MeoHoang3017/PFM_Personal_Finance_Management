import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../di/injection.dart';
import '../../data/services/auth_service.dart';
import '../../presentation/screens/splash_screen.dart';
import '../../presentation/screens/auth/get_started_screen.dart';
import '../../presentation/screens/auth/login_screen.dart';
import '../../presentation/screens/auth/register_screen.dart';
import '../../presentation/screens/auth/forgot_password_screen.dart';
import '../../presentation/screens/auth/reset_password_screen.dart';
import '../../presentation/screens/home/home_screen.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();
GoRouter? _appRouter;

GoRouter createAppRouter() {
  return _appRouter ??= GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) async {
      final auth = getIt<AuthService>();
      final token = await auth.getAccessToken();
      final isAuth = token != null && token.isNotEmpty;
      final path = state.uri.path;
      final isLogin = path == '/login';
      final isRegister = path == '/register';
      final isGetStarted = path == '/get-started';
      final isForgot = path == '/forgot-password';
      final isReset = path == '/reset-password';
      final isSplash = path == '/';
      final isPublicAuth = isLogin || isRegister || isGetStarted || isForgot || isReset;

      if (isSplash) return null;
      if (!isAuth && !isPublicAuth) return '/get-started';
      if (isAuth && isPublicAuth) return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: '/get-started',
        builder: (_, __) => const GetStartedScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (_, __) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) {
          final email = state.uri.queryParameters['email'];
          return ResetPasswordScreen(email: email);
        },
      ),
      GoRoute(
        path: '/home',
        builder: (_, __) => const HomeScreen(),
      ),
    ],
  );
}
