import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_palette_dark.dart';
import '../../../core/theme/app_palette_light.dart';
import '../../../core/theme/theme_palette.dart';

/// Màn chào màn hình kiểu FinTracker: nền trắng (light) / nền tối (dark), tiêu đề, nút Bắt đầu, link Đăng nhập.
class GetStartedScreen extends StatelessWidget {
  const GetStartedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final p = pfmPaletteOf(context);

    return Scaffold(
      backgroundColor: isDark ? PaletteDark.backgroundColor : Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const Spacer(flex: 2),
              Icon(
                Icons.account_balance_wallet_rounded,
                size: 120,
                color: isDark ? p.primaryAction : PaletteLight.primaryAction,
              ),
              const SizedBox(height: 32),
              Text(
                'Quản lý tài chính',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  height: 1.2,
                  letterSpacing: -0.5,
                  color: isDark ? PaletteDark.whiteColor : Colors.black87,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Theo dõi thu chi, lập ngân sách và đạt mục tiêu tài chính',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                  height: 1.5,
                ),
              ),
              const Spacer(flex: 1),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () => context.push('/register'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? Colors.white : Colors.black,
                    foregroundColor: isDark ? Colors.black : Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Bắt đầu',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => context.push('/login'),
                style: TextButton.styleFrom(
                  foregroundColor: (theme.textTheme.bodyMedium?.color)?.withValues(alpha: 0.7),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Đã có tài khoản? ',
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                      ),
                    ),
                    Text(
                      'Đăng nhập',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white : Colors.black,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
