import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/app_palette_dark.dart';
import '../../../core/theme/app_palette_light.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/services/api_health_service.dart';
import '../../../data/services/auth_service.dart';

/// Đăng nhập — giao diện lấy FinTracker làm gốc: nút back, tiêu đề, input chỉ viền (border 16), nút đen/trắng, Remember me, Quên mật khẩu, OR, Google, link Đăng ký.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _loading = false;
  String? _errorMessage;
  bool? _backendConnected;

  @override
  void initState() {
    super.initState();
    _checkBackend();
  }

  Future<void> _checkBackend() async {
    final connected = await getIt<ApiHealthService>().checkConnection();
    if (mounted) setState(() => _backendConnected = connected);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final auth = getIt<AuthService>();
      final res = await auth.login(LoginRequest(
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
                    'Chào mừng trở lại',
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5,
                      color: isDark ? PaletteDark.whiteColor : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Đăng nhập để tiếp tục quản lý tài chính',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                    ),
                  ),
                  const SizedBox(height: 32),
                  if (_backendConnected != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: _backendConnected!
                            ? (isDark ? PaletteDark.primaryAction : PaletteLight.primaryAction).withValues(alpha: 0.15)
                            : (isDark ? PaletteDark.errorColor : PaletteLight.errorColor).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _backendConnected! ? Icons.check_circle : Icons.cloud_off,
                            size: 20,
                            color: _backendConnected!
                                ? (isDark ? PaletteDark.primaryAction : PaletteLight.primaryAction)
                                : (isDark ? PaletteDark.errorColor : PaletteLight.errorColor),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _backendConnected!
                                  ? 'Đã kết nối máy chủ'
                                  : 'Chưa kết nối máy chủ. Kiểm tra backend (port 5000).',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? PaletteDark.primaryText : PaletteLight.primaryText,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
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
                      hintText: 'Nhập mật khẩu',
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
                    validator: (v) => v == null || v.isEmpty ? 'Nhập mật khẩu' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Ghi nhớ đăng nhập',
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.push('/forgot-password'),
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: const Size(0, 0),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          'Quên mật khẩu?',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: isDark ? PaletteDark.whiteColor : Colors.black,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _loading
                          ? null
                          : () {
                              if (_formKey.currentState?.validate() ?? false) _login();
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
                              'Đăng nhập',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: Divider(
                          color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'HOẶC',
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Divider(
                          color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.g_mobiledata, size: 28),
                      label: const Text(
                        'Tiếp tục với Google',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.5,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: isDark ? PaletteDark.whiteColor : Colors.black87,
                        side: BorderSide(
                          color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: TextButton(
                      onPressed: () => context.push('/register'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Chưa có tài khoản? ',
                            style: TextStyle(
                              fontSize: 14,
                              color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                            ),
                          ),
                          Text(
                            'Đăng ký',
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
