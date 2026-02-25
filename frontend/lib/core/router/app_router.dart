import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../di/injection.dart';
import '../../data/services/auth_service.dart';
import '../../presentation/screens/splash_screen.dart';
import '../../presentation/screens/auth/login_screen.dart';
import '../../presentation/screens/auth/register_screen.dart';
import '../../presentation/screens/home/home_screen.dart';

GoRouter createAppRouter() {
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) async {
      final auth = getIt<AuthService>();
      final token = await auth.getAccessToken();
      final isAuth = token != null && token.isNotEmpty;
      final path = state.uri.path;
      final isLogin = path == '/login';
      final isRegister = path == '/register';
      final isSplash = path == '/';

      if (isSplash) return null;
      if (!isAuth && !isLogin && !isRegister) return '/login';
      if (isAuth && (isLogin || isRegister)) return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => const SplashScreen(),
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
        path: '/home',
        builder: (_, __) => const HomeScreen(),
      ),
    ],
  );
}
