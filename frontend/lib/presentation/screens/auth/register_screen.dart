import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/app_palette_dark.dart';
import '../../../core/theme/app_palette_light.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/services/auth_service.dart';

/// Đăng ký — giao diện FinTracker: nút back, tiêu đề, input chỉ viền, nút đen/trắng, link Đăng nhập.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _loading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final auth = getIt<AuthService>();
      final res = await auth.register(RegisterRequest(
        username: _usernameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
      ));
      if (!mounted) return;
      setState(() => _loading = false);
      if (res.isSuccess) {
        context.go('/home');
      } else {
        setState(() => _errorMessage = res.message);
      }
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _errorMessage = 'Lỗi kết nối';
      });
    }
  }

  InputDecoration _inputDecoration({
    required String labelText,
    required String hintText,
    required IconData prefixIcon,
    bool isDark = false,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: labelText,
      hintText: hintText,
      prefixIcon: Icon(
        prefixIcon,
        color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
      ),
      suffixIcon: suffixIcon,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: isDark ? PaletteDark.whiteColor : Colors.black,
          width: 2,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? PaletteDark.backgroundColor : Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 40),
                  IconButton(
                    onPressed: () => context.go('/get-started'),
                    icon: Icon(
                      Icons.arrow_back_ios_new,
                      color: isDark ? PaletteDark.whiteColor : Colors.black87,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(height: 40),
                  Text(
                    'Tạo tài khoản',
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5,
                      color: isDark ? PaletteDark.whiteColor : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Bắt đầu hành trình tài chính của bạn',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                    ),
                  ),
                  const SizedBox(height: 48),
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: (isDark ? PaletteDark.errorColor : PaletteLight.errorColor).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(
                          color: isDark ? PaletteDark.errorColor : PaletteLight.errorColor,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  TextFormField(
                    controller: _usernameController,
                    decoration: _inputDecoration(
                      labelText: 'Họ tên',
                      hintText: 'Nhập họ tên',
                      prefixIcon: Icons.person_outline,
                      isDark: isDark,
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'Nhập họ tên' : null,
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: _inputDecoration(
                      labelText: 'Email',
                      hintText: 'Nhập email',
                      prefixIcon: Icons.email_outlined,
                      isDark: isDark,
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'Nhập email' : null,
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: _inputDecoration(
                      labelText: 'Mật khẩu',
                      hintText: 'Tối thiểu 6 ký tự',
                      prefixIcon: Icons.lock_outline,
                      isDark: isDark,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Nhập mật khẩu';
                      if (v.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText: _obscureConfirmPassword,
                    decoration: _inputDecoration(
                      labelText: 'Xác nhận mật khẩu',
                      hintText: 'Nhập lại mật khẩu',
                      prefixIcon: Icons.lock_outline,
                      isDark: isDark,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirmPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                        ),
                        onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                      ),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Nhập xác nhận mật khẩu';
                      if (v != _passwordController.text) return 'Mật khẩu không khớp';
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _loading
                          ? null
                          : () {
                              if (_formKey.currentState?.validate() ?? false) _register();
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? Colors.white : Colors.black,
                        foregroundColor: isDark ? Colors.black : Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: _loading
                          ? SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: isDark ? Colors.black : Colors.white,
                              ),
                            )
                          : const Text(
                              'Đăng ký',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: TextButton(
                      onPressed: () => context.pop(),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
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
                              color: isDark ? PaletteDark.whiteColor : Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
